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

        #region Devis

        public static MemoryStream NewGeneratePdfForDevis(string path, CostPlan devis, string DownloadTechSheetUrl, bool withTechSheet = false)
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

            string reportTitle = string.Format("DEVIS N° : {0}", devis.CplCode);

            string content = HeaderFooter != null ? HeaderFooter.CostPlanHeader : string.Empty;

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

            #region header

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
            cell = CreateHeaderCell(devis.ClientCompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(devis.Inv_CcoFirstname + " " + devis.Inv_CcoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            cell = CreateHeaderCell(devis.CplClient.Address1, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(devis.ClientCompanyName, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            cell = CreateHeaderCell(devis.CplClient.Address2, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            string cpville = string.Format("{0}{2}{1}{3}{4}",
                devis.CplClient.Postcode,
                devis.CplClient.City,
                !string.IsNullOrEmpty(devis.CplClient.Postcode) && !string.IsNullOrEmpty(devis.CplClient.City) ? " / " : "",
               (!string.IsNullOrEmpty(devis.CplClient.Postcode) || !string.IsNullOrEmpty(devis.CplClient.City)) && !string.IsNullOrEmpty(devis.CplClient.Country) ? " " : "",
                devis.CplClient.Country);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(cpville, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
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

            #endregion header

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Madame, Monsieur"), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Voici notre offre de prix concernant votre demande."), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            if (!string.IsNullOrEmpty(devis.CplHeaderText))
            {
                string newline = devis.CplHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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



            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("Date de création : {0:dd-MMM-yyyy}", devis.CplDateCreation), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de création : {0:dd-MMM-yyyy}", devis.CplDateCreation), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de validité : {0:dd-MMM-yyyy}", devis.CplDateValidity), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom d'Affaire : {0}", devis.PrjName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom de Devis : {0}", devis.CplName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //var prdNoNull = devis.CostPlanLines.FirstOrDefault(m => m.PrdId != 0);
            //if (prdNoNull != null)
            //{
            //    cell = CreateHeaderCell(string.Format("Fiche Technique (cliquer):"), BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell(string.Format("http://t.e-c-o.com?p={0}", prdNoNull.ClnPrdName), BaseColor.WHITE, 14, bodyFont1stLink, false, Alignement.Left, false, false, leading, -1);
            //    table.AddCell(cell);
            //}
            //else
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //    table.AddCell(cell);
            //}

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

            //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

            int clientInvoiceLineCount = devis.CostPlanLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = devis.CostPlanLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.ClnPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.ClnPrdName;
                string Description = cil.ClnDescription;
                string PrdDescription = cil.ClnPrdDes;

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
                        allDes = string.Format("{0}<br/>FICHE TECHNIQUE: <br/><span style='color:#0877BA'>{2}?p={1}</span>", allDes, cil.ClnPrdName, DownloadTechSheetUrl);
                    }
                }

                if (allDes.Length > 600)
                {
                    allDes = string.Format("{0} ... ...", allDes.Substring(0, 600));
                }

                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", cil.ClnQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", cil.ClnUnitPrice) : string.Empty;
                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n2}", cil.ClnTotalPrice) : string.Empty;
                string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", cil.ClnPriceWithDiscountHt) : string.Empty;



                //Font link = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.UNDERLINE, new BaseColor(0, 0, 255));
                //Anchor anchor = new Anchor("est[-3.00]li[3.00]n[3.00]k", link);
                //anchor.Reference = "http://www.mikesdotnetting.com";
                //Phrase ptest = new Phrase(anchor);

                //cell = new PdfPCell();
                //var c = new Chunk(prdName, bodyFont1st);
                ////c.SetAction(new PdfAction("https://www.google.com"));
                ////c.SetAnchor("https://www.google.com");
                //c.SetRemoteGoto("https://www.google.com", 1);
                //cell.Colspan = 3;
                //cell.AddElement(c);
                //table.AddCell(cell);

                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //LTPID = 3 : text
                if (cil.LtpId != 3)
                {
                    //string prdImagePath = cil.PrdImgPath;
                    //if (File.Exists(prdImagePath))
                    //{
                    //    //prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                    //    // Load the image
                    //    iTextSharp.text.Image prdImage = iTextSharp.text.Image.GetInstance(prdImagePath);

                    //    // Set a fixed height for the image
                    //    float fixedImageHeight = 30f;  // Example fixed height for the image

                    //    // Calculate width while maintaining the aspect ratio
                    //    float originalWidth = prdImage.ScaledWidth;
                    //    float originalHeight = prdImage.ScaledHeight;
                    //    float aspectRatio = originalWidth / originalHeight;
                    //    float fixedImageWidth = fixedImageHeight * aspectRatio;

                    //    // Scale the image to the fixed height, adjusting the width accordingly
                    //    prdImage.ScaleToFit(fixedImageWidth, fixedImageHeight);

                    //    // Create the cell and add the image
                    //    PdfPCell imageCell = new PdfPCell(prdImage, true)
                    //    {
                    //        VerticalAlignment = Element.ALIGN_MIDDLE,  // Center the image vertically
                    //        HorizontalAlignment = Element.ALIGN_CENTER,  // Center the image horizontally
                    //        Colspan = 2,  // Number of columns the cell spans
                    //        BorderWidthBottom = 0.5f,
                    //        BorderWidthLeft = 0,
                    //        BorderWidthTop = 0.5f,
                    //        BorderWidthRight = 0,
                    //        FixedHeight = fixedImageHeight,  // Fixed height of the cell
                    //        PaddingTop = 5f,  // Optional padding if needed
                    //        PaddingBottom = 5f,  // Optional padding if needed
                    //        PaddingLeft = 5f,  // Optional padding if needed
                    //        PaddingRight = 5f  // Optional padding if needed
                    //    };

                    //    // Add the cell to the table

                    //    table.AddCell(imageCell);
                    //}
                    //else
                    //{
                    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, isDescription: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    //    table.AddCell(cell);
                    //}
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 6, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, isDescription: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnPriceWithDiscount, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", ClnTotalPrice, devis.CurrencySymbol), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);

                }
                else
                {
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 15, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, isDescription: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    //table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
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
                        //cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 5, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("P. PUB", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("P. REMISÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("MNT HT", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        //table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 6, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            if (!string.IsNullOrEmpty(devis.CplFooterText))
            {
                string newline = devis.CplFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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


            var comment = devis.CplClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                for (int i = 0; i < 3; i++)
                {
                    table = CreateTable(nbColumns, 0, defineWidths);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                }
                string newline = comment.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = comment.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();

                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 14, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                    table.AddCell(cell);
                }
                AddTable(middleTable, table);
            }

            //if (!string.IsNullOrEmpty(comment))
            //{
            //    // 为了给comment 留位置 12/01/2015
            //    for (int i = 0; i < 3; i++)
            //    {
            //        table = CreateTable(nbColumns, 0, defineWidths);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //        table.AddCell(cell);
            //        //AddTable(middleTable, table);
            //        if (LastLineTotalHeight >= 720)
            //        {
            //            break;
            //        }
            //    }
            //    if (comment.Contains("\n"))
            //    {
            //        List<string> listContent = comment.Split('\n').ToList();
            //        int contentCount = listContent.Count();

            //        for (int index = 0; index < contentCount; index++)
            //        {
            //            string conS = listContent.ElementAt(index);

            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);

            //            cell = CreateHeaderCell(conS, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            if (index == 0)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else if (index == 1)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else if (index == 2)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else if (index == 3)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);

            //            //AddTable(middleTable, table);
            //        }
            //        if (contentCount < 4)
            //        {
            //            if (contentCount == 1)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);

            //                //AddTable(middleTable, table);
            //            }
            //            else if (contentCount == 2)
            //            {

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, withTopBorder: false, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);



            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                //AddTable(middleTable, table);
            //            }
            //            else if (contentCount == 3)
            //            {


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                //AddTable(middleTable, table);
            //            }
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont2, false, Alignement.Left, false, false, leading);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(comment, BaseColor.WHITE, 18, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0);
            //        table.AddCell(cell);


            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);


            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);


            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        //AddTable(middleTable, table);
            //    }
            //    AddTable(middleTable, table);
            //}


            // add table to check the end of page

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

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Remarque : {0}", devis.UsrCommercial1), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);





            // total line 

            // total line title
            var allLines = devis.CostPlanLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (devis.CplDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 4 : 3;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity);
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (1 + m.VatRate / 100));
            var discount = devis.CplDiscountAmount ?? 0;
            var netHt = totalHT - discount;
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (m.VatRate / 100));
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
            cell = CreateHeaderCell(string.Format("{0:n2} {1}", totalHT, devis.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                    var baseHt = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2)).Distinct().Sum(m => (m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity);
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2)).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (m.VatRate / 100));
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
                        //if (lineIdxForCalculate == 3)
                        //{
                        //    fieldName = "NET À PAYER";
                        //    fieldValue = totalTtcNet;
                        //}
                    }
                    cell = CreateHeaderCell(fieldName, BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, devis.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                        //if (lineIdxForCalculate == 3)
                        //{
                        //    fieldName = "NET À PAYER";
                        //    fieldValue = totalTtcNet;
                        //}
                    }
                    cell = CreateHeaderCell(fieldName, BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, devis.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }




            //cell = CreateHeaderCell("BASES HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            ////bool withRemise = devis.Commission.Amount != 0;
            //bool withRemise = false;
            //if (withRemise)
            //{
            //    cell = CreateHeaderCell("REMISE", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell("MNT TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell("% TVA", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}
            //else
            //{
            //    cell = CreateHeaderCell("MONTANT TVA", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell("% TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}

            //cell = CreateHeaderCell("TOTAUX", BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            ////cell = CreateHeaderCell("TOTAL TTC", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //// mdofication 2015-10-15 for JP Marino facture0162
            //cell = CreateHeaderCell("TOTAL HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("NET À PAYER", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);



            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //var totalBrut = devis.CostPlanLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnTotalCrudePrice);
            //var totalHT = devis.CostPlanLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnTotalPrice);
            //// total line content
            //cell = CreateHeaderCell(string.Format("{0:n2}", totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //if (withRemise)
            //{
            //    //cell = CreateHeaderCell(string.Format("{0:n2}", devis.Commission.Amount), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    //table.AddCell(cell);
            //    //cell = CreateHeaderCell(string.Format("{0:n2}", devis.DevisLines.Sum(m => m.TotalPrice * m.TVA.DcValue / 100)), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    //table.AddCell(cell);
            //    //cell = CreateHeaderCell(string.Format("{0:n2}", devis.DevisLines.Sum(m => m.TotalPrice * m.TVA.DcValue / 100) * 100 / (devis.DevisLines.Sum(m => m.TotalPrice))), BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    //table.AddCell(cell);
            //}
            //else
            //{
            //    cell = CreateHeaderCell(string.Format("{0:n2}", totalBrut), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell(string.Format("{0:n2}", (totalBrut - totalHT) * 100 / totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}

            //var sumPaid = 0;
            //string totauxtitle = string.Format("HT\nTVA");
            //string totaux = string.Format("{0:n2} \n{1:n2}", totalHT, (totalBrut - totalHT));

            //if (withRemise)
            //{
            //    //totauxtitle = string.Format("{0}\nRemise", totauxtitle);
            //    //totaux = string.Format("{0}\n- {1:n2}", totaux, devis.Commission.Amount);
            //}

            //cell = CreateHeaderCell(totauxtitle, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format(":\n:{0}", withRemise ? "\n:" : ""), BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, false, false, leading, -20, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(totaux, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, false, true, leading, -30, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
            //table.AddCell(cell);

            ////cell = CreateHeaderCell(string.Format("\n{0:n2}", totalBrut), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //cell = CreateHeaderCell(string.Format("\n{0:n2}", totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //// mdofication 2015-10-15 for JP Marino facture0162
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("\n{0:n2}", totalBrut), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);


            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            content = HeaderFooter != null ? HeaderFooter.CostPlanFooter : string.Empty;
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


        public static MemoryStream NewGeneratePdfForDevisWithImg(string path, CostPlan devis, string DownloadTechSheetUrl, bool withTechSheet = false)
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

            string reportTitle = string.Format("DEVIS N° : {0}", devis.CplCode);

            string content = HeaderFooter != null ? HeaderFooter.CostPlanHeader : string.Empty;

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

            #region header

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
            cell = CreateHeaderCell(devis.ClientCompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(devis.Inv_CcoFirstname + " " + devis.Inv_CcoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            cell = CreateHeaderCell(devis.CplClient.Address1, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            //cell = CreateHeaderCell(devis.ClientCompanyName, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            cell = CreateHeaderCell(devis.CplClient.Address2, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            string cpville = string.Format("{0}{2}{1}{3}{4}",
                devis.CplClient.Postcode,
                devis.CplClient.City,
                !string.IsNullOrEmpty(devis.CplClient.Postcode) && !string.IsNullOrEmpty(devis.CplClient.City) ? " / " : "",
               (!string.IsNullOrEmpty(devis.CplClient.Postcode) || !string.IsNullOrEmpty(devis.CplClient.City)) && !string.IsNullOrEmpty(devis.CplClient.Country) ? " " : "",
                devis.CplClient.Country);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(cpville, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
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

            #endregion header

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Madame, Monsieur"), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Voici notre offre de prix concernant votre demande."), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            if (!string.IsNullOrEmpty(devis.CplHeaderText))
            {
                string newline = devis.CplHeaderText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplHeaderText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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



            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("Date de création : {0:dd-MMM-yyyy}", devis.CplDateCreation), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de création : {0:dd-MMM-yyyy}", devis.CplDateCreation), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date de validité : {0:dd-MMM-yyyy}", devis.CplDateValidity), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);


            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom d'Affaire : {0}", devis.PrjName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Nom de Devis : {0}", devis.CplName), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //table.AddCell(cell);
            //var prdNoNull = devis.CostPlanLines.FirstOrDefault(m => m.PrdId != 0);
            //if (prdNoNull != null)
            //{
            //    cell = CreateHeaderCell(string.Format("Fiche Technique (cliquer):"), BaseColor.WHITE, 4, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell(string.Format("http://t.e-c-o.com?p={0}", prdNoNull.ClnPrdName), BaseColor.WHITE, 14, bodyFont1stLink, false, Alignement.Left, false, false, leading, -1);
            //    table.AddCell(cell);
            //}
            //else
            //{
            //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            //    table.AddCell(cell);
            //}

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

            //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

            int clientInvoiceLineCount = devis.CostPlanLines.Count;
            bool withTopBorder = true;
            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = devis.CostPlanLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.ClnPrdName : string.Empty;
                string prdName = !string.IsNullOrEmpty(cil.PitName) ? cil.PitName : cil.ClnPrdName;
                string Description = cil.ClnDescription;
                string PrdDescription = cil.ClnPrdDes;

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
                        allDes = string.Format("{0}<br/>FICHE TECHNIQUE: <br/><span style='color:#0877BA'>{2}?p={1}</span>", allDes, cil.ClnPrdName, DownloadTechSheetUrl);
                    }
                }
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", cil.ClnQuantity) : string.Empty;
                string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", cil.ClnUnitPrice) : string.Empty;
                string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n2}", cil.ClnTotalPrice) : string.Empty;
                string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;
                string ClnPriceWithDiscount = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n2}", cil.ClnPriceWithDiscountHt) : string.Empty;



                //Font link = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.UNDERLINE, new BaseColor(0, 0, 255));
                //Anchor anchor = new Anchor("est[-3.00]li[3.00]n[3.00]k", link);
                //anchor.Reference = "http://www.mikesdotnetting.com";
                //Phrase ptest = new Phrase(anchor);

                //cell = new PdfPCell();
                //var c = new Chunk(prdName, bodyFont1st);
                ////c.SetAction(new PdfAction("https://www.google.com"));
                ////c.SetAnchor("https://www.google.com");
                //c.SetRemoteGoto("https://www.google.com", 1);
                //cell.Colspan = 3;
                //cell.AddElement(c);
                //table.AddCell(cell);

                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                //LTPID = 3 : text
                if (cil.LtpId != 3)
                {
                    string prdImagePath = cil.PrdImgPath;
                    if (File.Exists(prdImagePath))
                    {
                        //prdImagePath = string.Format("{0}\\img\\Empty.png", path);
                        // Load the image
                        iTextSharp.text.Image prdImage = iTextSharp.text.Image.GetInstance(prdImagePath);

                        // Set a fixed height for the image
                        float fixedImageHeight = 30f;  // Example fixed height for the image

                        // Calculate width while maintaining the aspect ratio
                        float originalWidth = prdImage.ScaledWidth;
                        float originalHeight = prdImage.ScaledHeight;
                        float aspectRatio = originalWidth / originalHeight;
                        float fixedImageWidth = fixedImageHeight * aspectRatio;

                        // Scale the image to the fixed height, adjusting the width accordingly
                        prdImage.ScaleToFit(fixedImageWidth, fixedImageHeight);

                        // Create the cell and add the image
                        PdfPCell imageCell = new PdfPCell(prdImage, true)
                        {
                            VerticalAlignment = Element.ALIGN_MIDDLE,  // Center the image vertically
                            HorizontalAlignment = Element.ALIGN_CENTER,  // Center the image horizontally
                            Colspan = 2,  // Number of columns the cell spans
                            BorderWidthBottom = 0.5f,
                            BorderWidthLeft = 0,
                            BorderWidthTop = 0.5f,
                            BorderWidthRight = 0,
                            FixedHeight = fixedImageHeight,  // Fixed height of the cell
                            PaddingTop = 5f,  // Optional padding if needed
                            PaddingBottom = 5f,  // Optional padding if needed
                            PaddingLeft = 5f,  // Optional padding if needed
                            PaddingRight = 5f  // Optional padding if needed
                        };

                        // Add the cell to the table

                        table.AddCell(imageCell);
                    }
                    else
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, isDescription: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                    }
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 5, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, isDescription: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(ClnPriceWithDiscount, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", ClnTotalPrice, devis.CurrencySymbol), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);

                }
                else
                {
                    cell = CreateHeaderCell(allDes, BaseColor.WHITE, 15, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, isDescription: true, withTopBorder: withTopBorder, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                AddTable(middleTable, table);
                table = CreateTable(nbColumns, 0, defineWidths);

                if (LastLineTotalHeight > 710)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
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
                        //cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("IMAGE", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 5, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("P. PUB", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("P. REMISÉ", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        //table.AddCell(cell);
                        //cell = CreateHeaderCell("MNT HT", BaseColor.LIGHT_GRAY, 2, bodyFont1st, false, Alignement.Center, false, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, bodyFont1st, false, Alignement.Left, false, false, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        AddTable(middleTable, table);
                    }
                }
            }

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            if (!string.IsNullOrEmpty(devis.CplFooterText))
            {
                string newline = devis.CplFooterText.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = devis.CplFooterText.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();
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


            var comment = devis.CplClientComment;

            if (!string.IsNullOrEmpty(comment))
            {
                for (int i = 0; i < 3; i++)
                {
                    table = CreateTable(nbColumns, 0, defineWidths);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                }
                string newline = comment.Contains("\r\n") ? "\r\n" : "\n";
                var Lines = comment.Split(new string[] { newline }, StringSplitOptions.RemoveEmptyEntries).ToList();

                foreach (var oneLine in Lines)
                {
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(oneLine, BaseColor.WHITE, 14, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 4, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
                    table.AddCell(cell);
                }
                AddTable(middleTable, table);
            }

            //if (!string.IsNullOrEmpty(comment))
            //{
            //    // 为了给comment 留位置 12/01/2015
            //    for (int i = 0; i < 3; i++)
            //    {
            //        table = CreateTable(nbColumns, 0, defineWidths);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
            //        table.AddCell(cell);
            //        //AddTable(middleTable, table);
            //        if (LastLineTotalHeight >= 720)
            //        {
            //            break;
            //        }
            //    }
            //    if (comment.Contains("\n"))
            //    {
            //        List<string> listContent = comment.Split('\n').ToList();
            //        int contentCount = listContent.Count();

            //        for (int index = 0; index < contentCount; index++)
            //        {
            //            string conS = listContent.ElementAt(index);

            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //            table.AddCell(cell);

            //            cell = CreateHeaderCell(conS, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);
            //            if (index == 0)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else if (index == 1)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else if (index == 2)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else if (index == 3)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            else
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //            }
            //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //            table.AddCell(cell);

            //            //AddTable(middleTable, table);
            //        }
            //        if (contentCount < 4)
            //        {
            //            if (contentCount == 1)
            //            {
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);

            //                //AddTable(middleTable, table);
            //            }
            //            else if (contentCount == 2)
            //            {

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, withTopBorder: false, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);



            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                //AddTable(middleTable, table);
            //            }
            //            else if (contentCount == 3)
            //            {


            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //                table.AddCell(cell);

            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //                table.AddCell(cell);
            //                //AddTable(middleTable, table);
            //            }
            //        }
            //    }
            //    else
            //    {
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont2, false, Alignement.Left, false, false, leading);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(comment, BaseColor.WHITE, 18, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0);
            //        table.AddCell(cell);


            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);


            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);


            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //        table.AddCell(cell);

            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
            //        table.AddCell(cell);
            //        //AddTable(middleTable, table);
            //    }
            //    AddTable(middleTable, table);
            //}


            // add table to check the end of page

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

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Remarque : {0}", devis.UsrCommercial1), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);





            // total line 

            // total line title
            var allLines = devis.CostPlanLines;
            var tvaUsed = allLines.Select(m => m.VatId).Distinct().ToList();
            int tvaCount = tvaUsed.Count;

            bool withDiscount = (devis.CplDiscountAmount ?? 0) != 0;
            int totalFieldLineCount = withDiscount ? 4 : 3;
            var totalHT = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => (m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity);
            var totalTtc = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (1 + m.VatRate / 100));
            var discount = devis.CplDiscountAmount ?? 0;
            var netHt = totalHT - discount;
            var totalTva = allLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (m.VatRate / 100));
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
            cell = CreateHeaderCell(string.Format("{0:n2} {1}", totalHT, devis.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                    var baseHt = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2)).Distinct().Sum(m => (m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity);
                    var tvarate = allLines.FirstOrDefault(m => m.VatId == oneTva).VatRate;
                    var tvaamount = allLines.Where(m => m.VatId == oneTva && (m.LtpId == 4 || m.LtpId == 2)).Sum(m => ((m.ClnPriceWithDiscountHt ?? m.ClnUnitPrice) * m.ClnQuantity) * (m.VatRate / 100));
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
                        //if (lineIdxForCalculate == 3)
                        //{
                        //    fieldName = "NET À PAYER";
                        //    fieldValue = totalTtcNet;
                        //}
                    }
                    cell = CreateHeaderCell(fieldName, BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, devis.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                        //if (lineIdxForCalculate == 3)
                        //{
                        //    fieldName = "NET À PAYER";
                        //    fieldValue = totalTtcNet;
                        //}
                    }
                    cell = CreateHeaderCell(fieldName, BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2} {1}", fieldValue, devis.CurrencySymbol), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                }
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

            }




            //cell = CreateHeaderCell("BASES HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            ////bool withRemise = devis.Commission.Amount != 0;
            //bool withRemise = false;
            //if (withRemise)
            //{
            //    cell = CreateHeaderCell("REMISE", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell("MNT TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell("% TVA", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}
            //else
            //{
            //    cell = CreateHeaderCell("MONTANT TVA", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell("% TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}

            //cell = CreateHeaderCell("TOTAUX", BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            ////cell = CreateHeaderCell("TOTAL TTC", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //// mdofication 2015-10-15 for JP Marino facture0162
            //cell = CreateHeaderCell("TOTAL HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell("NET À PAYER", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);



            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //var totalBrut = devis.CostPlanLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnTotalCrudePrice);
            //var totalHT = devis.CostPlanLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnTotalPrice);
            //// total line content
            //cell = CreateHeaderCell(string.Format("{0:n2}", totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            //if (withRemise)
            //{
            //    //cell = CreateHeaderCell(string.Format("{0:n2}", devis.Commission.Amount), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    //table.AddCell(cell);
            //    //cell = CreateHeaderCell(string.Format("{0:n2}", devis.DevisLines.Sum(m => m.TotalPrice * m.TVA.DcValue / 100)), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    //table.AddCell(cell);
            //    //cell = CreateHeaderCell(string.Format("{0:n2}", devis.DevisLines.Sum(m => m.TotalPrice * m.TVA.DcValue / 100) * 100 / (devis.DevisLines.Sum(m => m.TotalPrice))), BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    //table.AddCell(cell);
            //}
            //else
            //{
            //    cell = CreateHeaderCell(string.Format("{0:n2}", totalBrut), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //    cell = CreateHeaderCell(string.Format("{0:n2}", (totalBrut - totalHT) * 100 / totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //    table.AddCell(cell);
            //}

            //var sumPaid = 0;
            //string totauxtitle = string.Format("HT\nTVA");
            //string totaux = string.Format("{0:n2} \n{1:n2}", totalHT, (totalBrut - totalHT));

            //if (withRemise)
            //{
            //    //totauxtitle = string.Format("{0}\nRemise", totauxtitle);
            //    //totaux = string.Format("{0}\n- {1:n2}", totaux, devis.Commission.Amount);
            //}

            //cell = CreateHeaderCell(totauxtitle, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format(":\n:{0}", withRemise ? "\n:" : ""), BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, false, false, leading, -20, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(totaux, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, false, true, leading, -30, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
            //table.AddCell(cell);

            ////cell = CreateHeaderCell(string.Format("\n{0:n2}", totalBrut), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //cell = CreateHeaderCell(string.Format("\n{0:n2}", totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //// mdofication 2015-10-15 for JP Marino facture0162
            //table.AddCell(cell);

            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);
            //cell = CreateHeaderCell(string.Format("\n{0:n2}", totalBrut), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);


            //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            //table.AddCell(cell);

            // total line end

            // reserve de propriete

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
            table.AddCell(cell);


            content = HeaderFooter != null ? HeaderFooter.CostPlanFooter : string.Empty;
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

        //private static MemoryStream NewGeneratePdfForDevis_OLD(string path, CostPlan devis)
        //{
        //    CommonServices CommonServices = new CommonServices();
        //    //CommissionServices CommissionServices = new CommissionServices();
        //    doc = new Document(iTextSharp.text.PageSize.A4, 10, 10, 15, 15);
        //    landscape = false;
        //    spacing = 0;
        //    cellAdded = false;
        //    _title = new StringBuilder();
        //    pageSize = doc.PageSize.Height;
        //    var output = new MemoryStream();
        //    writer = PdfWriter.GetInstance(doc, output);
        //    doc.Open();

        //    _path = path;

        //    float[] defineWidths = new float[] { 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F, };
        //    int nbColumns = 19;
        //    repeateHeaderTable = false;

        //    PdfPTable headerTable = CreateTable(1);

        //    _headerTable = CreateTable(1, 0);
        //    finalTable = CreateTable(1, 0);
        //    middleTable = CreateTable(1, 0);

        //    table = CreateTable(nbColumns, 0, defineWidths);


        //    float leading = 1;

        //    #region Set space white

        //    string textSpace = " ";

        //    var HeaderFooter = CommonServices.GetHeaderFooter();

        //    #region Header

        //    string reportTitle = string.Format("DEVIS N° : {0}", devis.CplCode);

        //    string content = HeaderFooter != null ? HeaderFooter.CostPlanHeader : string.Empty;

        //    for (int i = 0; i < 2; i++)
        //    {
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
        //        table.AddCell(cell);
        //    }

        //    if (!string.IsNullOrEmpty(content))
        //    {
        //        if (content.Contains("\n"))
        //        {
        //            List<string> listContent = content.Split('\n').ToList();
        //            int contentCount = listContent.Count();

        //            for (int index = 0; index < contentCount; index++)
        //            {
        //                string conS = listContent.ElementAt(index);
        //                cell = CreateHeaderCell(conS, BaseColor.WHITE, 10, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130, forContent: false);
        //                table.AddCell(cell);
        //                if (index == 0)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else if (index == 1)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else if (index == 2)
        //                {
        //                    cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else if (index == 3)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                table.AddCell(cell);
        //            }
        //            if (contentCount < 4)
        //            {
        //                if (contentCount == 1)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 130, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);

        //                }
        //                else if (contentCount == 2)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, false, false, leading, withTopBorder: false, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else if (contentCount == 3)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //            }
        //        }
        //        else
        //        {
        //            cell = CreateHeaderCell(content, BaseColor.WHITE, 19, headerTextFont2, false, Alignement.Left, false, false, leading, borderLeft: 130);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //            table.AddCell(cell);
        //        }
        //    }
        //    else
        //    {
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);

        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, false, Alignement.Left, true, true, leading, withTopBorder: true, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);

        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(reportTitle, BaseColor.WHITE, 8, headerTextFont2, false, Alignement.Center, true, true, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);

        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, headerTextFont, true, Alignement.Left, true, true, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //        table.AddCell(cell);

        //    }

        //    #endregion Header


        //    for (int i = 0; i < 1; i++)
        //    {
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 130);
        //        table.AddCell(cell);
        //    }
        //    #endregion Set space white

        //    #region header

        //    float spaceLogo = 0;

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);


        //    // liv
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Center, true, true, leading, -1, withTopBorder: true);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    // fac
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1, withTopBorder: true);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0, withTopBorder: true);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    //liv
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("ADRESSE DE LIVRAISON"), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, true, true, leading, 10);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    // fac
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(devis.ClientCompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, footerTop: 0);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    // liv
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(devis.ClientCompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    // fac
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(devis.Dlv_CcoFirstname + " " + devis.Dlv_CcoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    // liv
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(devis.Dlv_CcoAddress1, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    // fac
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(devis.Inv_CcoAddress1, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    bool hasAdr2 = false;
        //    bool? hasAdr2Liv = null;
        //    if (!string.IsNullOrEmpty(devis.Dlv_CcoAddress2))
        //    {
        //        hasAdr2 = true;
        //        if (!string.IsNullOrEmpty(devis.Dlv_CcoAddress2))
        //        {
        //            hasAdr2Liv = true;
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell); cell = CreateHeaderCell(devis.Dlv_CcoAddress2, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //        }
        //        else
        //        {
        //            hasAdr2Liv = false;
        //            string cpvilleLiv0 = string.Format("{0} {2} {1}", devis.Dlv_CcoPostcode, devis.Dlv_CcoCity, !string.IsNullOrEmpty(devis.Dlv_CcoPostcode) && !string.IsNullOrEmpty(devis.Dlv_CcoCity) ? "/" : "");
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell); cell = CreateHeaderCell(cpvilleLiv0, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //        }

        //        //cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //        //table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(devis.Dlv_CcoAddress2, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //        table.AddCell(cell);
        //    }


        //    if (!hasAdr2)
        //    {
        //        if (!string.IsNullOrEmpty(devis.Dlv_CcoAddress2))
        //        {
        //            hasAdr2Liv = true;
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell); cell = CreateHeaderCell(devis.Dlv_CcoAddress2, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //        }
        //        else
        //        {
        //            hasAdr2Liv = false;
        //            //string cpvilleLiv0 = string.Format("{0} / {1}", devis.ContactClient.PostCode, devis.ContactClient.City);
        //            string cpvilleLiv0 = string.Format("{0} {2} {1}", devis.Dlv_CcoPostcode, devis.Dlv_CcoCity, !string.IsNullOrEmpty(devis.Dlv_CcoPostcode) && !string.IsNullOrEmpty(devis.Dlv_CcoCity) ? "/" : "");
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell); cell = CreateHeaderCell(cpvilleLiv0, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //        }
        //    }
        //    else
        //    {
        //        if (hasAdr2Liv.Value)
        //        {
        //            string cpvilleLiv0 = string.Format("{0} {2} {1}", devis.Dlv_CcoPostcode, devis.Dlv_CcoCity, !string.IsNullOrEmpty(devis.Dlv_CcoPostcode) && !string.IsNullOrEmpty(devis.Dlv_CcoCity) ? "/" : "");
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(cpvilleLiv0, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //        }
        //        else
        //        {
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, true, true, leading, 10);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //            table.AddCell(cell);
        //        }
        //    }

        //    string cpville = string.Format("{0} {2} {1}", devis.Inv_CcoPostcode, devis.Inv_CcoCity, !string.IsNullOrEmpty(devis.Inv_CcoPostcode) && !string.IsNullOrEmpty(devis.Inv_CcoCity) ? "/" : "");
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(cpville, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);



        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, true, true, leading, spaceLogo, forFooter: true, footerTop: 0);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, true, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, headerTextFont, true, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    #endregion header

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);


        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);


        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("Madame, Monsieur"), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("Voici notre offre de prix concernant votre demande."), BaseColor.WHITE, 18, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("Date : {0:dd-MMM-yyyy}", DateTime.Now), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("Date de validité : {0:dd-MMM-yyyy}", devis.CplDateValidity), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);


        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("Mode de règlement : {0}", devis.PaymentMode), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("Condition de règlement : {0}", devis.PaymentCondition), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);


        //    //cell = CreateHeaderCell(string.Format("N/Id CEE : {0}", cin.Client.TVAIntra), BaseColor.WHITE, 8, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    //table.AddCell(cell);



        //    // références, client invocie line
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
        //    table.AddCell(cell);


        //    AddTable(middleTable, table);
        //    table = CreateTable(nbColumns, 0, defineWidths);

        //    // title
        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    //cell = CreateHeaderCell("NL", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    //table.AddCell(cell);
        //    cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell("DÉSIGNATION", BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell("QTÉ", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell("P.U. HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell("MNT HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    //cell = CreateHeaderCell("ACOMPTE", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    //table.AddCell(cell);
        //    cell = CreateHeaderCell("TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    middleTable.AddCell(table);


        //    table = CreateTable(nbColumns, 0, defineWidths);
        //    // client invoice line

        //    int clientInvoiceLineCount = devis.CostPlanLines.Count;

        //    for (int index = 0; index < clientInvoiceLineCount; index++)
        //    {
        //        var cil = devis.CostPlanLines.ElementAt(index);

        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);

        //        string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.ClnPrdName : string.Empty;
        //        string Description = cil.ClnDescription;
        //        string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n0}", cil.ClnQuantity) : string.Empty;
        //        string ClnUnitPrice = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n0}", cil.ClnUnitPrice) : string.Empty;
        //        string ClnTotalPrice = (cil.LtpId == 2 || cil.LtpId == 4 || cil.LtpId == 5) ? string.Format("{0:n0}", cil.ClnTotalPrice) : string.Empty;
        //        string VatLabel = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0}", cil.VatLabel) : string.Empty;

        //        cell = CreateHeaderCell(prdName, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(Description, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(ClnTotalPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(VatLabel, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);

        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);


        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //        table.AddCell(cell);

        //        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);


        //        AddTable(middleTable, table);
        //        table = CreateTable(nbColumns, 0, defineWidths);

        //        if (LastLineTotalHeight > 710)
        //        {
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //            table.AddCell(cell);

        //            AddTable(middleTable, table);
        //            table = CreateTable(nbColumns, 0, defineWidths);

        //            if (index < clientInvoiceLineCount - 1)
        //            {
        //                AddTable(middleTable, table, addNewPage: LastLineTotalHeight < 800);

        //                table = CreateTable(nbColumns, 0, defineWidths);

        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell("DÉSIGNATION", BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell("QTÉ", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell("P.U. HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell("MNT HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell("TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);

        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);
        //            }
        //        }
        //        else
        //        {
        //            if (index == clientInvoiceLineCount - 1)
        //            {
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);

        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //                table.AddCell(cell);
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
        //                table.AddCell(cell);

        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);

        //                AddTable(middleTable, table);
        //            }
        //        }
        //    }

        //    var comment = devis.CplClientComment;


        //    if (!string.IsNullOrEmpty(comment))
        //    {
        //        // 为了给comment 留位置 12/01/2015
        //        for (int i = 0; i < 3; i++)
        //        {
        //            table = CreateTable(nbColumns, 0, defineWidths);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
        //            table.AddCell(cell);
        //            //AddTable(middleTable, table);
        //            if (LastLineTotalHeight >= 720)
        //            {
        //                break;
        //            }
        //        }
        //        if (comment.Contains("\n"))
        //        {
        //            List<string> listContent = comment.Split('\n').ToList();
        //            int contentCount = listContent.Count();

        //            for (int index = 0; index < contentCount; index++)
        //            {
        //                string conS = listContent.ElementAt(index);

        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                table.AddCell(cell);

        //                cell = CreateHeaderCell(conS, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                table.AddCell(cell);
        //                if (index == 0)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else if (index == 1)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else if (index == 2)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else if (index == 3)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                else
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                }
        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                table.AddCell(cell);

        //                AddTable(middleTable, table);
        //            }
        //            if (contentCount < 4)
        //            {
        //                if (contentCount == 1)
        //                {
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);


        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);


        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);

        //                    AddTable(middleTable, table);
        //                }
        //                else if (contentCount == 2)
        //                {

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, withTopBorder: false, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);


        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);



        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    AddTable(middleTable, table);
        //                }
        //                else if (contentCount == 3)
        //                {


        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //                    table.AddCell(cell);

        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                    table.AddCell(cell);
        //                    AddTable(middleTable, table);
        //                }
        //            }
        //        }
        //        else
        //        {
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont2, false, Alignement.Left, false, false, leading);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(comment, BaseColor.WHITE, 18, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0);
        //            table.AddCell(cell);


        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);


        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);


        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 11, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //            table.AddCell(cell);
        //            AddTable(middleTable, table);
        //        }
        //    }


        //    // add table to check the end of page

        //    if (LastLineTotalHeight > 710)
        //    {
        //        table = CreateTable(nbColumns, 0, defineWidths);
        //        AddTable(middleTable, table, addNewPage: true);
        //    }

        //    // add blank space

        //    //for (int i = 0; i < 100; i++)
        //    //{
        //    //    table = CreateTable(nbColumns, 0, defineWidths);
        //    //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 5);
        //    //    table.AddCell(cell);
        //    //    AddTable(middleTable, table);
        //    //    if (LastLineTotalHeight >= 720)
        //    //    {
        //    //        break;
        //    //    }
        //    //}


        //    table = CreateTable(nbColumns, 0, defineWidths);
        //    cell = CreateHeaderCell("", BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("Remarque : {0}", devis.Creator.FullName), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);


        //    // total line 

        //    // total line title

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell("BASES HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    //bool withRemise = devis.Commission.Amount != 0;
        //    bool withRemise = false;
        //    if (withRemise)
        //    {
        //        cell = CreateHeaderCell("REMISE", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell("MNT TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell("% TVA", BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //    }
        //    else
        //    {
        //        cell = CreateHeaderCell("MONTANT TVA", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell("% TVA", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //    }

        //    cell = CreateHeaderCell("TOTAUX", BaseColor.WHITE, 4, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    //cell = CreateHeaderCell("TOTAL TTC", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    // mdofication 2015-10-15 for JP Marino facture0162
        //    cell = CreateHeaderCell("TOTAL HT", BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell("NET À PAYER", BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);



        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    var totalBrut = devis.CostPlanLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnTotalCrudePrice);
        //    var totalHT = devis.CostPlanLines.Where(m => m.LtpId == 4 || m.LtpId == 2).Sum(m => m.ClnTotalPrice);
        //    // total line content
        //    cell = CreateHeaderCell(string.Format("{0:n2}", totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    if (withRemise)
        //    {
        //        //cell = CreateHeaderCell(string.Format("{0:n2}", devis.Commission.Amount), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        //table.AddCell(cell);
        //        //cell = CreateHeaderCell(string.Format("{0:n2}", devis.DevisLines.Sum(m => m.TotalPrice * m.TVA.DcValue / 100)), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        //table.AddCell(cell);
        //        //cell = CreateHeaderCell(string.Format("{0:n2}", devis.DevisLines.Sum(m => m.TotalPrice * m.TVA.DcValue / 100) * 100 / (devis.DevisLines.Sum(m => m.TotalPrice))), BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        //table.AddCell(cell);
        //    }
        //    else
        //    {
        //        cell = CreateHeaderCell(string.Format("{0:n2}", totalBrut), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //        cell = CreateHeaderCell(string.Format("{0:n2}", (totalBrut - totalHT) * 100 / totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //        table.AddCell(cell);
        //    }

        //    var sumPaid = 0;
        //    string totauxtitle = string.Format("HT\nTVA");
        //    string totaux = string.Format("{0:n2} \n{1:n2}", totalHT, (totalBrut - totalHT));

        //    if (withRemise)
        //    {
        //        //totauxtitle = string.Format("{0}\nRemise", totauxtitle);
        //        //totaux = string.Format("{0}\n- {1:n2}", totaux, devis.Commission.Amount);
        //    }

        //    cell = CreateHeaderCell(totauxtitle, BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Left, true, false, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format(":\n:{0}", withRemise ? "\n:" : ""), BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Left, false, false, leading, -20, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(totaux, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, false, true, leading, -30, withTopBorder: true, forContent: true, footerTop: 0, minHeight: withRemise ? 42 : 32);
        //    table.AddCell(cell);

        //    //cell = CreateHeaderCell(string.Format("\n{0:n2}", totalBrut), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    cell = CreateHeaderCell(string.Format("\n{0:n2}", totalHT), BaseColor.WHITE, 2, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    // mdofication 2015-10-15 for JP Marino facture0162
        //    table.AddCell(cell);

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Right, false, false, leading, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);
        //    cell = CreateHeaderCell(string.Format("\n{0:n2}", totalBrut), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);


        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
        //    table.AddCell(cell);

        //    // total line end

        //    // reserve de propriete

        //    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 19, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
        //    table.AddCell(cell);


        //    content = HeaderFooter != null ? HeaderFooter.CostPlanFooter : string.Empty;
        //    if (!string.IsNullOrEmpty(content))
        //    {
        //        if (content.Contains("\r\n"))
        //        {
        //            var lines = content.Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries).ToList();
        //            int count = lines.Count;
        //            for (int i = 0; i < count; i++)
        //            {
        //                var anitem = lines.ElementAt(i);
        //                //CreateHeaderCell(textSpace, BaseColor.WHITE, 5, headerTextFont, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                //cell = CreateHeaderCell("", BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 10, forContent: false);
        //                //table.AddCell(cell);

        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
        //                table.AddCell(cell);

        //                cell = CreateHeaderCell(anitem, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, borderLeft: 0, forContent: false);
        //                table.AddCell(cell);

        //                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
        //                table.AddCell(cell);

        //            }
        //        }
        //        else
        //        {
        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(content, BaseColor.WHITE, 17, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
        //            table.AddCell(cell);

        //            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, headerTextFont, false, Alignement.Left, false, false, leading, forContent: false);
        //            table.AddCell(cell);
        //        }
        //    }




        //    //string reserveText = "RESERVE DE PROPRIÉTÉ : Nous nous réservons la propriété des marchandises jusqu’au complet paiement du prix par l’acheteur.\nNotre droit de revendication porte aussi bien sur les marchandises que sur leur prix si elles ont déjà revendues (Loi du 12 mai 1908).";

        //    //cell = CreateHeaderCell(reserveText, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
        //    //table.AddCell(cell);


        //    //string companyInfo = "Entreprise JP MARINO - 1 rue foulques, 93330 Neuilly sur Marne - Siret N°32621314700035 - R.C.S: 326213147 RCS Bobigny - TVA N° FR51326213147";
        //    //cell = CreateHeaderCell(companyInfo, BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Center, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
        //    //table.AddCell(cell);


        //    middleTable.AddCell(table);

        //    doc.Add(middleTable);

        //    doc.Close();
        //    return output;
        //}

        #endregion Devis

    }
}

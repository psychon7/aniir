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
using iTextSharp.text.pdf.events;

namespace ERP.RefSite.Shared
{
    public enum Alignement
    {
        Center = 0,
        Left = 1,
        Right = 2
    }

    public static partial class PDFGenerator
    {
        #region Variable

        private static Document doc;
        private static PdfWriter writer;
        private static PdfPTable table;
        private static PdfPCell cell;
        private static PdfPTable finalTable;
        private static PdfPTable middleTable;

        private static StringBuilder _title = new StringBuilder();
        private static bool repeateHeaderTable = false;
        private static PdfPTable _headerTable;
        private static bool landscape = false;

        private static float spacing = 0;
        private static bool cellAdded = false;
        private static float pageSize = 0;
        private static float tableTotalHeight = 0;
        static float lastMarge = 0;
        private static float _spacingHeader = 30;
        private static float middleHeight = 0;

        private static string _path = string.Empty;
        private static string _imagePath = "/img/logo-Pdf.png";

        private static string _pdfInvoicepath = "/PDFTmpl/BonDeLivraison.pdf";
        #endregion Variable

        #region Style and Font

        private static BaseColor TchShGreen = new BaseColor(76, 165, 50);

        //private static Font TchStTitle1B = FontFactory.GetFont("Verdana", 30, Font.BOLD, TchShGreen);
        //private static Font TchStTitle2 = FontFactory.GetFont("Verdana", 22, TchShGreen);
        //private static Font TchStTitle2B = FontFactory.GetFont("Verdana", 22, Font.BOLD, TchShGreen);
        //private static Font TchStTitle3B = FontFactory.GetFont("Verdana", 15, Font.BOLD, TchShGreen);
        //private static Font TchStNomalB = FontFactory.GetFont("Verdana", 9, Font.BOLD, BaseColor.BLACK);
        //private static Font TchStNomal = FontFactory.GetFont("Verdana", 9, BaseColor.BLACK);

        private static Font titleWhiteFont = FontFactory.GetFont("Verdana", 8, BaseColor.BLACK);
        private static Font bodyFont = FontFactory.GetFont("Verdana", 8, Font.NORMAL);
        private static Font bodyFont1st = FontFactory.GetFont("Verdana", 9, Font.NORMAL);
        private static Font bodyFont1stLink = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.UNDERLINE, new BaseColor(0, 0, 255));
        private static Font bodyFont1stItaly = FontFactory.GetFont("Verdana", 10, Font.NORMAL | Font.ITALIC, BaseColor.RED);
        private static Font bodyFontTitle = FontFactory.GetFont("Verdana", 11, Font.NORMAL);
        private static Font headerTextFont = FontFactory.GetFont("Verdana", 10, Font.NORMAL);
        private static Font headerTextFont2 = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.BOLD);
        private static Font headerTextFont2UnderLine = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.BOLD | Font.UNDERLINE);
        private static Font companyNameFont = FontFactory.GetFont("Verdana", 12, Font.NORMAL);
        private static Font titleTextFont = FontFactory.GetFont("Verdana", 12, Font.BOLD | Font.ITALIC);
        private static Font InfoFont = FontFactory.GetFont("Verdana", 9, Font.BOLD);
        private static Font titleFont2 = FontFactory.GetFont("Verdana", 9, Font.BOLD, BaseColor.BLACK);
        private static Font LotFont = FontFactory.GetFont("Verdana", 9, Font.BOLD, BaseColor.BLACK);
        private static Font lineNumberFont = FontFactory.GetFont("Verdana", 8, Font.NORMAL, new BaseColor(166, 166, 166));
        private static BaseColor fondLot = new BaseColor(157, 157, 157);
        private static BaseColor fondnormal = new BaseColor(255, 255, 255);
        private static BaseColor fondSoustotal = new BaseColor(208, 208, 208);



        #endregion Style and Font

        #region Generate PDF

        private static PdfPTable CreateTable(int nbColumns, int spacingAfter = -1, float[] definedWidths = null, int spacingBefore = -1)
        {
            int before;
            int after;
            int padding;
            if (spacingAfter == -1)
            {
                before = 2;
                after = 5;
                padding = 2;
            }
            else
            {
                before = 0;
                after = spacingAfter;
                padding = 0;
            }
            if (spacingBefore != -1)
            {
                before = spacingBefore;
            }


            PdfPTable table = new PdfPTable(nbColumns);
            table.HorizontalAlignment = 0;
            table.SpacingBefore = before;
            table.SpacingAfter = after;
            table.DefaultCell.Border = 0;
            table.DefaultCell.Padding = padding;
            table.WidthPercentage = 100;
            float width = doc.PageSize.Width;
            //table.SetTotalWidth(new float[] { 140, 140, 140, 140 });

            float[] widths = new float[nbColumns];
            float[] widths2 = new float[nbColumns];

            if (definedWidths == null)
            {
                if (nbColumns == 1)
                {
                    widths = new float[] { (width) / nbColumns };
                }
                else if (nbColumns == 2)
                {
                    widths = new float[] { (8 * width) / nbColumns, (12 * width) / nbColumns };
                }
                else if (nbColumns == 3)
                {
                    widths = new float[] { (8 * width) / nbColumns, (1 * width) / nbColumns, (8 * width) / nbColumns };
                }
                else if (nbColumns == 13)
                {
                    widths = new float[] { (3 * width)/nbColumns, (2* width)/nbColumns, (1* width)/nbColumns, 
                (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, 
                (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns};
                }
                else if (nbColumns == 14)
                {
                    widths = new float[] { (3 * width)/nbColumns, (2* width)/nbColumns, (1* width)/nbColumns, 
                (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, 
                (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, 
                (1 * width)/nbColumns};
                }
                else if (nbColumns == 17)
                {
                    widths = new float[] { (1 * width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, 
                (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, 
                (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns, 
                (1 * width)/nbColumns,(1* width)/nbColumns, (1* width)/nbColumns, (1* width)/nbColumns};
                }
            }
            else
            {
                widths = definedWidths;
            }

            table.SetTotalWidth(widths);
            return table;
        }

        private static PdfPCell CreateHeaderCell(string headerText,
            BaseColor color = null,
            int colSpan = 4,
            Font font = null,
            bool withBottomBorder = true,
            Alignement alignement = Alignement.Center,
            bool withLeftBorder = false,
            bool withRightBorder = false,
            float paddingBottom = 0,
            float borderLeft = -1,
            bool forContent = false,
            float minHeight = -1,
            bool forFooter = false,
            float footerTop = 0,
            bool isDescription = false,
            bool withTopBorder = false,
            bool notaTop = false,
            bool lineNormalBottomBorder = false,
            BaseColor bottomBorderColor = null,
            float? bottomBorderFloat = null,
            BaseColor leftBorderColor = null,
            float? leftBorderFloat = null,
            BaseColor rightBorderColor = null,
            float? rightBorderFloat = null)
        {
            if (color == null)
                color = BaseColor.WHITE;
            if (font == null)
                font = titleWhiteFont;

            Phrase phrase = new Phrase(headerText, font);

            if (!isDescription)
            {
                PdfPCell cell = new PdfPCell(phrase);

                if (forContent)
                {
                    if (minHeight != -1)
                    {
                        cell.MinimumHeight = minHeight;
                    }
                    else
                    {
                        cell.MinimumHeight = 6f;
                    }
                }


                cell.Colspan = colSpan;
                cell.BackgroundColor = color;
                cell.BorderWidthBottom = withBottomBorder ? 0.5F : 0;
                cell.BorderWidthRight = withRightBorder ? 0.5F : 0;
                cell.BorderWidthLeft = withLeftBorder ? 0.5F : 0;
                cell.BorderWidthTop = withTopBorder ? 0.5F : 0;


                if (lineNormalBottomBorder)
                {
                    cell.BorderWidthBottom = bottomBorderFloat ?? 0.5F;
                    cell.BorderColorBottom = bottomBorderColor ?? new BaseColor(0, 0, 0);
                }

                if (withLeftBorder)
                {
                    cell.BorderWidthLeft = leftBorderFloat ?? 0.5F;
                    cell.BorderColorLeft = leftBorderColor ?? new BaseColor(0, 0, 0);
                }

                if (withRightBorder)
                {
                    cell.BorderWidthRight = rightBorderFloat ?? 0.5F;
                    cell.BorderColorRight = rightBorderColor ?? new BaseColor(0, 0, 0);
                }


                if (borderLeft != -1)
                {
                    //cell.BorderWidthLeft = borderLeft;
                    //cell.BorderColor = BaseColor.WHITE;
                    cell.PaddingLeft = borderLeft;
                }

                if (paddingBottom != 0)
                {
                    cell.UseBorderPadding = true;
                    cell.PaddingBottom = paddingBottom;
                    cell.PaddingTop = paddingBottom;
                }

                switch (alignement)
                {
                    case Alignement.Center:
                        cell.HorizontalAlignment = Element.ALIGN_CENTER;
                        break;
                    case Alignement.Left:
                        cell.HorizontalAlignment = Element.ALIGN_LEFT;
                        break;
                    case Alignement.Right:
                        cell.HorizontalAlignment = Element.ALIGN_RIGHT;
                        break;
                    default:
                        cell.HorizontalAlignment = Element.ALIGN_CENTER;
                        break;
                }

                if (forFooter)
                {
                    cell.PaddingTop = footerTop;
                }

                return cell;
            }
            else
            {
                return AddPhrase(headerText, color, alignement, colSpan, withBottomBorder, withLeftBorder, withRightBorder, withTopBorder, notaTop, lineNormalBottomBorder: lineNormalBottomBorder);
            }
        }
        private static PdfPCell AddPhrase(string s, BaseColor fond = null, Alignement alignement = Alignement.Center,
                    int colSpan = 0, bool withBottomBorder = false, bool withLeftBorder = false,
                    bool withRightBorder = false, bool withTopBorder = false, bool notaTop = false,
                    bool lineNormalBottomBorder = false)
        {
            PdfPCell cell = new PdfPCell();
            cell.Border = 0;
            if (fond != null)
            {
                cell.BackgroundColor = fond;
            }


            switch (alignement)
            {
                case Alignement.Center:
                    cell.HorizontalAlignment = Element.ALIGN_CENTER;
                    break;
                case Alignement.Left:
                    cell.HorizontalAlignment = Element.ALIGN_LEFT;
                    break;
                case Alignement.Right:
                    cell.HorizontalAlignment = Element.ALIGN_RIGHT;
                    break;
                default:
                    cell.HorizontalAlignment = Element.ALIGN_CENTER;
                    break;
            }
            if (notaTop)
            {
                cell.VerticalAlignment = Element.ALIGN_TOP;
            }
            if (!(s.StartsWith("<p>") && s.EndsWith("</p>")))
            {
                s = "<p>" + s + "</p>";
            }
            cell.Colspan = colSpan;

            cell.BorderWidthBottom = withBottomBorder ? 0.5F : 0;
            cell.BorderWidthRight = withRightBorder ? 0.5F : 0;
            cell.BorderWidthLeft = withLeftBorder ? 0.5F : 0;
            cell.BorderWidthTop = withTopBorder ? 0.5F : 0;

            if (lineNormalBottomBorder)
            {
                cell.BorderWidthBottom = 0.5F;
                cell.BorderColorBottom = new BaseColor(191, 191, 191);
            }

            StyleSheet styles = new StyleSheet();
            styles.LoadTagStyle("p", "size", "9pt");

            if (alignement == Alignement.Center)
            {
                styles.LoadTagStyle("p", "text-align", "center");
            }

            List<IElement> l = HTMLWorker.ParseToList(new StringReader(s), styles);
            foreach (var item in l)
            {
                cell.AddElement((IElement)item);
            }
            return cell;
        }

        private static float LastLineTotalHeight = 0;

        private static void AddTable(PdfPTable table, PdfPTable tableToAdd, bool isStaffing = false, bool addNewPage = false, bool forceNewPage = false)
        {
            const int bottomMargin = 10;

            float finalTableTotalHeight = 0;

            #region Set Width to Get Height
            int nbColumns = table.NumberOfColumns;
            float[] widths = new float[nbColumns];

            for (int i = 0; i < nbColumns; i++)
            {
                widths[i] = table.AbsoluteWidths[i];
            }

            int nbColumns2 = tableToAdd.NumberOfColumns;
            float[] widths2 = new float[nbColumns2];

            for (int i = 0; i < nbColumns2; i++)
            {
                widths2[i] = tableToAdd.AbsoluteWidths[i];
            }

            table.SetTotalWidth(widths);
            tableToAdd.SetTotalWidth(widths2);
            #endregion

            float[] tmpWidths = new float[table.NumberOfColumns];

            if (finalTable.NumberOfColumns == 1)
            {
                tmpWidths = new float[table.NumberOfColumns];
                for (int i = 0; i < table.NumberOfColumns; i++)
                {
                    tmpWidths[i] = (doc.PageSize.Width) - doc.LeftMargin - doc.RightMargin;
                }

            }
            else
            {
                tmpWidths = finalTable.AbsoluteWidths;
                finalTableTotalHeight = finalTable.TotalHeight + bottomMargin;
            }

            PdfPTable tmpTable = CreateTable(table.NumberOfColumns, -1, tmpWidths);
            tmpTable.AddCell(tableToAdd);

            float lastTableTotalHeight = tableTotalHeight;

            tableTotalHeight = table.TotalHeight + tmpTable.TotalHeight + finalTableTotalHeight;

            float diff = pageSize - writer.GetVerticalPosition(true);
            lastMarge = tableTotalHeight + diff + spacing + _spacingHeader + doc.TopMargin + doc.BottomMargin;
            LastLineTotalHeight = lastMarge;

            if (lastMarge > pageSize - bottomMargin || addNewPage || forceNewPage)
            {
                AddMiddleTable(finalTable, middleTable);
                int middleTableSpacing = middleTable.SpacingAfter != 0 ? -1 : 0;
                middleTable = CreateTable(1, middleTableSpacing);
                AddToDocument(writer, doc, finalTable, false);
                finalTable = CreateTable(finalTable.NumberOfColumns, -1, finalTable.AbsoluteWidths);
                AddTable(middleTable, tableToAdd, false);
                if (addNewPage)
                {
                    finalTable.AddCell(middleTable);
                    AddToDocument(writer, doc, finalTable, false);
                    middleTable = CreateTable(1, middleTableSpacing);
                    finalTable = CreateTable(finalTable.NumberOfColumns, -1, finalTable.AbsoluteWidths);
                    NewPage();
                }
            }
            else
            {
                if (!cellAdded)
                    spacing += tableToAdd.SpacingAfter + tableToAdd.SpacingBefore;
                table.AddCell(tableToAdd);
            }
        }

        private static void AddToDocument(PdfWriter writer, Document doc, PdfPTable table, bool onNewPage)
        {
            int nbColumns = table.NumberOfColumns;
            float[] widths = new float[nbColumns];

            for (int i = 0; i < nbColumns; i++)
            {
                widths[i] = table.AbsoluteWidths[i];
            }

            table.SetTotalWidth(widths);
            float tableHeight = table.TotalHeight;

            if (!landscape)
            {
                if (writer.GetVerticalPosition(true) - tableHeight <= doc.BottomMargin)
                {
                    NewPage();
                }
            }
            else
            {
                float diff = pageSize - writer.GetVerticalPosition(true);
                if ((tableHeight > doc.PageSize.Height + diff + doc.BottomMargin + doc.TopMargin + spacing) || onNewPage)
                {
                    //doc.NewPage();
                }
            }
            doc.Add(table);

        }


        /// <summary>
        /// Crée une nouvelle page dans le PDF
        /// </summary>
        public static void NewPage()
        {
            doc.NewPage();

            PdfPTable headerTable = CreateTable(1);
            headerTable.SpacingAfter = _spacingHeader;
            spacing = 0;
            string[] _titles = _title.ToString().Split(new string[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < _titles.Length; i++)
            {
                if (i % 2 == 0)
                    headerTable.AddCell(new Phrase(_titles[i], InfoFont));
                else
                    headerTable.AddCell(new Phrase(_titles[i], bodyFont));
            }
            doc.Add(headerTable);


            // 2017-05-30 注释logo
            //var logo = iTextSharp.text.Image.GetInstance(_path + _imagePath);
            //logo.SetAbsolutePosition(700, 540);
            //doc.Add(logo);

            if (repeateHeaderTable)
            {
                finalTable = CreateTable(finalTable.NumberOfColumns, 0, finalTable.AbsoluteWidths);
                finalTable.AddCell(_headerTable);
                doc.Add(finalTable);
            }
        }
        private static void AddMiddleTable(PdfPTable finalTable, PdfPTable middleTable)
        {
            finalTable.AddCell(middleTable);
            middleHeight = middleTable.TotalHeight;
        }

        #endregion Generate PDF

        #region Devis

        public static MemoryStream NewGeneratePdfForDevis(string path, CostPlan devis)
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
            cell = CreateHeaderCell(devis.ClientCompanyName.ToUpper(), BaseColor.WHITE, 7, headerTextFont2, false, Alignement.Left, false, true, leading, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(devis.Inv_CcoFirstname + " " + devis.Inv_CcoLastname.ToUpper(), BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, true, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(devis.Inv_CcoAddress1, BaseColor.WHITE, 7, headerTextFont, false, Alignement.Left, false, true, leading, spaceLogo, forFooter: true, footerTop: 0);
            table.AddCell(cell);
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // white
            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 10, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);

            // fac
            string cpville = string.Format("{0} {2} {1}", devis.Inv_CcoPostcode, devis.Inv_CcoCity, !string.IsNullOrEmpty(devis.Inv_CcoPostcode) && !string.IsNullOrEmpty(devis.Inv_CcoCity) ? "/" : "");
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



            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Date : {0:dd-MMM-yyyy}", DateTime.Now), BaseColor.WHITE, 9, bodyFont1st, false, Alignement.Left, false, false, leading, -1);
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
            cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 7, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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

            for (int index = 0; index < clientInvoiceLineCount; index++)
            {
                var cil = devis.CostPlanLines.ElementAt(index);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                string prdName = (cil.LtpId == 2) ? (cil.PitName) : (cil.LtpId == 4) ? cil.ClnPrdName : string.Empty;
                string Description = cil.ClnDescription;
                if (cil.PrdId != null && cil.PrdId != 0)
                {
                    Description = string.Format("{0}\r\nFiche Tech: http://t.e-c-o.com?p={1}", Description, cil.ClnPrdName);
                }
                string Quantity = (cil.LtpId == 2 || cil.LtpId == 4) ? string.Format("{0:n0}", cil.ClnQuantity) : string.Empty;
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

                cell = CreateHeaderCell(prdName, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCell(Description, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(Quantity, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(ClnUnitPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(ClnPriceWithDiscount, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(ClnTotalPrice, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 15);
                table.AddCell(cell);

                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);


                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, false, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, false, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                table.AddCell(cell);
                cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 2, bodyFont1st, false, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
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
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
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
                        cell = CreateHeaderCell("RÉFÉRENCE", BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("DÉSIGNATION", BaseColor.LIGHT_GRAY, 7, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);
                        cell = CreateHeaderCell("QTÉ", BaseColor.LIGHT_GRAY, 1, bodyFont1st, true, Alignement.Center, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
                    if (index == clientInvoiceLineCount - 1)
                    {
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
                        table.AddCell(cell);

                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Center, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 7, bodyFont1st, true, Alignement.Left, true, true, leading, 5, forContent: true, footerTop: 0, minHeight: 5);
                        table.AddCell(cell);
                        cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, true, Alignement.Right, true, true, leading, forContent: true, footerTop: 0, minHeight: 5);
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

            cell = CreateHeaderCell(textSpace, BaseColor.WHITE, 1, bodyFont1st, false, Alignement.Center, false, false, leading, footerTop: 0, minHeight: 15);
            table.AddCell(cell);
            cell = CreateHeaderCell(string.Format("Remarque : {0}", devis.Creator.FullName), BaseColor.WHITE, 17, bodyFont1st, false, Alignement.Left, false, false, leading, forContent: true, footerTop: 0, minHeight: 20);
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
                        //if (lineIdxForCalculate == 3)
                        //{
                        //    fieldName = "NET À PAYER";
                        //    fieldValue = totalTtcNet;
                        //}
                    }
                    cell = CreateHeaderCell(fieldName, BaseColor.LIGHT_GRAY, 3, bodyFont1st, true, Alignement.Left, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
                    table.AddCell(cell);
                    cell = CreateHeaderCell(string.Format("{0:n2}", fieldValue), BaseColor.WHITE, 3, bodyFont1st, true, Alignement.Right, true, true, leading, withTopBorder: true, forContent: true, footerTop: 0, minHeight: 15);
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
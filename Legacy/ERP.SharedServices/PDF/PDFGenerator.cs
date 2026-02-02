using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;
using iTextSharp.text;
using iTextSharp.text.html.simpleparser;
using iTextSharp.text.pdf;
using System.Text;
using ERP.DataServices;
using ERP.Entities;
using iTextSharp.text.pdf.events;

namespace ERP.SharedServices.PDF
{
    public enum Alignement
    {
        Center = 0,
        Left = 1,
        Right = 2,
        JUSTIFIED_ALL = 3, // 两端的对其
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
        private static Font bodyFont6 = FontFactory.GetFont("Verdana", 6, Font.NORMAL);
        private static Font bodyFont7 = FontFactory.GetFont("Verdana", 7, Font.NORMAL);
        private static Font bodyFont = FontFactory.GetFont("Verdana", 8, Font.NORMAL);
        private static Font bodyFont1st = FontFactory.GetFont("Verdana", 9, Font.NORMAL);
        private static Font bodyFont9B = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.BOLD);
        private static Font bodyFont9BGreen = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.BOLD, BaseColor.GREEN);
        private static Font bodyFont9BRed = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.BOLD, BaseColor.RED);
        private static Font bodyFont1stLink = FontFactory.GetFont("Verdana", 9, Font.NORMAL | Font.UNDERLINE, new BaseColor(0, 0, 255));
        private static Font bodyFont1stItaly = FontFactory.GetFont("Verdana", 10, Font.NORMAL | Font.ITALIC, BaseColor.RED);
        private static Font bodyFontTitle = FontFactory.GetFont("Verdana", 11, Font.NORMAL);
        private static Font headerTextFont = FontFactory.GetFont("Verdana", 10, Font.NORMAL);
        private static Font headerTextFont2 = FontFactory.GetFont("Verdana", 10, Font.NORMAL | Font.BOLD);
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
        #region Kaiti
        //static string fontpath = System.Web.HttpContext.Current.Request.PhysicalApplicationPath + "\\fonts\\Deng.ttf";
        static string fontpath = System.Web.HttpContext.Current.Request.PhysicalApplicationPath + "\\fonts\\ZTGJKT.ttf";
        static BaseFont bf = BaseFont.CreateFont(fontpath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        static Font fontKT06 = new Font(bf, 6);
        static Font fontKT07 = new Font(bf, 7);
        static Font fontKT08 = new Font(bf, 8);
        static Font fontKT09 = new Font(bf, 9);
        private static Font fontKT06B = new Font(bf, 6, 1);
        private static Font fontKT07B = new Font(bf, 7, 1);
        private static Font fontKT08B = new Font(bf, 8, 1);
        private static Font fontKT09B = new Font(bf, 9, 1);
        static Font fontKT10 = new Font(bf, 10);
        static Font fontKT11 = new Font(bf, 11);
        private static Font fontKT11B = new Font(bf, 11, 1);
        static Font fontKT12 = new Font(bf, 12);
        private static Font fontKT12B = new Font(bf, 12, 1);
        static Font fontKT13 = new Font(bf, 12);
        private static Font fontKT13B = new Font(bf, 13, 1);
        static Font fontKT14 = new Font(bf, 12);
        static Font fontKT15 = new Font(bf, 15);
        static Font fontKT25 = new Font(bf, 15);
        #endregion Kaiti

        #region SongTi
        static string fontpathSong = System.Web.HttpContext.Current.Request.PhysicalApplicationPath + "\\fonts\\Deng.ttf";
        //static string fontpathSong = System.Web.HttpContext.Current.Request.PhysicalApplicationPath + "\\fonts\\ZTGJST.ttf";
        static BaseFont bfst = BaseFont.CreateFont(fontpathSong, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        static Font fontST06 = new Font(bfst, 6);
        static Font fontST07 = new Font(bfst, 7);
        static Font fontST08 = new Font(bfst, 8);
        static Font fontST07B = new Font(bfst, 7, 1);
        static Font fontST08B = new Font(bfst, 8, 1);
        static Font fontST09 = new Font(bfst, 9);
        private static Font fontST09B = new Font(bfst, 9, 1);
        static Font fontST10 = new Font(bfst, 10);
        static Font fontST11 = new Font(bfst, 11);
        private static Font fontST11B = new Font(bfst, 11, 1);
        static Font fontST12 = new Font(bfst, 12);
        private static Font fontST12B = new Font(bfst, 12, 1);
        static Font fontST13 = new Font(bfst, 12);
        private static Font fontST13B = new Font(bfst, 13, 1);
        static Font fontST14 = new Font(bfst, 12);
        private static Font fontST14B = new Font(bfst, 14, 1);
        static Font fontST15 = new Font(bfst, 15);
        static Font fontST25 = new Font(bfst, 15);
        #endregion SongTi

        #region color
        private static BaseColor greenC4FFC4 = new BaseColor(196, 255, 196);
        private static BaseColor gray808080 = new BaseColor(192, 192, 192);
        private static BaseColor lightgreen = new BaseColor(231, 255, 226);
        #endregion color

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
                else if (nbColumns == 50)
                {
                    widths = new float[]
                    {
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns,
                        (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns, (1*width)/nbColumns,
                        (1*width)/nbColumns
                    };
                }
            }
            else
            {
                widths = definedWidths;
            }

            table.SetTotalWidth(widths);
            return table;
        }

        #region 测试是否含有中文
        private static readonly Regex cjkCharRegex = new Regex(@"\p{IsCJKUnifiedIdeographs}");
        public static bool IsChinese(this char c)
        {
            return cjkCharRegex.IsMatch(c.ToString());
        }
        #endregion 测试是否含有中文

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
            float? rightBorderFloat = null,
            BaseColor fontColor = null)
        {
            if (color == null)
                color = BaseColor.WHITE;
            if (font == null)
                font = titleWhiteFont;

            var finalFont = font;

            // 判断字体及中文
            try
            {
                if (headerText.Any(z => z.IsChinese()))
                {
                    if (CheckInChineseFont(font))
                    {
                        string fontpath = System.Web.HttpContext.Current.Request.PhysicalApplicationPath + "\\fonts\\ZTGJKT.ttf";
                        BaseFont bf = BaseFont.CreateFont(fontpath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                        Font fontHeader = (fontColor == null ? new Font(bf, 9) : new Font(bf, 9, Font.NORMAL, fontColor));
                        finalFont = fontHeader;
                    }
                }
                else
                {
                    if (fontColor != null)
                    {
                        finalFont.Color = fontColor;
                    }

                }
            }
            catch (Exception)
            {
            }

            Phrase phrase = new Phrase(headerText, finalFont);

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
                //cell.BorderWidthLeft = 0;
                cell.BorderWidthTop = withTopBorder ? 0.5F : 0;
                cell.VerticalAlignment = Element.ALIGN_MIDDLE;

                if (lineNormalBottomBorder)
                {
                    cell.BorderWidthBottom = bottomBorderFloat ?? 0.5F;
                    cell.BorderColorBottom = bottomBorderColor ?? new BaseColor(0, 0, 0);
                }

                if (withLeftBorder)
                {
                    cell.BorderWidthLeft = leftBorderFloat ?? 0.5F;
                    cell.BorderColorLeft = leftBorderColor ?? new BaseColor(0, 0, 0);
                    //PdfCustomCellBorder pdfCustomCellBorder = new PdfCustomCellBorder();
                    //cell.CellEvent = pdfCustomCellBorder;
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

        private static PdfPCell CreateHeaderCellHK(string headerText,
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
    float? rightBorderFloat = null,
            BaseColor fontColor = null)
        {
            if (color == null)
                color = BaseColor.WHITE;
            if (font == null)
                font = titleWhiteFont;

            var finalFont = font;

            // 判断字体及中文
            try
            {
                if (headerText.Any(z => z.IsChinese()))
                {
                    if (CheckInChineseFont(font))
                    {
                        string fontpath = System.Web.HttpContext.Current.Request.PhysicalApplicationPath + "\\fonts\\ZTGJKT.ttf";
                        BaseFont bf = BaseFont.CreateFont(fontpath, BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
                        Font fontHeader = fontColor == null ? new Font(bf, 9) : new Font(bf, 9, Font.NORMAL, fontColor);
                        finalFont = fontHeader;
                    }
                }
                else
                {
                    if (fontColor != null)
                    {
                        finalFont.Color = fontColor;
                    }
                }
            }
            catch (Exception)
            {
            }
            Phrase phrase = new Phrase(headerText, finalFont);

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
                //cell.BorderWidthBottom = withBottomBorder ? 0.5F : 0;
                //cell.BorderWidthRight = withRightBorder ? 0.5F : 0;
                //cell.BorderWidthLeft = withLeftBorder ? 0.5F : 0;
                //cell.BorderWidthTop = withTopBorder ? 0.5F : 0;
                cell.BorderWidthBottom = 0;
                cell.BorderWidthRight = 0;
                cell.BorderWidthLeft = 0;
                cell.BorderWidthTop = 0;


                if (lineNormalBottomBorder)
                {
                    //cell.BorderWidthBottom = bottomBorderFloat ?? 0.5F;
                    //cell.BorderColorBottom = bottomBorderColor ?? new BaseColor(0, 0, 0);
                }

                if (withLeftBorder)
                {
                    //cell.BorderWidthLeft = leftBorderFloat ?? 0.5F;
                    //cell.BorderColorLeft = leftBorderColor ?? new BaseColor(0, 0, 0);
                    var pdfCustomCellBorder = new PdfCustomCellBorderLeft();
                    cell.CellEvent = pdfCustomCellBorder;
                }

                if (withRightBorder)
                {
                    //cell.BorderWidthRight = rightBorderFloat ?? 0.5F;
                    //cell.BorderColorRight = rightBorderColor ?? new BaseColor(0, 0, 0);
                    var pdfCustomCellBorder = new PdfCustomCellBorderRight();
                    cell.CellEvent = pdfCustomCellBorder;
                }


                if (withTopBorder)
                {
                    //cell.BorderWidthLeft = leftBorderFloat ?? 0.5F;
                    //cell.BorderColorLeft = leftBorderColor ?? new BaseColor(0, 0, 0);
                    var pdfCustomCellBorder = new PdfCustomCellBorderTop();
                    cell.CellEvent = pdfCustomCellBorder;
                }
                if (withBottomBorder)
                {
                    //cell.BorderWidthLeft = leftBorderFloat ?? 0.5F;
                    //cell.BorderColorLeft = leftBorderColor ?? new BaseColor(0, 0, 0);
                    var pdfCustomCellBorder = new PdfCustomCellBorderBottom();
                    cell.CellEvent = pdfCustomCellBorder;
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
                    case Alignement.JUSTIFIED_ALL:
                        cell.HorizontalAlignment = Element.ALIGN_JUSTIFIED_ALL;
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

        private static bool CheckInChineseFont(Font font)
        {
            return (font != fontKT07B && font != fontKT08B && font != fontKT06B && font != fontKT06 && font != fontKT07 && font != fontKT08 && font != fontKT09 && font != fontKT09B && font != fontKT10 && font != fontKT11 && font != fontKT11B && font != fontKT12 && font != fontKT12B && font != fontKT13 && font != fontKT13B && font != fontKT14 && font != fontKT15 && font != fontKT25)
                   && (font != fontST06 && font != fontST07 && font != fontST07B && font != fontST08 && font != fontST08B && font != fontST09 && font != fontST09B && font != fontST10 && font != fontST11 && font != fontST11B && font != fontST12 && font != fontST12B && font != fontST13 && font != fontST13B && font != fontST14 && font != fontST15 && font != fontST25);
        }

        #region 虚线边框
        /// <summary>
        /// 虚线边框LEFT
        /// </summary>
        public class PdfCustomCellBorderLeft : IPdfPCellEvent
        {
            public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
            {
                PdfContentByte cb0 = canvases[PdfPTable.LINECANVAS];
                cb0.SaveState();
                cb0.SetLineWidth(0.5f);
                cb0.SetLineDash(new float[] { 2.0f, 2.0f }, 0);
                cb0.MoveTo(position.Left, position.Top);
                cb0.LineTo(position.Left, position.Bottom);
                cb0.Stroke();
                cb0.RestoreState();
            }
        }

        public class PdfCustomCellBorderRight : IPdfPCellEvent
        {
            public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
            {
                PdfContentByte cb0 = canvases[PdfPTable.LINECANVAS];
                cb0.SaveState();
                cb0.SetLineWidth(0.5f);
                cb0.SetLineDash(new float[] { 2.0f, 2.0f }, 0);
                cb0.MoveTo(position.Right, position.Top);
                cb0.LineTo(position.Right, position.Bottom);
                cb0.Stroke();
                cb0.RestoreState();
            }
        }

        public class PdfCustomCellBorderTop : IPdfPCellEvent
        {
            public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
            {
                PdfContentByte cb0 = canvases[PdfPTable.LINECANVAS];
                cb0.SaveState();
                cb0.SetLineWidth(0.5f);
                cb0.SetLineDash(new float[] { 2.0f, 2.0f }, 0);
                cb0.MoveTo(position.Left, position.Top);
                cb0.LineTo(position.Right, position.Top);
                cb0.Stroke();
                cb0.RestoreState();
            }
        }
        public class PdfCustomCellBorderBottom : IPdfPCellEvent
        {
            public void CellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases)
            {
                PdfContentByte cb0 = canvases[PdfPTable.LINECANVAS];
                cb0.SaveState();
                cb0.SetLineWidth(0.5f);
                cb0.SetLineDash(new float[] { 2.0f, 2.0f }, 0);
                cb0.MoveTo(position.Left, position.Bottom);
                cb0.LineTo(position.Right, position.Bottom);
                cb0.Stroke();
                cb0.RestoreState();
            }
        }

        #endregion 虚线边框

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
            try
            {
                List<IElement> l = HTMLWorker.ParseToList(new StringReader(s), styles);
                foreach (var item in l)
                {
                    cell.AddElement((IElement)item);
                }
            }
            catch (Exception ex)
            {
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

        private static void AddTableCinStt(PdfPTable table, PdfPTable tableToAdd, bool isStaffing = false, bool addNewPage = false, bool forceNewPage = false)
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
                NewPage();

                //AddTable(middleTable, tableToAdd, false);

                //if (addNewPage)
                //{
                //    finalTable.AddCell(middleTable);
                //    AddToDocument(writer, doc, finalTable, false);
                //    middleTable = CreateTable(1, middleTableSpacing);
                //    finalTable = CreateTable(finalTable.NumberOfColumns, -1, finalTable.AbsoluteWidths);
                //    NewPage();
                //}
            }
            else
            {
                if (!cellAdded)
                    spacing += tableToAdd.SpacingAfter + tableToAdd.SpacingBefore;
                table.AddCell(tableToAdd);
            }
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

        public static string SodCreatorInfo(PurchaseBaseClass sod)
        {
            // 添加Creator 信息
            //var creatorinfo = string.Format("Contact: {0} {1} | Email: {2} | Cellphone:{3} | Tel:{4}", sod.Creator.Firstname,sod.Creator.Lastname, sod.Creator.Email, sod.Creator.Cellphone, sod.Creator.Telephone);
            var creatorinfo = string.Empty;
            var contact = string.IsNullOrEmpty(sod.Creator.Firstname) ? "" : string.Format("Contact: {0} {1}", sod.Creator.Firstname, sod.Creator.Lastname);
            var email = string.IsNullOrEmpty(sod.Creator.Email) ? "" : string.Format(" | Email: {0} ", sod.Creator.Email);
            var cellphone = string.IsNullOrEmpty(sod.Creator.Cellphone) ? "" : string.Format(" | Cellphone: {0} ", sod.Creator.Cellphone);
            var tel = string.IsNullOrEmpty(sod.Creator.Telephone) ? "" : string.Format(" | Tel: {0} ", sod.Creator.Telephone);
            creatorinfo = string.Format("{0}{1}{2}{3}", contact, email, cellphone, tel);
            return creatorinfo;
        }
    }
}
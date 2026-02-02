using System;
using System.Collections.Generic;
using System.Data;
using System.Drawing;
using System.Drawing.Imaging;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;

namespace ERP.SharedServices.BarCode
{
    /// <summary>
    /// 功能：一维条形码
    /// 说明：采用Code128编码，BarCode128有三种不同的版本：A（数字、大写字母、控制字符）B（数字、大小字母、字符）C（双位数字）
    /// 创建人：
    /// 创建时间:2014年4月23日
    /// </summary>
    public class Code128
    {
        private readonly DataTable _mCode128 = new DataTable();
        private uint _mHeight = 40;

        /// <summary>
        /// 条形码高度
        /// </summary>
        public uint Height
        {
            get { return _mHeight; }
            set { _mHeight = value; }
        }

        private Font _mValueFont;

        /// <summary>
        /// 是否显示可见号码  如果为NULL不显示号码
        /// </summary>
        public Font ValueFont
        {
            get { return _mValueFont; }
            set { _mValueFont = value; }
        }

        private byte _mMagnify;
        /// <summary>
        /// 放大倍数
        /// </summary>
        public byte Magnify
        {
            get { return _mMagnify; }
            set { _mMagnify = value; }
        }

        /// <summary>
        /// 条码类别
        /// </summary>
        public enum Encode
        {
            Code128A,
            Code128B,
            Code128C,
            Ean128,
        }

        /// <summary>
        /// 构造函数
        /// </summary>
        public Code128()
        {

            _mCode128.Columns.Add("ID");

            _mCode128.Columns.Add("Code128A");

            _mCode128.Columns.Add("Code128B");

            _mCode128.Columns.Add("Code128C");

            _mCode128.Columns.Add("BandCode");

            _mCode128.CaseSensitive = true;

            #region 数据表

            _mCode128.Rows.Add("0", " ", " ", "00", "212222");

            _mCode128.Rows.Add("1", "!", "!", "01", "222122");

            _mCode128.Rows.Add("2", "\"", "\"", "02", "222221");

            _mCode128.Rows.Add("3", "#", "#", "03", "121223");

            _mCode128.Rows.Add("4", "$", "$", "04", "121322");

            _mCode128.Rows.Add("5", "%", "%", "05", "131222");

            _mCode128.Rows.Add("6", "&", "&", "06", "122213");

            _mCode128.Rows.Add("7", "'", "'", "07", "122312");

            _mCode128.Rows.Add("8", "(", "(", "08", "132212");

            _mCode128.Rows.Add("9", ")", ")", "09", "221213");

            _mCode128.Rows.Add("10", "*", "*", "10", "221312");

            _mCode128.Rows.Add("11", "+", "+", "11", "231212");

            _mCode128.Rows.Add("12", ",", ",", "12", "112232");

            _mCode128.Rows.Add("13", "-", "-", "13", "122132");

            _mCode128.Rows.Add("14", ".", ".", "14", "122231");

            _mCode128.Rows.Add("15", "/", "/", "15", "113222");

            _mCode128.Rows.Add("16", "0", "0", "16", "123122");

            _mCode128.Rows.Add("17", "1", "1", "17", "123221");

            _mCode128.Rows.Add("18", "2", "2", "18", "223211");

            _mCode128.Rows.Add("19", "3", "3", "19", "221132");

            _mCode128.Rows.Add("20", "4", "4", "20", "221231");

            _mCode128.Rows.Add("21", "5", "5", "21", "213212");

            _mCode128.Rows.Add("22", "6", "6", "22", "223112");

            _mCode128.Rows.Add("23", "7", "7", "23", "312131");

            _mCode128.Rows.Add("24", "8", "8", "24", "311222");

            _mCode128.Rows.Add("25", "9", "9", "25", "321122");

            _mCode128.Rows.Add("26", ":", ":", "26", "321221");

            _mCode128.Rows.Add("27", ";", ";", "27", "312212");

            _mCode128.Rows.Add("28", "<", "<", "28", "322112");

            _mCode128.Rows.Add("29", "=", "=", "29", "322211");

            _mCode128.Rows.Add("30", ">", ">", "30", "212123");

            _mCode128.Rows.Add("31", "?", "?", "31", "212321");

            _mCode128.Rows.Add("32", "@", "@", "32", "232121");

            _mCode128.Rows.Add("33", "A", "A", "33", "111323");

            _mCode128.Rows.Add("34", "B", "B", "34", "131123");

            _mCode128.Rows.Add("35", "C", "C", "35", "131321");

            _mCode128.Rows.Add("36", "D", "D", "36", "112313");

            _mCode128.Rows.Add("37", "E", "E", "37", "132113");

            _mCode128.Rows.Add("38", "F", "F", "38", "132311");

            _mCode128.Rows.Add("39", "G", "G", "39", "211313");

            _mCode128.Rows.Add("40", "H", "H", "40", "231113");

            _mCode128.Rows.Add("41", "I", "I", "41", "231311");

            _mCode128.Rows.Add("42", "J", "J", "42", "112133");

            _mCode128.Rows.Add("43", "K", "K", "43", "112331");

            _mCode128.Rows.Add("44", "L", "L", "44", "132131");

            _mCode128.Rows.Add("45", "M", "M", "45", "113123");

            _mCode128.Rows.Add("46", "N", "N", "46", "113321");

            _mCode128.Rows.Add("47", "O", "O", "47", "133121");

            _mCode128.Rows.Add("48", "P", "P", "48", "313121");

            _mCode128.Rows.Add("49", "Q", "Q", "49", "211331");

            _mCode128.Rows.Add("50", "R", "R", "50", "231131");

            _mCode128.Rows.Add("51", "S", "S", "51", "213113");

            _mCode128.Rows.Add("52", "T", "T", "52", "213311");

            _mCode128.Rows.Add("53", "U", "U", "53", "213131");

            _mCode128.Rows.Add("54", "V", "V", "54", "311123");

            _mCode128.Rows.Add("55", "W", "W", "55", "311321");

            _mCode128.Rows.Add("56", "X", "X", "56", "331121");

            _mCode128.Rows.Add("57", "Y", "Y", "57", "312113");

            _mCode128.Rows.Add("58", "Z", "Z", "58", "312311");

            _mCode128.Rows.Add("59", "[", "[", "59", "332111");

            _mCode128.Rows.Add("60", "\\", "\\", "60", "314111");

            _mCode128.Rows.Add("61", "]", "]", "61", "221411");

            _mCode128.Rows.Add("62", "^", "^", "62", "431111");

            _mCode128.Rows.Add("63", "_", "_", "63", "111224");

            _mCode128.Rows.Add("64", "NUL", "`", "64", "111422");

            _mCode128.Rows.Add("65", "SOH", "a", "65", "121124");

            _mCode128.Rows.Add("66", "STX", "b", "66", "121421");

            _mCode128.Rows.Add("67", "ETX", "c", "67", "141122");

            _mCode128.Rows.Add("68", "EOT", "d", "68", "141221");

            _mCode128.Rows.Add("69", "ENQ", "e", "69", "112214");

            _mCode128.Rows.Add("70", "ACK", "f", "70", "112412");

            _mCode128.Rows.Add("71", "BEL", "g", "71", "122114");

            _mCode128.Rows.Add("72", "BS", "h", "72", "122411");

            _mCode128.Rows.Add("73", "HT", "i", "73", "142112");

            _mCode128.Rows.Add("74", "LF", "j", "74", "142211");

            _mCode128.Rows.Add("75", "VT", "k", "75", "241211");

            _mCode128.Rows.Add("76", "FF", "I", "76", "221114");

            _mCode128.Rows.Add("77", "CR", "m", "77", "413111");

            _mCode128.Rows.Add("78", "SO", "n", "78", "241112");

            _mCode128.Rows.Add("79", "SI", "o", "79", "134111");

            _mCode128.Rows.Add("80", "DLE", "p", "80", "111242");

            _mCode128.Rows.Add("81", "DC1", "q", "81", "121142");

            _mCode128.Rows.Add("82", "DC2", "r", "82", "121241");

            _mCode128.Rows.Add("83", "DC3", "s", "83", "114212");

            _mCode128.Rows.Add("84", "DC4", "t", "84", "124112");

            _mCode128.Rows.Add("85", "NAK", "u", "85", "124211");

            _mCode128.Rows.Add("86", "SYN", "v", "86", "411212");

            _mCode128.Rows.Add("87", "ETB", "w", "87", "421112");

            _mCode128.Rows.Add("88", "CAN", "x", "88", "421211");

            _mCode128.Rows.Add("89", "EM", "y", "89", "212141");

            _mCode128.Rows.Add("90", "SUB", "z", "90", "214121");

            _mCode128.Rows.Add("91", "ESC", "{", "91", "412121");

            _mCode128.Rows.Add("92", "FS", "|", "92", "111143");

            _mCode128.Rows.Add("93", "GS", "}", "93", "111341");

            _mCode128.Rows.Add("94", "RS", "~", "94", "131141");

            _mCode128.Rows.Add("95", "US", "DEL", "95", "114113");

            _mCode128.Rows.Add("96", "FNC3", "FNC3", "96", "114311");

            _mCode128.Rows.Add("97", "FNC2", "FNC2", "97", "411113");

            _mCode128.Rows.Add("98", "SHIFT", "SHIFT", "98", "411311");

            _mCode128.Rows.Add("99", "CODEC", "CODEC", "99", "113141");

            _mCode128.Rows.Add("100", "CODEB", "FNC4", "CODEB", "114131");

            _mCode128.Rows.Add("101", "FNC4", "CODEA", "CODEA", "311141");

            _mCode128.Rows.Add("102", "FNC1", "FNC1", "FNC1", "411131");

            _mCode128.Rows.Add("103", "StartA", "StartA", "StartA", "211412");

            _mCode128.Rows.Add("104", "StartB", "StartB", "StartB", "211214");

            _mCode128.Rows.Add("105", "StartC", "StartC", "StartC", "211232");

            _mCode128.Rows.Add("106", "Stop", "Stop", "Stop", "2331112");

            #endregion

        }

        /// <summary>
        /// 获取128图形
        /// </summary>
        /// <param name="pText">文字</param>
        /// <param name="pCode">编码</param>      
        /// <returns>图形</returns>
        public Bitmap GetCodeImage(string pText, Encode pCode)
        {
            string viewText = pText;
            string text = "";
            IList<int> textNumb = new List<int>();
            int examine;  //首位
            switch (pCode)
            {
                case Encode.Code128C:
                    examine = 105;
                    if (!((pText.Length & 1) == 0))
                        throw new Exception("128C长度必须是偶数");
                    while (pText.Length != 0)
                    {
                        int temp = 0;
                        try
                        {
                            Int32.Parse(pText.Substring(0, 2));
                        }
                        catch
                        {
                            throw new Exception("128C必须是数字！");
                        }
                        text += GetValue(pCode, pText.Substring(0, 2), ref temp);
                        textNumb.Add(temp);
                        pText = pText.Remove(0, 2);
                    }
                    break;
                case Encode.Ean128:
                    examine = 105;
                    if (!((pText.Length & 1) == 0)) throw new Exception("EAN128长度必须是偶数");
                    textNumb.Add(102);
                    text += "411131";
                    while (pText.Length != 0)
                    {
                        int temp = 0;
                        try
                        {
                            Int32.Parse(pText.Substring(0, 2));
                        }
                        catch
                        {
                            throw new Exception("128C必须是数字！");
                        }

                        text += GetValue(Encode.Code128C, pText.Substring(0, 2), ref temp);
                        textNumb.Add(temp);
                        pText = pText.Remove(0, 2);
                    }
                    break;
                default:
                    if (pCode == Encode.Code128A)
                    {
                        examine = 103;
                    }
                    else
                    {
                        examine = 104;
                    }
                    while (pText.Length != 0)
                    {
                        int temp = 0;
                        string valueCode = GetValue(pCode, pText.Substring(0, 1), ref temp);
                        if (valueCode.Length == 0) throw new Exception("无效的字符集!" + pText.Substring(0, 1));
                        text += valueCode;
                        textNumb.Add(temp);
                        pText = pText.Remove(0, 1);
                    }
                    break;
            }
            if (textNumb.Count == 0) throw new Exception("错误的编码,无数据");
            text = text.Insert(0, GetValue(examine)); //获取开始位
            for (int i = 0; i != textNumb.Count; i++)
            {
                examine += textNumb[i] * (i + 1);
            }
            examine = examine % 103;           //获得严效位
            text += GetValue(examine);  //获取严效位
            text += "2331112"; //结束位
            Bitmap codeImage = GetImage(text);
            GetViewText(codeImage, viewText);
            return codeImage;
        }

        /// <summary>
        /// 保存条形码到指定的路径
        /// </summary>
        /// <param name="pText">待转换的条码</param>
        /// <param name="pCode">编译类型</param>
        /// <param name="path">条码保存路径</param>
        /// <param name="font">字体,默认20号宋体</param>
        /// <param name="imgFormat">图片格式，默认为Gif</param>
        public void SaveImage(string pText, Encode pCode, string path, Font font, ImageFormat imgFormat)
        {
            ValueFont = font ?? new Font("Arial", 20);
            ImageFormat format = imgFormat ?? ImageFormat.Gif;
            Bitmap mBitmap = GetCodeImage(pText, pCode);
            //保存到磁盘
            mBitmap.Save(path, format);
        }


        ///// <summary>
        ///// 获取条形码BitmapSource
        ///// </summary>
        ///// <param name="pText">待转换的条码</param>
        ///// <param name="pCode">编译类型</param>
        ///// <param name="font">字体,默认20号宋体</param>
        ///// <returns>BitmapSource</returns>
        //public BitmapSource GetCodeBitmapSource(string pText, Encode pCode, Font font)
        //{
        //    ValueFont = font ?? new Font("宋体", 20);
        //    Bitmap mBitmap = GetCodeImage(pText, pCode);

        //    IntPtr ip = mBitmap.GetHbitmap();
        //    BitmapSource bitmapSource = System.Windows.Interop.Imaging.CreateBitmapSourceFromHBitmap(
        //        ip, IntPtr.Zero, Int32Rect.Empty, BitmapSizeOptions.FromEmptyOptions());
        //    DeleteObject(ip);
        //    return bitmapSource;
        //}

        [DllImport("gdi32")]
        static extern int DeleteObject(IntPtr o);

        /// <summary>
        /// 获取目标对应的数据
        /// </summary>
        /// <param name="pCode">编码</param>
        /// <param name="pValue">数值 A b  30</param>
        /// <param name="pSetID">返回编号</param>
        /// <returns>编码</returns>
        private string GetValue(Encode pCode, string pValue, ref int pSetID)
        {

            if (_mCode128 == null) return "";

            DataRow[] row = _mCode128.Select(pCode.ToString() + "='" + pValue + "'");

            if (row.Length != 1) throw new Exception("错误的编码" + pValue);

            pSetID = Int32.Parse(row[0]["ID"].ToString());

            return row[0]["BandCode"].ToString();

        }

        /// <summary>
        /// 根据编号获得条纹
        /// </summary>
        /// <param name="pCodeId"></param>
        /// <returns></returns>
        private string GetValue(int pCodeId)
        {
            DataRow[] row = _mCode128.Select("ID='" + pCodeId + "'");
            if (row.Length != 1) throw new Exception("验效位的编码错误" + pCodeId);
            return row[0]["BandCode"].ToString();
        }

        /// <summary>
        /// 获得条码图形
        /// </summary>
        /// <param name="pText">文字</param>
        /// <returns>图形</returns>
        private Bitmap GetImage(string pText)
        {
            char[] value = pText.ToCharArray();
            int width = 0;
            for (int i = 0; i != value.Length; i++)
            {
                width += Int32.Parse(value[i].ToString()) * (_mMagnify + 1);
            }
            Bitmap codeImage = new Bitmap(width, (int)_mHeight);
            Graphics garphics = Graphics.FromImage(codeImage);
            //Pen _Pen;
            int lenEx = 0;
            for (int i = 0; i != value.Length; i++)
            {
                int valueNumb = Int32.Parse(value[i].ToString()) * (_mMagnify + 1);  //获取宽和放大系数
                if (!((i & 1) == 0))
                {
                    garphics.FillRectangle(Brushes.White, new Rectangle(lenEx, 0, valueNumb, (int)_mHeight));
                }
                else
                {
                    garphics.FillRectangle(Brushes.Black, new Rectangle(lenEx, 0, valueNumb, (int)_mHeight));
                }
                lenEx += valueNumb;
            }
            garphics.Dispose();
            return codeImage;
        }

        /// <summary>
        /// 显示可见条码文字 如果小于40 不显示文字
        /// </summary>
        /// <param name="pBitmap">图形</param>
        /// <param name="pViewText"></param>           
        private void GetViewText(Bitmap pBitmap, string pViewText)
        {
            if (_mValueFont == null)
                return;
            Graphics graphics = Graphics.FromImage(pBitmap);
            SizeF drawSize = graphics.MeasureString(pViewText, _mValueFont);
            if (drawSize.Height > pBitmap.Height - 10 || drawSize.Width > pBitmap.Width)
            {
                graphics.Dispose();
                return;
            }
            int starY = pBitmap.Height - (int)drawSize.Height;
            graphics.FillRectangle(Brushes.White, new Rectangle(0, starY, pBitmap.Width, (int)drawSize.Height));
            graphics.DrawString(pViewText, _mValueFont, Brushes.Black, 0, starY);
        }

        internal Image GetCodeImage(string p)
        {
            throw new NotImplementedException();
        }
    }
}

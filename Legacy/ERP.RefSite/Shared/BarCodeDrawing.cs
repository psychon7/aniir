using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Drawing;
using System.Collections;

namespace ERP.RefSite.Shared
{
    public class BarCodeDrawing
    {
        private Hashtable m_barcodedrawing = new Hashtable();

        private byte m_magnify = 0;
        /// <summary>
        /// 放大倍数
        /// </summary>
        public byte magnify { get { return m_magnify; } set { m_magnify = value; } }

        private int m_height = 40;
        /// <summary>
        /// 图形高
        /// </summary>
        public int height { get { return m_height; } set { m_height = value; } }

        private Font m_viewfont = null;
        /// <summary>
        /// 字体大小
        /// </summary>
        public Font viewfont { get { return m_viewfont; } set { m_viewfont = value; } }

        public BarCodeDrawing()
        {
            m_barcodedrawing.Add("a", "1101010010110");
            m_barcodedrawing.Add("b", "1011010010110");
            m_barcodedrawing.Add("c", "1101101001010");
            m_barcodedrawing.Add("d", "1010110010110");
            m_barcodedrawing.Add("e", "1101011001010");
            m_barcodedrawing.Add("f", "1011011001010");
            m_barcodedrawing.Add("g", "1010100110110");
            m_barcodedrawing.Add("h", "1101010011010");
            m_barcodedrawing.Add("i", "1011010011010");
            m_barcodedrawing.Add("j", "1010110011010");
            m_barcodedrawing.Add("k", "1101010100110");
            m_barcodedrawing.Add("l", "1011010100110");
            m_barcodedrawing.Add("m", "1101101010010");
            m_barcodedrawing.Add("n", "1010110100110");
            m_barcodedrawing.Add("o", "1101011010010");
            m_barcodedrawing.Add("p", "1011011010010");
            m_barcodedrawing.Add("q", "1010101100110");
            m_barcodedrawing.Add("r", "1101010110010");
            m_barcodedrawing.Add("s", "1011010110010");
            m_barcodedrawing.Add("t", "1010110110010");
            m_barcodedrawing.Add("u", "1100101010110");
            m_barcodedrawing.Add("v", "1001101010110");
            m_barcodedrawing.Add("w", "1100110101010");
            m_barcodedrawing.Add("x", "1001011010110");
            m_barcodedrawing.Add("y", "1100101101010");
            m_barcodedrawing.Add("z", "1001101101010");
            m_barcodedrawing.Add("0", "1010011011010");
            m_barcodedrawing.Add("1", "1101001010110");
            m_barcodedrawing.Add("2", "1011001010110");
            m_barcodedrawing.Add("3", "1101100101010");
            m_barcodedrawing.Add("4", "1010011010110");
            m_barcodedrawing.Add("5", "1101001101010");
            m_barcodedrawing.Add("6", "1011001101010");
            m_barcodedrawing.Add("7", "1010010110110");
            m_barcodedrawing.Add("8", "1101001011010");
            m_barcodedrawing.Add("9", "1011001011010");
            m_barcodedrawing.Add("+", "1001010010010");
            m_barcodedrawing.Add("-", "1001010110110");
            m_barcodedrawing.Add("*", "1001011011010");
            m_barcodedrawing.Add("/", "1001001010010");
            m_barcodedrawing.Add("%", "1010010010010");
            m_barcodedrawing.Add("contentquot", "1001001001010");
            m_barcodedrawing.Add(".", "1100101011010");
            m_barcodedrawing.Add(" ", "1001101011010");

        }

        public enum BarCodeDrawingModel
        {
            /// <summary>
            /// 基本类别 1234567890abc
            /// </summary>
            BarCodeDrawingNormal,
            /// <summary>
            /// 全ascii方式 +a+b 来表示小写
            /// </summary>
            BarCodeDrawingFullAscii
        }
        /// <summary>
        /// 获得条码图形
        /// </summary>
        /// <param name="p_text">文字信息</param>
        /// <param name="p_model">类别</param>
        /// <param name="p_starchar">是否增加前后*号</param>
        /// <returns>图形</returns>
        public Bitmap GetCodeImage(string p_text, BarCodeDrawingModel p_model, bool p_starchar)
        {
            string _valuetext = "";
            string _codetext = "";
            char[] _valuechar = null;
            switch (p_model)
            {
                case BarCodeDrawingModel.BarCodeDrawingNormal:
                    _valuetext = p_text.ToLower();
                    break;
                default:
                    _valuechar = p_text.ToCharArray();
                    for (int i = 0; i != _valuechar.Length; i++)
                    {
                        if ((int)_valuechar[i] >= 97 && (int)_valuechar[i] <= 122)
                        {
                            _valuetext += "+" + _valuechar[i].ToString().ToUpper();

                        }
                        else
                        {
                            _valuetext += _valuechar[i].ToString();
                        }
                    }
                    break;
            }


            _valuechar = _valuetext.ToCharArray();

            if (p_starchar == true) _codetext += m_barcodedrawing["*"];

            for (int i = 0; i != _valuechar.Length; i++)
            {
                if (p_starchar == true && _valuechar[i] == '*') throw new Exception("带有起始符号不能出现*");

                object _charcode = m_barcodedrawing[_valuechar[i].ToString()];
                if (_charcode == null)
                {
                    throw new Exception("不可用的字符" + _valuechar[i].ToString());
                }
                _codetext += _charcode.ToString();
            }


            if (p_starchar == true) _codetext += m_barcodedrawing["*"];


            Bitmap _codebmp = getimage(_codetext);
            getviewimage(_codebmp, p_text);
            return _codebmp;
        }

        public byte[] GetCodeImageByte(string p_text, BarCodeDrawingModel p_model, bool p_starchar)
        {
            var bitmaps = GetCodeImage(p_text, p_model, p_starchar);
            ImageConverter converter = new ImageConverter();
            try
            {
                return (byte[])converter.ConvertTo(bitmaps, typeof(byte[]));
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>
        /// 绘制编码图形
        /// </summary>
        /// <param name="p_text">编码</param>
        /// <returns>图形</returns>
        private Bitmap getimage(string p_text)
        {
            char[] _value = p_text.ToCharArray();


            //宽 == 需要绘制的数量*放大倍数 + 两个字的宽   
            Bitmap _codeimage = new Bitmap(_value.Length * ((int)m_magnify + 1), (int)m_height);
            Graphics _garphics = Graphics.FromImage(_codeimage);

            _garphics.FillRectangle(Brushes.White, new Rectangle(0, 0, _codeimage.Width, _codeimage.Height));

            int _lenex = 0;
            for (int i = 0; i != _value.Length; i++)
            {
                int _drawwidth = m_magnify + 1;
                if (_value[i] == '1')
                {
                    _garphics.FillRectangle(Brushes.Black, new Rectangle(_lenex, 0, _drawwidth, m_height));

                }
                else
                {
                    _garphics.FillRectangle(Brushes.White, new Rectangle(_lenex, 0, _drawwidth, m_height));
                }
                _lenex += _drawwidth;
            }
            _garphics.Dispose();
            return _codeimage;
        }
        /// <summary>
        /// 绘制文字
        /// </summary>
        /// <param name="p_codeimage">图形</param>
        /// <param name="p_text">文字</param>
        private void getviewimage(Bitmap p_codeimage, string p_text)
        {
            if (m_viewfont == null) return;
            Graphics _graphics = Graphics.FromImage(p_codeimage);
            SizeF _fontsize = _graphics.MeasureString(p_text, m_viewfont);

            if (_fontsize.Width > p_codeimage.Width || _fontsize.Height > p_codeimage.Height - 20)
            {
                _graphics.Dispose();
                return;
            }
            int _starheight = p_codeimage.Height - (int)_fontsize.Height;

            _graphics.FillRectangle(Brushes.White, new Rectangle(0, _starheight, p_codeimage.Width, (int)_fontsize.Height));

            int _starwidth = (p_codeimage.Width - (int)_fontsize.Width) / 2;

            _graphics.DrawString(p_text, m_viewfont, Brushes.Black, _starwidth, _starheight);

            _graphics.Dispose();

        }
    }
}
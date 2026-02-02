using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using System.Drawing.Imaging;
using System.IO;

namespace ERP.App
{
    public partial class FmNewOrder : Form
    {
        public FmNewOrder()
        {
            InitializeComponent();
        }

        private void btn_create_order_Click(object sender, EventArgs e)
        {
            var today = dtpTody.Value;
            var EndDateD = dtpEndDateD.Value;
            var EndDateP = dtpEndDateP.Value;

            //var ColorTmp = txbColorTemperature.Text;
            //var length = txbLength.Text;
            //var width = txbWidth.Text;
            //var height = txbHeight.Text;
            //var diameter = txbDiameter.Text;
            //var driver = txbDriver.Text;
            //var qty = txbQuantity.Text;
            //var comment = rtxbComment.Text;
            //var power = txbPower.Text;



            //var text = string.Format(@"日期：{1}{0}期望完成日期：{2}{0}预计完成日期：{3}{0}色温：{4}{0}长度：{5}{0}宽度：{6}{0}高度：{7}{0}直径：{8}{0}驱动配置：{9}{0}功率：{12}{0}数量：{10}{0}备注：{0}{11}",
            //      Environment.NewLine,
            //    today.ToShortDateString(),
            //    EndDateD.ToShortDateString(),
            //    EndDateP.ToShortDateString(),
            //    ColorTmp,
            //    length,
            //    width,
            //    height,
            //    diameter,
            //    driver,
            //    qty,
            //    comment,
            //    power);

            var text = string.Empty;
            var prd1 = GetPrd1Info();
            var prd2 = GetPrd2Info();
            var prd3 = GetPrd3Info();
            var prd4 = GetPrd4Info();

            var count1 = string.IsNullOrEmpty(prd1) ? null : "1";
            var count2 = !string.IsNullOrEmpty(count1) && !string.IsNullOrEmpty(prd2) ? "2" : null;
            var count3 = !string.IsNullOrEmpty(count2) && !string.IsNullOrEmpty(prd3) ? "3" : null;
            var count4 = !string.IsNullOrEmpty(count3) && !string.IsNullOrEmpty(prd4) ? "4" : null;

            var prd2info = string.Format(@"{0}{1}{2}{3}",
                count2,
                string.IsNullOrEmpty(count2) ? null : Environment.NewLine,
                string.IsNullOrEmpty(count2) ? null : prd2,
                string.IsNullOrEmpty(count2) ? null : Environment.NewLine
                );

            text = string.Format(@"日期：{1}{0}期望完成日期：{2}{0}预计完成日期：{3}{0}{4}{0}{5}
{6}
{7}{0}{8}
{9}{0}{10}",
                Environment.NewLine,
                today.ToShortDateString(),
                EndDateD.ToShortDateString(),
                EndDateP.ToShortDateString(),
                count1,
                prd1,
                //count2,
                //prd2,
                prd2info,
                count3,
                prd3,
                count4,
                prd4
                );

            var msg = MessageBox.Show(text);

            //var test001 = Directory.GetCurrentDirectory();

            SaveImage(text);
        }

        private string GetPrd1Info()
        {
            var colorTmp = txbColorTemperature.Text;
            var length = txbLength.Text;
            var width = txbWidth.Text;
            var height = txbHeight.Text;
            var diameter = txbDiameter.Text;
            var driver = txbDriver.Text;
            var qty = txbQuantity.Text;
            var comment = rtxbComment.Text;
            var power = txbPower.Text;


            string text = null;
            if (!string.IsNullOrEmpty(colorTmp))
            {
                text = string.Format(@"色温：{1}{0}长度：{2}{0}宽度：{3}{0}高度：{4}{0}直径：{5}{0}驱动配置：{6}{0}功率：{7}{0}数量：{8}{0}备注：{0}{9}",
                  Environment.NewLine,
                colorTmp,
                length,
                width,
                height,
                diameter,
                driver,
                power,
                qty,
                comment);
            }

            return text;
        }

        private string GetPrd2Info()
        {
            var colorTmp = txbColorTmp2.Text;
            var length = txbLength2.Text;
            var width = txbWidth2.Text;
            var height = txbHeight2.Text;
            var diameter = txbDiameter2.Text;
            var driver = txbDriver2.Text;
            var qty = txbQty2.Text;
            var comment = rtxbComment2.Text;
            var power = txbPower2.Text;


            string text = null;
            if (!string.IsNullOrEmpty(colorTmp))
            {
                text = string.Format(@"色温：{1}{0}长度：{2}{0}宽度：{3}{0}高度：{4}{0}直径：{5}{0}驱动配置：{6}{0}功率：{7}{0}数量：{8}{0}备注：{0}{9}",
                  Environment.NewLine,
                colorTmp,
                length,
                width,
                height,
                diameter,
                driver,
                power,
                qty,
                comment);
            }

            return text;
        }

        private string GetPrd3Info()
        {
            var colorTmp = txbColorTmp3.Text;
            var length = txbLength3.Text;
            var width = txbWidth3.Text;
            var height = txbHeight3.Text;
            var diameter = txbDiameter3.Text;
            var driver = txbDriver3.Text;
            var qty = txbQty3.Text;
            var comment = rtxbComment3.Text;
            var power = txbPower3.Text;


            string text = null;
            if (!string.IsNullOrEmpty(colorTmp))
            {
                text = string.Format(@"色温：{1}{0}长度：{2}{0}宽度：{3}{0}高度：{4}{0}直径：{5}{0}驱动配置：{6}{0}功率：{7}{0}数量：{8}{0}备注：{0}{9}",
                  Environment.NewLine,
                colorTmp,
                length,
                width,
                height,
                diameter,
                driver,
                power,
                qty,
                comment);
            }

            return text;
        }

        private string GetPrd4Info()
        {
            var colorTmp = txbColorTmp4.Text;
            var length = txbLength4.Text;
            var width = txbWidth4.Text;
            var height = txbHeight4.Text;
            var diameter = txbDiameter4.Text;
            var driver = txbDriver4.Text;
            var qty = txbQty4.Text;
            var comment = rtxbComment4.Text;
            var power = txbPower4.Text;


            string text = null;
            if (!string.IsNullOrEmpty(colorTmp))
            {
                text = string.Format(@"色温：{1}{0}长度：{2}{0}宽度：{3}{0}高度：{4}{0}直径：{5}{0}驱动配置：{6}{0}功率：{7}{0}数量：{8}{0}备注：{0}{9}",
                  Environment.NewLine,
                colorTmp,
                length,
                width,
                height,
                diameter,
                driver,
                power,
                qty,
                comment);
            }

            return text;
        }

        private void SaveImage(string text)
        {
            var filePath = @"D:\Name.jpg";
            int wid = 400;
            int high = 600;
            Font font = new Font("Arial", 12, FontStyle.Bold);
            //绘笔颜色
            SolidBrush brush = new SolidBrush(Color.Black);
            Bitmap image = new Bitmap(wid, high);
            Graphics g = Graphics.FromImage(image);
            g.Clear(ColorTranslator.FromHtml("#FFFFFF"));
            RectangleF rect = new RectangleF(5, 2, wid, high);
            //绘制图片
            g.DrawString(text, font, brush, rect);
            //保存图片
            image.Save(filePath, ImageFormat.Png);
            //释放对象
            g.Dispose();
            image.Dispose();

            //Drawing dh = new Drawing();
            //Console.WriteLine("输入你的名字：");
            //string name = Console.ReadLine();
            //dh.CreateImage(name, filePath);

            startCopyImg(filePath);
        }

        private void startCopyImg(string imgFilePath)
        {
            IDataObject data = new DataObject(DataFormats.FileDrop, new string[] { imgFilePath });
            MemoryStream memo = new MemoryStream(4);
            byte[] bytes = new byte[] { (byte)(5), 0, 0, 0 };
            memo.Write(bytes, 0, bytes.Length);
            data.SetData("ttt", memo);
            Clipboard.SetDataObject(data);
        }

    }
}

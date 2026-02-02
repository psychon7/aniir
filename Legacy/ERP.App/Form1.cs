using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using ERP.App.Shared;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories.DataBase;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using NPOI.SS.Util;
using NPOI.XSSF.UserModel;
using ERP.Repositories;
using Excel = Microsoft.Office.Interop.Excel;
using ERP.Repositories.Extensions;       //Microsoft Excel 14 object in references-> COM tab

namespace ERP.App
{
    public partial class Form1 : Form
    {
        private TreateExcelFields TreateExcelFields = new TreateExcelFields();
        private ProductTypeServices ProductTypeServices = new ProductTypeServices();
        private ProductServices ProductServices = new ProductServices();
        private CategoryServices CategoryServices = new CategoryServices();
        private ClientInvoiceServices ClientInvoiceServices = new ClientInvoiceServices();
        private ClientOrderServices ClientOrderServices = new ClientOrderServices();

        public Form1()
        {
            InitializeComponent();
            try
            {
                IniCbx();
            }
            catch (Exception)
            {
            }
        }

        public void IniCbx()
        {
            var ptys = ProductTypeServices.GetProductTypesBySocId(1, 0);
            var listCbxItems = ptys.Select(m => new ComboboxItem
            {
                Text = m.Value,
                Value = m.Key
            }).ToArray();

            cbx_pty.Items.AddRange(listCbxItems);
            cbx_pty.SelectedIndex = 0;
        }

        private void btn_read_excel_Click(object sender, EventArgs e)
        {
            //return;
            var basePath = @"G:\";
            //var basePath = @"C:\Users\Chenglin\Dropbox\FICHES TECHNIQUES";
            var allFolder = Directory.GetDirectories(basePath);
            List<string> folder2Treat = new List<string>();
            string ptyValue = cbx_pty.SelectedItem.ToString();
            int PtyId = Convert.ToInt32((cbx_pty.SelectedItem as ComboboxItem).Value);
            if (!string.IsNullOrEmpty(ptyValue))
            {
                folder2Treat = allFolder.Where(m => m != null && Path.GetFileName(m).StartsWith(ptyValue)).ToList();
                var listFiles2Treat = new List<string>();
                foreach (var folder in folder2Treat)
                {
                    var files =
                        System.IO.Directory.GetFiles(folder, "*.xlsx", System.IO.SearchOption.AllDirectories).ToList();
                    listFiles2Treat.AddRange(files);
                    files =
                        System.IO.Directory.GetFiles(folder, "*.xls", System.IO.SearchOption.AllDirectories).ToList();
                    listFiles2Treat.AddRange(files);
                    files =
                        System.IO.Directory.GetFiles(folder, "*.ods", System.IO.SearchOption.AllDirectories).ToList();
                    listFiles2Treat.AddRange(files);
                }
                listFiles2Treat = listFiles2Treat.Distinct().ToList();

                var listProduct = new List<List<KeyValue>>();

                foreach (var afile in listFiles2Treat)
                {
                    listProduct.Add(ReadExcel(afile));
                }

                var prdPropValues = ProductServices.GetPtyProppertyValues(PtyId, 1);

                foreach (var onePrd in listProduct)
                {
                    TreateExcelFields.GetProductFromExcelKeyValue(onePrd, prdPropValues, PtyId);
                }
            }
        }

        private List<KeyValue> ReadExcel(string excelPath)
        {
            Excel.Application xlApp = new Excel.Application();
            Excel.Workbook xlWorkbook = xlApp.Workbooks.Open(excelPath, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing); // if working with another excel
            Excel._Worksheet xlWorksheet = xlWorkbook.Sheets[1];
            Excel.Range xlRange = xlWorksheet.UsedRange;

            int rowCount = xlRange.Rows.Count;
            int colCount = xlRange.Columns.Count;

            Console.WriteLine("Treating file {0}", excelPath);
            //iterate over the rows and columns and print to the console as it appears in the file
            //excel is not zero based!!

            List<KeyValue> listTechSheetFields = new List<KeyValue>();

            // 直接从列入手做
            try
            {
                var lastLine = new KeyValue();
                for (int i = 1; i < rowCount; i++)
                {
                    var keyField = xlRange.Cells[i, 4];
                    var valueField = xlRange.Cells[i, 5];
                    if (keyField != null && valueField != null && !(keyField.Value2 == null && valueField.Value2 == null))
                    {
                        string key = keyField.Value2 == null ? string.Empty : keyField.Value2.ToString();
                        string value = valueField.Value2 == null ? string.Empty : valueField.Value2.ToString();
                        key = key.Trim();
                        value = value.Trim();
                        if (!(string.IsNullOrEmpty(key) && string.IsNullOrEmpty(value)))
                        {
                            var newLine = new KeyValue();
                            if (string.IsNullOrEmpty(key))
                            {
                                newLine.KeyStr1 = lastLine.KeyStr1;
                            }
                            else
                            {
                                newLine.KeyStr1 = key;
                            }
                            newLine.Value = value;
                            newLine.Value2 = Path.GetFileName(excelPath);
                            listTechSheetFields.Add(newLine);
                            lastLine = newLine;
                        }
                    }
                }
            }
            catch (Exception)
            {
                LogWriter.Write(excelPath);
            }


            //cleanup
            GC.Collect();
            GC.WaitForPendingFinalizers();

            //rule of thumb for releasing com objects:
            //  never use two dots, all COM objects must be referenced and released individually
            //  ex: [somthing].[something].[something] is bad

            //release com objects to fully kill excel process from running in the background
            Marshal.ReleaseComObject(xlRange);
            Marshal.ReleaseComObject(xlWorksheet);

            //close and release
            xlWorkbook.Close();
            Marshal.ReleaseComObject(xlWorkbook);

            //quit and release
            xlApp.Quit();
            Marshal.ReleaseComObject(xlApp);
            return listTechSheetFields;
        }

        public class ComboboxItem
        {
            public string Text { get; set; }
            public object Value { get; set; }

            public override string ToString()
            {
                return Text;
            }
        }

        private void btn_set_prd_code_Click(object sender, EventArgs e)
        {
            return;
            ProductServices.ResetPrdCode();
        }

        private void btn_chose_file_Click(object sender, EventArgs e)
        {
            return;
            OpenFileDialog selectFileDialog = new OpenFileDialog();
            Stream fileStream = null;
            //if ((selectFileDialog.ShowDialog() == DialogResult.OK) && (fileStream = selectFileDialog.OpenFile()) != null)
            if (selectFileDialog.ShowDialog() == DialogResult.OK)
            {
                string fileName = selectFileDialog.FileName;
                //var AllLines = ReadExcelWithExcelClass_2017_09_28(fileName);
                //using (fileStream)
                //{
                //    // TODO
                //}

                // 2017-09-28 添加注释
                //foreach (var importExcelClass in AllLines)
                //{
                //    var prdPropValues = ProductServices.GetPtyProppertyValues(importExcelClass.PtyId.Obj2Int().Value, 1);
                //    TreateExcelFields.GetProductExcelWithExcelClass(prdPropValues, importExcelClass);
                //}

                // 2017-09-28 新功能
                var propList = new Dictionary<int, List<PropertyValue>>();

                var propEv = ProductServices.GetPtyProppertyValues(1, 1);
                propList.Add(1, propEv);
                var propEx = ProductServices.GetPtyProppertyValues(2, 1);
                propList.Add(2, propEx);
                var propLu = ProductServices.GetPtyProppertyValues(3, 1);
                propList.Add(3, propLu);
                var propSu = ProductServices.GetPtyProppertyValues(4, 1);
                propList.Add(4, propSu);

                //foreach (var importExcelClass in AllLines)
                //{
                //    var prdPropValues = propList.FirstOrDefault(m => m.Key == importExcelClass.PtyId.Obj2Int().Value).Value;
                //    TreateExcelFields.GetProductExcelWithExcelClass_2017_09_28(prdPropValues, importExcelClass);
                //}
            }
        }

        //private List<ImportExcelClass> ReadExcelWithExcelClass(string excelPath)
        //{
        //    Excel.Application xlApp = new Excel.Application();
        //    Excel.Workbook xlWorkbook = xlApp.Workbooks.Open(excelPath, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing); // if working with another excel
        //    Excel._Worksheet xlWorksheet = xlWorkbook.Sheets[1];
        //    Excel.Range xlRange = xlWorksheet.UsedRange;

        //    int rowCount = xlRange.Rows.Count;
        //    int colCount = xlRange.Columns.Count;

        //    Console.WriteLine("Treating file {0}", excelPath);
        //    //iterate over the rows and columns and print to the console as it appears in the file
        //    //excel is not zero based!!

        //    var listTechSheetFields = new List<ImportExcelClass>();

        //    // 直接从列入手做
        //    try
        //    {
        //        for (int i = 4; i < rowCount; i++)
        //        {
        //            var lastLine = new ImportExcelClass();
        //            //var test = xlRange.Cells[i, 2];
        //            //if (test != null)
        //            //{
        //            //    var testqsdf = test.Value2;
        //            //}
        //            if (i == 31)
        //            {
        //                var qsdfqsdfqsfd = "";
        //            }
        //            lastLine.PtyId = xlRange.Cells[i, 2] != null ? xlRange.Cells[i, 2].Value2 : string.Empty;
        //            lastLine.SupId = xlRange.Cells[i, 3] != null ? xlRange.Cells[i, 3].Value2 : string.Empty;
        //            lastLine.SUPPLIER_REFERENCE = xlRange.Cells[i, 4] != null ? xlRange.Cells[i, 4].Value2 : string.Empty;
        //            lastLine.ECOLED_REFERENCE = xlRange.Cells[i, 5] != null ? xlRange.Cells[i, 5].Value2 : string.Empty;
        //            lastLine.PICTURE__Of_GOODS = xlRange.Cells[i, 6] != null ? xlRange.Cells[i, 6].Value2 : string.Empty;
        //            lastLine.DESCRIPTION_OF_GOODS = xlRange.Cells[i, 7] != null ? xlRange.Cells[i, 7].Value2 : string.Empty;
        //            lastLine.OUTSIDE_DIAMETER_ = xlRange.Cells[i, 8] != null ? xlRange.Cells[i, 8].Value2 : string.Empty;
        //            lastLine.LENGTH_IN_mm = xlRange.Cells[i, 9] != null ? xlRange.Cells[i, 9].Value2 : string.Empty;
        //            lastLine.WIDTH_IN_mm = xlRange.Cells[i, 10] != null ? xlRange.Cells[i, 10].Value2 : string.Empty;
        //            lastLine.HEIGHT_IN_mm = xlRange.Cells[i, 11] != null ? xlRange.Cells[i, 11].Value2 : string.Empty;
        //            lastLine.DEPTH_IN_ = xlRange.Cells[i, 12] != null ? xlRange.Cells[i, 12].Value2 : string.Empty;
        //            lastLine.HOLE_SIZE_IN_ = xlRange.Cells[i, 13] != null ? xlRange.Cells[i, 13].Value2 : string.Empty;
        //            lastLine.BASE = xlRange.Cells[i, 14] != null ? xlRange.Cells[i, 14].Value2 : string.Empty;
        //            lastLine.ELECTRICAL_CLASS = xlRange.Cells[i, 15] != null ? xlRange.Cells[i, 15].Value2 : string.Empty;
        //            lastLine.MATERIAL_TYPE = xlRange.Cells[i, 16] != null ? xlRange.Cells[i, 16].Value2 : string.Empty;
        //            lastLine.DIFUSER_TYPE = xlRange.Cells[i, 17] != null ? xlRange.Cells[i, 17].Value2 : string.Empty;
        //            lastLine.Color_2200K = xlRange.Cells[i, 18] != null ? xlRange.Cells[i, 18].Value2 : string.Empty;
        //            lastLine.Color_2600K = xlRange.Cells[i, 19] != null ? xlRange.Cells[i, 19].Value2 : string.Empty;
        //            lastLine.Color_3000K = xlRange.Cells[i, 20] != null ? xlRange.Cells[i, 20].Value2 : string.Empty;
        //            lastLine.Color_4000K = xlRange.Cells[i, 21] != null ? xlRange.Cells[i, 21].Value2 : string.Empty;
        //            lastLine.Color_5700K = xlRange.Cells[i, 22] != null ? xlRange.Cells[i, 22].Value2 : string.Empty;
        //            lastLine.Color_6000K = xlRange.Cells[i, 23] != null ? xlRange.Cells[i, 23].Value2 : string.Empty;
        //            lastLine.Color_6700K = xlRange.Cells[i, 24] != null ? xlRange.Cells[i, 24].Value2 : string.Empty;
        //            lastLine.Color_RED = xlRange.Cells[i, 25] != null ? xlRange.Cells[i, 25].Value2 : string.Empty;
        //            lastLine.Color_GREEN = xlRange.Cells[i, 26] != null ? xlRange.Cells[i, 26].Value2 : string.Empty;
        //            lastLine.Color_BLUE = xlRange.Cells[i, 27] != null ? xlRange.Cells[i, 27].Value2 : string.Empty;
        //            lastLine.Color_WHITE = xlRange.Cells[i, 28] != null ? xlRange.Cells[i, 28].Value2 : string.Empty;
        //            lastLine.Color_RGB = xlRange.Cells[i, 29] != null ? xlRange.Cells[i, 29].Value2 : string.Empty;
        //            lastLine.Operation_NORMAL = xlRange.Cells[i, 30] != null ? xlRange.Cells[i, 30].Value2 : string.Empty;
        //            lastLine.Operation_DIMMABLE = xlRange.Cells[i, 31] != null ? xlRange.Cells[i, 31].Value2 : string.Empty;
        //            lastLine.Operation_DALI = xlRange.Cells[i, 32] != null ? xlRange.Cells[i, 32].Value2 : string.Empty;
        //            lastLine.IP = xlRange.Cells[i, 33] != null ? xlRange.Cells[i, 33].Value2 : string.Empty;
        //            lastLine.IK = xlRange.Cells[i, 34] != null ? xlRange.Cells[i, 34].Value2 : string.Empty;
        //            lastLine.BRAND_OF_LED = xlRange.Cells[i, 35] != null ? xlRange.Cells[i, 35].Value2 : string.Empty;
        //            lastLine.MODEL_OF_LED = xlRange.Cells[i, 36] != null ? xlRange.Cells[i, 36].Value2 : string.Empty;
        //            lastLine.DRIVER_BRAND = xlRange.Cells[i, 37] != null ? xlRange.Cells[i, 37].Value2 : string.Empty;
        //            lastLine.YIELD = xlRange.Cells[i, 38] != null ? xlRange.Cells[i, 38].Value2 : string.Empty;
        //            lastLine.WEIGHT_OF_PRODUCT = xlRange.Cells[i, 39] != null ? xlRange.Cells[i, 39].Value2 : string.Empty;
        //            lastLine.POWER_ATTS = xlRange.Cells[i, 40] != null ? xlRange.Cells[i, 40].Value2 : string.Empty;
        //            lastLine.METER_POWER = xlRange.Cells[i, 41] != null ? xlRange.Cells[i, 41].Value2 : string.Empty;
        //            lastLine.LED_BY_METER_STRIP_LED_or_LED_BAR = xlRange.Cells[i, 42] != null ? xlRange.Cells[i, 42].Value2 : string.Empty;
        //            lastLine.VOLTAGE = xlRange.Cells[i, 43] != null ? xlRange.Cells[i, 43].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_2600K = xlRange.Cells[i, 44] != null ? xlRange.Cells[i, 44].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_3000K = xlRange.Cells[i, 45] != null ? xlRange.Cells[i, 45].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_4000K = xlRange.Cells[i, 46] != null ? xlRange.Cells[i, 46].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_5700K = xlRange.Cells[i, 47] != null ? xlRange.Cells[i, 47].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_6000K = xlRange.Cells[i, 48] != null ? xlRange.Cells[i, 48].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_6500K = xlRange.Cells[i, 49] != null ? xlRange.Cells[i, 49].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_RED = xlRange.Cells[i, 50] != null ? xlRange.Cells[i, 50].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_GREEN = xlRange.Cells[i, 51] != null ? xlRange.Cells[i, 51].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_BLEU = xlRange.Cells[i, 52] != null ? xlRange.Cells[i, 52].Value2 : string.Empty;
        //            lastLine.REFERENCE_WHITE = xlRange.Cells[i, 53] != null ? xlRange.Cells[i, 53].Value2 : string.Empty;
        //            lastLine.REFERENCE_RGB = xlRange.Cells[i, 54] != null ? xlRange.Cells[i, 54].Value2 : string.Empty;
        //            lastLine.PRODUCT_LIFETIME = xlRange.Cells[i, 55] != null ? xlRange.Cells[i, 55].Value2 : string.Empty;
        //            lastLine.UGR = xlRange.Cells[i, 56] != null ? xlRange.Cells[i, 56].Value2 : string.Empty;
        //            lastLine.ELLIPSE_MacAdam = xlRange.Cells[i, 57] != null ? xlRange.Cells[i, 57].Value2 : string.Empty;
        //            lastLine.GUARANTY = xlRange.Cells[i, 58] != null ? xlRange.Cells[i, 58].Value2 : string.Empty;
        //            lastLine.CARTON_SIZE_BY_UNIT = xlRange.Cells[i, 59] != null ? xlRange.Cells[i, 59].Value2 : string.Empty;
        //            lastLine.Unit_Carton_L = xlRange.Cells[i, 60] != null ? xlRange.Cells[i, 60].Value2 : string.Empty;
        //            lastLine.Unit_Carton_I = xlRange.Cells[i, 61] != null ? xlRange.Cells[i, 61].Value2 : string.Empty;
        //            lastLine.Unit_Carton_H = xlRange.Cells[i, 62] != null ? xlRange.Cells[i, 62].Value2 : string.Empty;
        //            lastLine.WEIGHT_BY_UNIT_KG = xlRange.Cells[i, 63] != null ? xlRange.Cells[i, 63].Value2 : string.Empty;
        //            lastLine.PACKAGING_PER_CARTONS_pcs = xlRange.Cells[i, 64] != null ? xlRange.Cells[i, 64].Value2 : string.Empty;
        //            lastLine.WEIGHT_PER_CARTONS_KG = xlRange.Cells[i, 65] != null ? xlRange.Cells[i, 65].Value2 : string.Empty;
        //            lastLine.Carton_L_mm = xlRange.Cells[i, 69] != null ? xlRange.Cells[i, 69].Value2 : string.Empty;
        //            lastLine.Carton_I_mm = xlRange.Cells[i, 70] != null ? xlRange.Cells[i, 70].Value2 : string.Empty;
        //            lastLine.Carton_H_mm = xlRange.Cells[i, 71] != null ? xlRange.Cells[i, 71].Value2 : string.Empty;
        //            lastLine.PRICE_FROM_SUPPLIER_1 = xlRange.Cells[i, 72] != null ? xlRange.Cells[i, 72].Value2 : string.Empty;
        //            lastLine.PRICE_FROM_SUPPLIER_100 = xlRange.Cells[i, 73] != null ? xlRange.Cells[i, 73].Value2 : string.Empty;
        //            lastLine.PRICE_FROM_SUPPLIER_500PCS = xlRange.Cells[i, 74] != null ? xlRange.Cells[i, 74].Value2 : string.Empty;
        //            lastLine.PUBLIC_PRICE_FROM_ECOLED = xlRange.Cells[i, 75] != null ? xlRange.Cells[i, 75].Value2 : string.Empty;


        //            //var keyField = xlRange.Cells[i, 4];
        //            //var valueField = xlRange.Cells[i, 5];
        //            //if (keyField != null && valueField != null && !(keyField.Value2 == null && valueField.Value2 == null))
        //            //{
        //            //    string key = keyField.Value2 == null ? string.Empty : keyField.Value2.ToString();
        //            //    string value = valueField.Value2 == null ? string.Empty : valueField.Value2.ToString();
        //            //    key = key.Trim();
        //            //    value = value.Trim();
        //            //    if (!(string.IsNullOrEmpty(key) && string.IsNullOrEmpty(value)))
        //            //    {
        //            //        var newLine = new KeyValue();
        //            //        if (string.IsNullOrEmpty(key))
        //            //        {
        //            //            newLine.KeyStr1 = lastLine.KeyStr1;
        //            //        }
        //            //        else
        //            //        {
        //            //            newLine.KeyStr1 = key;
        //            //        }
        //            //        newLine.Value = value;
        //            //        newLine.Value2 = Path.GetFileName(excelPath);
        //            //        listTechSheetFields.Add(newLine);
        //            //        lastLine = newLine;
        //            //    }
        //            //}
        //            listTechSheetFields.Add(lastLine);
        //        }
        //    }
        //    catch (Exception)
        //    {
        //        LogWriter.Write(excelPath);
        //    }


        //    //cleanup
        //    GC.Collect();
        //    GC.WaitForPendingFinalizers();

        //    //rule of thumb for releasing com objects:
        //    //  never use two dots, all COM objects must be referenced and released individually
        //    //  ex: [somthing].[something].[something] is bad

        //    //release com objects to fully kill excel process from running in the background
        //    Marshal.ReleaseComObject(xlRange);
        //    Marshal.ReleaseComObject(xlWorksheet);

        //    //close and release
        //    xlWorkbook.Close();
        //    Marshal.ReleaseComObject(xlWorkbook);

        //    //quit and release
        //    xlApp.Quit();
        //    Marshal.ReleaseComObject(xlApp);
        //    return listTechSheetFields;
        //}

        //private List<ImportExcelClass> ReadExcelWithExcelClass_2017_09_28(string excelPath)
        //{
        //    Excel.Application xlApp = new Excel.Application();
        //    Excel.Workbook xlWorkbook = xlApp.Workbooks.Open(excelPath, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing); // if working with another excel
        //    Excel._Worksheet xlWorksheet = xlWorkbook.Sheets[1];
        //    Excel.Range xlRange = xlWorksheet.UsedRange;

        //    int rowCount = xlRange.Rows.Count;
        //    int colCount = xlRange.Columns.Count;

        //    Console.WriteLine("Treating file {0}", excelPath);
        //    //iterate over the rows and columns and print to the console as it appears in the file
        //    //excel is not zero based!!

        //    var listTechSheetFields = new List<ImportExcelClass>();

        //    // 直接从列入手做
        //    try
        //    {
        //        int startline = 4;
        //        // for test 
        //        //startline = 4;

        //        for (int i = startline; i <= rowCount; i++)
        //        {
        //            var lastLine = new ImportExcelClass();
        //            //var test = xlRange.Cells[i, 2];
        //            //if (test != null)
        //            //{
        //            //    var testqsdf = test.Value2;
        //            //}
        //            if (i == 31)
        //            {
        //                var qsdfqsdfqsfd = "";
        //            }

        //            lastLine.lineNumber = i;
        //            Console.Write(i + "\r\n");
        //            lastLine.Type = xlRange.Cells[i, 1] != null ? xlRange.Cells[i, 1].Value2 : string.Empty;
        //            lastLine.TEMP_REFERENCE = xlRange.Cells[i, 2] != null ? xlRange.Cells[i, 2].Value2 : string.Empty;
        //            lastLine.SUPPLIER_NAME = xlRange.Cells[i, 3] != null ? xlRange.Cells[i, 3].Value2 : string.Empty;
        //            lastLine.SUPPLIER_ADDRESS = xlRange.Cells[i, 4] != null ? xlRange.Cells[i, 4].Value2 : string.Empty;
        //            lastLine.CONTACT_SUPPLIER = xlRange.Cells[i, 5] != null ? xlRange.Cells[i, 5].Value2 : string.Empty;
        //            lastLine.SUPPLIER_REFERENCE = xlRange.Cells[i, 6] != null ? xlRange.Cells[i, 6].Value2 : string.Empty;
        //            lastLine.ECOLED_REFERENCE = xlRange.Cells[i, 7] != null ? xlRange.Cells[i, 7].Value2 : string.Empty;
        //            lastLine.ECOLED_NEW_REFERENCE = xlRange.Cells[i, 8] != null ? xlRange.Cells[i, 8].Value2 : string.Empty;
        //            lastLine.PRODUCT_NAME = xlRange.Cells[i, 9] != null ? xlRange.Cells[i, 9].Value2 : string.Empty;
        //            lastLine.PICTURE__Of_GOODS = xlRange.Cells[i, 10] != null ? xlRange.Cells[i, 10].Value2 : string.Empty;
        //            lastLine.DESCRIPTION_OF_GOODS = xlRange.Cells[i, 11] != null ? xlRange.Cells[i, 11].Value2 : string.Empty;
        //            lastLine.OUTSIDE_LENGHT = xlRange.Cells[i, 12] != null ? xlRange.Cells[i, 12].Value2 : string.Empty;
        //            lastLine.OUTSIDE_WIDTH = xlRange.Cells[i, 13] != null ? xlRange.Cells[i, 13].Value2 : string.Empty;
        //            lastLine.OUTSIDE_HEIGHT = xlRange.Cells[i, 14] != null ? xlRange.Cells[i, 14].Value2 : string.Empty;
        //            lastLine.OUTSIDE_DIAMETER_ = xlRange.Cells[i, 15] != null ? xlRange.Cells[i, 15].Value2 : string.Empty;
        //            lastLine.OUTSIDE_THICKNESS = xlRange.Cells[i, 16] != null ? xlRange.Cells[i, 16].Value2 : string.Empty;
        //            lastLine.LENGTH_IN_mm = xlRange.Cells[i, 17] != null ? xlRange.Cells[i, 17].Value2 : string.Empty;
        //            lastLine.WIDTH_IN_mm = xlRange.Cells[i, 18] != null ? xlRange.Cells[i, 18].Value2 : string.Empty;
        //            lastLine.HEIGHT_IN_mm = xlRange.Cells[i, 19] != null ? xlRange.Cells[i, 19].Value2 : string.Empty;
        //            lastLine.DIAMETER_TOTAL = xlRange.Cells[i, 20] != null ? xlRange.Cells[i, 20].Value2 : string.Empty;
        //            lastLine.HOLE_SIZE_LENGTH = xlRange.Cells[i, 21] != null ? xlRange.Cells[i, 21].Value2 : string.Empty;
        //            lastLine.HOLE_SIZE_WIDTH = xlRange.Cells[i, 22] != null ? xlRange.Cells[i, 22].Value2 : string.Empty;
        //            lastLine.DEPTH_IN_ = xlRange.Cells[i, 23] != null ? xlRange.Cells[i, 23].Value2 : string.Empty;
        //            lastLine.HOLE_SIZE_IN_ = xlRange.Cells[i, 24] != null ? xlRange.Cells[i, 24].Value2 : string.Empty;
        //            lastLine.BASE = xlRange.Cells[i, 25] != null ? xlRange.Cells[i, 25].Value2 : string.Empty;
        //            lastLine.ELECTRICAL_CLASS = xlRange.Cells[i, 26] != null ? xlRange.Cells[i, 26].Value2 : string.Empty;
        //            lastLine.MATERIAL_TYPE = xlRange.Cells[i, 27] != null ? xlRange.Cells[i, 27].Value2 : string.Empty;
        //            lastLine.DIFUSER_TYPE = xlRange.Cells[i, 28] != null ? xlRange.Cells[i, 28].Value2 : string.Empty;
        //            lastLine.Color_2600K = xlRange.Cells[i, 29] != null ? xlRange.Cells[i, 29].Value2 : string.Empty;
        //            lastLine.Color_3000K = xlRange.Cells[i, 30] != null ? xlRange.Cells[i, 30].Value2 : string.Empty;
        //            lastLine.Color_4000K = xlRange.Cells[i, 31] != null ? xlRange.Cells[i, 31].Value2 : string.Empty;
        //            lastLine.Color_5700K = xlRange.Cells[i, 32] != null ? xlRange.Cells[i, 32].Value2 : string.Empty;
        //            lastLine.Color_6000K = xlRange.Cells[i, 33] != null ? xlRange.Cells[i, 33].Value2 : string.Empty;
        //            lastLine.Color_6700K = xlRange.Cells[i, 34] != null ? xlRange.Cells[i, 34].Value2 : string.Empty;
        //            lastLine.Color_RED = xlRange.Cells[i, 35] != null ? xlRange.Cells[i, 35].Value2 : string.Empty;
        //            lastLine.Color_GREEN = xlRange.Cells[i, 36] != null ? xlRange.Cells[i, 36].Value2 : string.Empty;
        //            lastLine.Color_BLUE = xlRange.Cells[i, 37] != null ? xlRange.Cells[i, 37].Value2 : string.Empty;
        //            lastLine.Color_WHITE = xlRange.Cells[i, 38] != null ? xlRange.Cells[i, 38].Value2 : string.Empty;
        //            lastLine.Color_RGB = xlRange.Cells[i, 39] != null ? xlRange.Cells[i, 39].Value2 : string.Empty;
        //            lastLine.Operation_NORMAL = xlRange.Cells[i, 40] != null ? xlRange.Cells[i, 40].Value2 : string.Empty;
        //            lastLine.Operation_DIMMABLE = xlRange.Cells[i, 41] != null ? xlRange.Cells[i, 41].Value2 : string.Empty;
        //            lastLine.Operation_DALI = xlRange.Cells[i, 42] != null ? xlRange.Cells[i, 42].Value2 : string.Empty;
        //            lastLine.IP = xlRange.Cells[i, 43] != null ? xlRange.Cells[i, 43].Value2 : string.Empty;
        //            lastLine.IK = xlRange.Cells[i, 44] != null ? xlRange.Cells[i, 44].Value2 : string.Empty;
        //            lastLine.BRAND_OF_LED = xlRange.Cells[i, 45] != null ? xlRange.Cells[i, 45].Value2 : string.Empty;
        //            lastLine.MODEL_OF_LED = xlRange.Cells[i, 46] != null ? xlRange.Cells[i, 46].Value2 : string.Empty;
        //            lastLine.DRIVER_BRAND = xlRange.Cells[i, 47] != null ? xlRange.Cells[i, 47].Value2 : string.Empty;
        //            lastLine.YIELD = xlRange.Cells[i, 48] != null ? xlRange.Cells[i, 48].Value2 : string.Empty;
        //            lastLine.WEIGHT_OF_PRODUCT = xlRange.Cells[i, 49] != null ? xlRange.Cells[i, 49].Value2 : string.Empty;
        //            lastLine.POWER_ATTS = xlRange.Cells[i, 50] != null ? xlRange.Cells[i, 50].Value2 : string.Empty;
        //            lastLine.METER_POWER = xlRange.Cells[i, 51] != null ? xlRange.Cells[i, 51].Value2 : string.Empty;
        //            lastLine.LED_BY_METER_STRIP_LED_or_LED_BAR = xlRange.Cells[i, 52] != null ? xlRange.Cells[i, 52].Value2 : string.Empty;
        //            lastLine.VOLTAGE = xlRange.Cells[i, 53] != null ? xlRange.Cells[i, 53].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_2600K = xlRange.Cells[i, 54] != null ? xlRange.Cells[i, 54].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_3000K = xlRange.Cells[i, 55] != null ? xlRange.Cells[i, 55].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_4000K = xlRange.Cells[i, 56] != null ? xlRange.Cells[i, 56].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_5700K = xlRange.Cells[i, 57] != null ? xlRange.Cells[i, 57].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_6000K = xlRange.Cells[i, 58] != null ? xlRange.Cells[i, 58].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_6500K = xlRange.Cells[i, 59] != null ? xlRange.Cells[i, 59].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_RED = xlRange.Cells[i, 60] != null ? xlRange.Cells[i, 60].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_GREEN = xlRange.Cells[i, 61] != null ? xlRange.Cells[i, 61].Value2 : string.Empty;
        //            lastLine.LUMINOUS_FLOW_BLEU = xlRange.Cells[i, 62] != null ? xlRange.Cells[i, 62].Value2 : string.Empty;
        //            lastLine.REFERENCE_WHITE = xlRange.Cells[i, 63] != null ? xlRange.Cells[i, 63].Value2 : string.Empty;
        //            lastLine.REFERENCE_RGB = xlRange.Cells[i, 64] != null ? xlRange.Cells[i, 64].Value2 : string.Empty;
        //            lastLine.PRODUCT_LIFETIME = xlRange.Cells[i, 65] != null ? xlRange.Cells[i, 65].Value2 : string.Empty;
        //            lastLine.UGR = xlRange.Cells[i, 66] != null ? xlRange.Cells[i, 66].Value2 : string.Empty;
        //            lastLine.ELLIPSE_MacAdam = xlRange.Cells[i, 67] != null ? xlRange.Cells[i, 67].Value2 : string.Empty;
        //            lastLine.GUARANTY = xlRange.Cells[i, 68] != null ? xlRange.Cells[i, 68].Value2 : string.Empty;
        //            lastLine.CARTON_SIZE_BY_UNIT = xlRange.Cells[i, 69] != null ? xlRange.Cells[i, 69].Value2 : string.Empty;
        //            lastLine.Unit_Carton_L = xlRange.Cells[i, 70] != null ? xlRange.Cells[i, 70].Value2 : string.Empty;
        //            lastLine.Unit_Carton_I = xlRange.Cells[i, 71] != null ? xlRange.Cells[i, 71].Value2 : string.Empty;
        //            lastLine.Unit_Carton_H = xlRange.Cells[i, 72] != null ? xlRange.Cells[i, 72].Value2 : string.Empty;
        //            lastLine.WEIGHT_BY_UNIT_KG = xlRange.Cells[i, 73] != null ? xlRange.Cells[i, 73].Value2 : string.Empty;
        //            lastLine.PACKAGING_PER_CARTONS_pcs = xlRange.Cells[i, 74] != null ? xlRange.Cells[i, 74].Value2 : string.Empty;
        //            lastLine.WEIGHT_PER_CARTONS_KG = xlRange.Cells[i, 75] != null ? xlRange.Cells[i, 75].Value2 : string.Empty;
        //            lastLine.Carton_L_mm = xlRange.Cells[i, 76] != null ? xlRange.Cells[i, 76].Value2 : string.Empty;
        //            lastLine.Carton_I_mm = xlRange.Cells[i, 77] != null ? xlRange.Cells[i, 77].Value2 : string.Empty;
        //            lastLine.Carton_H_mm = xlRange.Cells[i, 78] != null ? xlRange.Cells[i, 78].Value2 : string.Empty;
        //            lastLine.PRICE_FROM_SUPPLIER_1 = xlRange.Cells[i, 79] != null ? xlRange.Cells[i, 79].Value2 : string.Empty;
        //            lastLine.PRICE_FROM_SUPPLIER_100 = xlRange.Cells[i, 80] != null ? xlRange.Cells[i, 80].Value2 : string.Empty;
        //            lastLine.PRICE_FROM_SUPPLIER_500PCS = xlRange.Cells[i, 81] != null ? xlRange.Cells[i, 81].Value2 : string.Empty;
        //            lastLine.PUBLIC_PRICE_FROM_ECOLED = xlRange.Cells[i, 82] != null ? xlRange.Cells[i, 82].Value2 : string.Empty;
        //            lastLine.CoefPrice1_100 = xlRange.Cells[i, 83] != null ? xlRange.Cells[i, 83].Value2 : string.Empty;
        //            lastLine.CoefPrice100_500 = xlRange.Cells[i, 84] != null ? xlRange.Cells[i, 84].Value2 : string.Empty;
        //            lastLine.PtyId = xlRange.Cells[i, 85] != null ? xlRange.Cells[i, 85].Value2 : string.Empty;
        //            lastLine.SupId = xlRange.Cells[i, 86] != null ? xlRange.Cells[i, 86].Value2 : string.Empty;

        //            listTechSheetFields.Add(lastLine);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        LogWriter.Write(ex.Message + "\r\n" + excelPath);
        //    }


        //    //cleanup
        //    GC.Collect();
        //    GC.WaitForPendingFinalizers();

        //    //rule of thumb for releasing com objects:
        //    //  never use two dots, all COM objects must be referenced and released individually
        //    //  ex: [somthing].[something].[something] is bad

        //    //release com objects to fully kill excel process from running in the background
        //    Marshal.ReleaseComObject(xlRange);
        //    Marshal.ReleaseComObject(xlWorksheet);

        //    //close and release
        //    xlWorkbook.Close();
        //    Marshal.ReleaseComObject(xlWorkbook);

        //    //quit and release
        //    xlApp.Quit();
        //    Marshal.ReleaseComObject(xlApp);
        //    return listTechSheetFields;
        //}

        private List<Product> ReadProductFromExcle(string excelPath)
        {
            return null;
        }

        private void btn_encrypt_Click(object sender, EventArgs e)
        {
            var id = txb_id.Text;
            var key = txb_key.Text;
            try
            {
                var result = StringCipher.EncoderSimple(id, key);
                txb_result.Text = result;
            }
            catch (Exception)
            {
            }

        }

        private void btn_generate_code_Click(object sender, EventArgs e)
        {
            //GenerateCode();
            CleanCode();
        }

        private static void GenerateCode()
        {
            var path = @"E:\code for test.txt";
            var idlist = new List<string> { "prdId", "codId", "cplId", "cliId", "prjId" };
            using (System.IO.StreamWriter file =
                new System.IO.StreamWriter(path))
            {
                foreach (var oneId in idlist)
                {
                    for (int id = 1; id <= 100000; id++)
                    {
                        var code = StringCipher.EncoderSimple(id.ToString(), oneId);
                        file.WriteLine(id + "\t" + code);
                        Console.WriteLine(string.Format("{0}\t{1}", id, code));
                    }
                }
            }
        }

        private static void CleanCode()
        {
            var path = @"E:\code for test.txt";
            var tostorePath = @"E:\code for test clean.txt";

            var alllines = File.ReadAllLines(path).ToList();

            Regex rgx = new Regex("[a-zA-Z0-9 -]");
            using (System.IO.StreamWriter file =
                new System.IO.StreamWriter(tostorePath))
            {
                foreach (var oneline in alllines)
                {
                    var str = rgx.Replace(oneline, "");
                    if (str != ",")
                    {
                        file.WriteLine(str);
                        Console.WriteLine(str);

                    }
                }
            }
        }

        private void btn_login_pwd_Click(object sender, EventArgs e)
        {
            var login = txb_login.Text;
            var pwd = txb_pwd.Text;
            string line1 = string.Empty;
            string line2 = string.Empty;
            try
            {
                line1 = StringCipher.Encrypt(pwd, login);
            }
            catch (Exception)
            {

            }
            try
            {
                line2 = StringCipher.Decrypt(pwd, login);
            }
            catch (Exception)
            {
                line2 = "ERROR";
            }
            rtxb_result.Clear();
            rtxb_result.AppendText(line1);
            rtxb_result.AppendText("\r\n");
            rtxb_result.AppendText(line2);

        }

        #region New import 2017-11-21

        private void btn_choix_file_Click(object sender, EventArgs e)
        {
            // 2017-11-21
            OpenFileDialog selectFileDialog = new OpenFileDialog();
            Stream fileStream = null;
            //if ((selectFileDialog.ShowDialog() == DialogResult.OK) && (fileStream = selectFileDialog.OpenFile()) != null)
            if (selectFileDialog.ShowDialog() == DialogResult.OK)
            {
                string fileName = selectFileDialog.FileName;
                //var AllLines = ReadExcelWithExcelClass_2017_11_21(fileName);

                // 将行处理成product
                //int ptyId = 2; //ExaLed
                int ptyId = 1; //EvoLed
                //int ptyId = 3; //LumiLed
                //int ptyId = 4; //SunLed

                //GetProduct_20171122(AllLines, ptyId);

                // 2017-09-28 添加注释
                //foreach (var importExcelClass in AllLines)
                //{
                //    var prdPropValues = ProductServices.GetPtyProppertyValues(importExcelClass.PtyId.Obj2Int().Value, 1);
                //    TreateExcelFields.GetProductExcelWithExcelClass(prdPropValues, importExcelClass);
                //}

                // 2017-09-28 新功能
                //var propList = new Dictionary<int, List<PropertyValue>>();

                //var propEv = ProductServices.GetPtyProppertyValues(1, 1);
                //propList.Add(1, propEv);
                //var propEx = ProductServices.GetPtyProppertyValues(2, 1);
                //propList.Add(2, propEx);
                //var propLu = ProductServices.GetPtyProppertyValues(3, 1);
                //propList.Add(3, propLu);
                //var propSu = ProductServices.GetPtyProppertyValues(4, 1);
                //propList.Add(4, propSu);

                //foreach (var importExcelClass in AllLines)
                //{
                //    var prdPropValues = propList.FirstOrDefault(m => m.Key == importExcelClass.PtyId.Obj2Int().Value).Value;
                //    TreateExcelFields.GetProductExcelWithExcelClass_2017_09_28(prdPropValues, importExcelClass);
                //}
            }
        }

        private void GetProduct_20171122(List<ImportExcelClass> AllLines, int ptyId)
        {
            List<Product> products = new List<Product>();
            var propEx = ProductServices.GetPtyProppertyValues(ptyId, 1);

            var baseRefs = AllLines.Select(m => m.TEMP_REFERENCE.ToString().Substring(0, 5)).Distinct().ToList();
            foreach (var oneRef in baseRefs)
            {
                var samePrds = AllLines.Where(m => m.TEMP_REFERENCE.ToString().StartsWith(oneRef)).ToList();
                if (samePrds.Any())
                {
                    var basePrd = new Product();
                    basePrd.SocId = 1;

                    var defaultprd = samePrds.FirstOrDefault();
                    basePrd.PrdRef = oneRef;
                    basePrd.PtyId = ptyId;
                    basePrd.PrdLength = defaultprd.OUTSIDE_LENGHT.HasValue
                        ? Convert.ToDecimal(defaultprd.OUTSIDE_LENGHT.Value)
                        : (decimal?)null;
                    basePrd.PrdWidth = defaultprd.OUTSIDE_WIDTH.HasValue
                        ? Convert.ToDecimal(defaultprd.OUTSIDE_WIDTH.Value)
                        : (decimal?)null;
                    basePrd.PrdHeight = defaultprd.OUTSIDE_HEIGHT.HasValue
                        ? Convert.ToDecimal(defaultprd.OUTSIDE_HEIGHT.Value)
                        : (decimal?)null;
                    basePrd.PrdOutsideDiameter = defaultprd.OUTSIDE_DIAMETER_.HasValue
                        ? Convert.ToDecimal(defaultprd.OUTSIDE_DIAMETER_.Value)
                        : (decimal?)null;
                    basePrd.PrdHoleWidth = defaultprd.HOLE_SIZE_WIDTH.HasValue
                        ? Convert.ToDecimal(defaultprd.HOLE_SIZE_WIDTH.Value)
                        : (decimal?)null;
                    if (basePrd.PrdHoleWidth.HasValue)
                    {
                        basePrd.PrdHoleLength = defaultprd.HOLE_SIZE_LENGTH.HasValue
                            ? Convert.ToDecimal(defaultprd.HOLE_SIZE_LENGTH.Value)
                            : (decimal?)null;
                    }
                    else
                    {
                        basePrd.PrdHoleSize = defaultprd.HOLE_SIZE_LENGTH.HasValue
                            ? Convert.ToDecimal(defaultprd.HOLE_SIZE_LENGTH.Value)
                            : (decimal?)null;
                    }

                    basePrd.PrdName = defaultprd.PRODUCT_NAME.ToString();
                    basePrd.SupId = defaultprd.SupId.HasValue ? Convert.ToInt32(defaultprd.SupId.Value) : (int?)null;
                    basePrd.PrdSubName = defaultprd.PRODUCT_SUB_NAME;
                    //var aBaseRef = defaultprd.TEMP_REFERENCE.ToString().Substring(0, 5);

                    var propBase = ObjectCopier.DeepCopy(propEx);

                    #region Same Value

                    var propGeneral = propBase.Where(m => m.PropIsSameValue).ToList();

                    var electrivalClass = propGeneral.FirstOrDefault(m => m.PropName == "Electrical Class");
                    if (electrivalClass != null)
                    {
                        electrivalClass.PropValue = defaultprd.ELECTRICAL_CLASS.Obj2String();
                    }

                    var Materail = propGeneral.FirstOrDefault(m => m.PropName == "Matériaux");
                    if (Materail != null)
                    {
                        Materail.PropValue = defaultprd.MATERIAL_TYPE.Obj2String();
                    }
                    var difuser = propGeneral.FirstOrDefault(m => m.PropName == "Diffuseur");
                    if (difuser != null)
                    {
                        difuser.PropValue = defaultprd.DIFUSER_TYPE.Obj2String();
                    }

                    var ProtectionIP = propGeneral.FirstOrDefault(m => m.PropName == "Protection IP");
                    if (ProtectionIP != null)
                    {
                        ProtectionIP.PropValue = defaultprd.IP.Obj2String();
                    }

                    var ProtectionIK = propGeneral.FirstOrDefault(m => m.PropName == "Protection IK");
                    if (ProtectionIK != null)
                    {
                        var ik = defaultprd.IK.Obj2String();
                        if (string.IsNullOrEmpty(ik))
                        {
                            ik = "N";
                        }
                        else if (ik == "10" || ik == "0")
                        {
                            ik = "A";
                        }
                        ProtectionIK.PropValue = ik;
                    }

                    var LED = propGeneral.FirstOrDefault(m => m.PropName == "LED");
                    if (LED != null)
                    {
                        LED.PropValue = defaultprd.BRAND_OF_LED.Obj2String();
                    }

                    var Lampe = propGeneral.FirstOrDefault(m => m.PropName == "Lampe");
                    if (Lampe != null)
                    {
                        Lampe.PropValue = defaultprd.MODEL_OF_LED.Obj2String();
                    }

                    var Transformateur = propGeneral.FirstOrDefault(m => m.PropName == "Transformateur");
                    if (Transformateur != null)
                    {
                        Transformateur.PropValue = defaultprd.DRIVER_BRAND.Obj2String();
                    }

                    var Puissance = propGeneral.FirstOrDefault(m => m.PropName == "Puissance");
                    if (Puissance != null)
                    {
                        Puissance.PropValue = defaultprd.POWER_ATTS.Obj2Int().Obj2String();
                    }
                    var Tension = propGeneral.FirstOrDefault(m => m.PropName == "Tension");
                    if (Tension != null)
                    {
                        Tension.PropValue = defaultprd.VOLTAGE.Obj2String();
                    }

                    var dureedevie = propGeneral.FirstOrDefault(m => m.PropName == "Durée de vie");
                    if (dureedevie != null)
                    {
                        dureedevie.PropValue = defaultprd.PRODUCT_LIFETIME.Obj2Int().Obj2String();
                    }

                    var UGR = propGeneral.FirstOrDefault(m => m.PropName == "UGR");
                    if (UGR != null)
                    {
                        UGR.PropValue = defaultprd.UGR.Obj2String();
                    }

                    var IRC = propGeneral.FirstOrDefault(m => m.PropName == "Indice de rendu");
                    if (IRC != null)
                    {
                        IRC.PropValue = defaultprd.IRC.Obj2String();
                    }

                    var Garantie = propGeneral.FirstOrDefault(m => m.PropName == "Garantie");
                    if (Garantie != null)
                    {
                        Garantie.PropValue = defaultprd.GUARANTY.Obj2Int().Obj2String();
                    }

                    var useTemp = propGeneral.FirstOrDefault(m => m.PropName == "Température d'utilisation");
                    if (useTemp != null)
                    {
                        useTemp.PropValue = "-40+50";
                    }

                    basePrd.PrdGeneralInfoList = propGeneral;

                    #endregion Same Value

                    basePrd.InstanceList = new List<ProductInstance>();
                    foreach (var onePrd in samePrds)
                    {
                        //var tempColor = Convert.ToInt32(onePrd.TEMP_REFERENCE.ToString().Substring(5, 2)) * 100;
                        //var onePitBase = new ProductInstance();
                        //var onePitN = new ProductInstance();
                        //var onePitD = new ProductInstance();
                        //var onePitL = new ProductInstance();

                        #region Pit Value

                        var prdInstanceFiedls2Treat = propBase.Where(m => !m.PropIsSameValue).ToList();
                        var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                        var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                        if (flux != null)
                        {
                            flux.PropValue = onePrd.LUMINOUS_FLOW_2600K.Obj2Int().Obj2String();
                        }

                        var IP = propBase.FirstOrDefault(m => m.PropName == "Protection IP");
                        string ip = IP != null ? IP.PropValue : "00";
                        var IK = propBase.FirstOrDefault(m => m.PropName == "Protection IK");
                        string ik = IK != null ? IK.PropValue : "N";
                        var listPits = GetOneInstance(onePrd, pitInfo, ip, ik);
                        basePrd.InstanceList.AddRange(listPits);

                        #endregion Pit Value
                    }
                    products.Add(basePrd);
                }
            }

            SupplierProductServices SupplierProductServices = new SupplierProductServices();
            foreach (var product in products)
            {


                var prdId = ProductServices.CreateUpdateProductForImport(product);

                #region supplier product

                if (product.SupId.HasValue && product.SupId > 0)
                {
                    int supId = product.SupId.Value;

                    SupplierProduct spr = new SupplierProduct
                    {
                        SocId = 1,
                        SupId = supId,
                        PrdId = prdId,
                        CurId = 3,
                        SprPrdRef = "",
                        SprPrice_1_100 = 0,
                        SprPrice_100_500 = 0,
                        SprPrice_500_plus = 0,
                        SprCoef100 = 0,
                        SprCoef500 = 0,

                    };
                    SupplierProductServices.CreateUpdateSupplierProduct(spr);
                }

                #endregion supplier product

            }
        }

        private List<ProductInstance> GetOneInstance(ImportExcelClass onePrd, List<PropertyValue> props, string ip,
            string ik)
        {
            var listPits = new List<ProductInstance>();

            string reference = string.Empty;
            if (!string.IsNullOrEmpty(onePrd.RefNormal))
            {
                reference = onePrd.TEMP_REFERENCE + "N" + ip + ik;
                var thisprop = ObjectCopier.DeepCopy(props);
                var temp = thisprop.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (temp != null)
                {
                    int temperaturecolor;
                    if (int.TryParse(onePrd.TEMP_REFERENCE.ToString().Substring(5, 2), out temperaturecolor))
                    {
                        temp.PropValue = (temperaturecolor * 100).ToString();
                    }
                    else
                    {
                        temp.PropValue = "RGB";
                    }
                }
                var operation = thisprop.FirstOrDefault(m => m.PropName == "Opération");
                if (operation != null)
                {
                    operation.PropValue = "NORMAL";
                }
                GetPitWithColor(onePrd, thisprop, reference, listPits);
            }
            if (!string.IsNullOrEmpty(onePrd.RefDim))
            {
                var thisprop = ObjectCopier.DeepCopy(props);
                reference = onePrd.TEMP_REFERENCE + "D" + ip + ik;
                var temp = thisprop.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (temp != null)
                {
                    //temp.PropValue = (Convert.ToInt32(onePrd.TEMP_REFERENCE.ToString().Substring(5, 2)) * 100).ToString();
                    int temperaturecolor;
                    if (int.TryParse(onePrd.TEMP_REFERENCE.ToString().Substring(5, 2), out temperaturecolor))
                    {
                        temp.PropValue = (temperaturecolor * 100).ToString();
                    }
                    else
                    {
                        temp.PropValue = "RGB";
                    }
                }
                var operation = thisprop.FirstOrDefault(m => m.PropName == "Opération");
                if (operation != null)
                {
                    operation.PropValue = "DIMMABLE";
                }
                GetPitWithColor(onePrd, thisprop, reference, listPits);
            }
            if (!string.IsNullOrEmpty(onePrd.RefDali))
            {
                var thisprop = ObjectCopier.DeepCopy(props);
                reference = onePrd.TEMP_REFERENCE + "L" + ip + ik;
                var temp = thisprop.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (temp != null)
                {
                    //temp.PropValue = (Convert.ToInt32(onePrd.TEMP_REFERENCE.ToString().Substring(5, 2)) * 100).ToString();
                    int temperaturecolor;
                    if (int.TryParse(onePrd.TEMP_REFERENCE.ToString().Substring(5, 2), out temperaturecolor))
                    {
                        temp.PropValue = (temperaturecolor * 100).ToString();
                    }
                    else
                    {
                        temp.PropValue = "RGB";
                    }
                }
                var operation = thisprop.FirstOrDefault(m => m.PropName == "Opération");
                if (operation != null)
                {
                    operation.PropValue = "DALI";
                }
                GetPitWithColor(onePrd, thisprop, reference, listPits);
            }
            return listPits;
        }

        private static void GetPitWithColor(ImportExcelClass onePrd, List<PropertyValue> thisprop, string reference,
            List<ProductInstance> listPits)
        {
            // black Product Instance
            if (onePrd.COLOR_BLACK == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "BLACK";
                }
                var oneRef = reference + "BK";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
            // white Product Instance
            if (onePrd.COLOR_WHITE == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "WHITE";
                }
                var oneRef = reference + "WH";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
            // Grey Product Instance
            if (onePrd.COLOR_GREY == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "GREY";
                }
                var oneRef = reference + "GY";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
            // DARK GREY Product Instance
            if (onePrd.COLOR_DARKGREY == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "DARK GREY";
                }
                var oneRef = reference + "DG";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
            // SILVER Product Instance
            if (onePrd.COLOR_SILVER == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "SILVER";
                }
                var oneRef = reference + "SL";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
            // YELLOW Product Instance
            if (onePrd.COLOR_YELLOW == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "YELLOW";
                }
                var oneRef = reference + "YL";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
            // GREEN Product Instance
            if (onePrd.COLOR_GREEN == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "GREEN";
                }
                var oneRef = reference + "GR";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
            // ORANGE Product Instance
            if (onePrd.COLOR_ORANGE == 1)
            {
                var colorPorp = ObjectCopier.DeepCopy(thisprop);
                var productcolor = colorPorp.FirstOrDefault(m => m.PropName == "Couleur de produit");
                if (productcolor != null)
                {
                    productcolor.PropValue = "ORANGE";
                }
                var oneRef = reference + "OR";
                var onePit = new ProductInstance();
                onePit.PitInventoryThreshold = 0;
                onePit.PitRef = oneRef;
                onePit.PitAllInfo = colorPorp;
                listPits.Add(onePit);
            }
        }

        //private List<ImportExcelClass> ReadExcelWithExcelClass_2017_11_21(string excelPath)
        //{
        //    Excel.Application xlApp = new Excel.Application();
        //    Excel.Workbook xlWorkbook = xlApp.Workbooks.Open(excelPath, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing); // if working with another excel
        //    Excel._Worksheet xlWorksheet = xlWorkbook.Sheets[1];
        //    Excel.Range xlRange = xlWorksheet.UsedRange;

        //    int rowCount = xlRange.Rows.Count;
        //    int colCount = xlRange.Columns.Count;


        //    /// todo: for test
        //    //rowCount = 355;

        //    Console.WriteLine("Treating file {0}", excelPath);
        //    //iterate over the rows and columns and print to the console as it appears in the file
        //    //excel is not zero based!!

        //    var listTechSheetFields = new List<ImportExcelClass>();

        //    // 直接从列入手做
        //    try
        //    {
        //        int startline = 4;
        //        // for test 
        //        //startline = 4;

        //        for (int i = startline; i <= rowCount; i++)
        //        {
        //            var lastLine = new ImportExcelClass();
        //            //var test = xlRange.Cells[i, 2];
        //            //if (test != null)
        //            //{
        //            //    var testqsdf = test.Value2;
        //            //}
        //            if (i == 31)
        //            {
        //                var qsdfqsdfqsfd = "";
        //            }

        //            lastLine.lineNumber = i;
        //            Console.WriteLine(i + "\r\n");
        //            lastLine.Type = 2;
        //            lastLine.PtyId = 2;
        //            lastLine.TEMP_REFERENCE = GetCellValue(xlRange, i, 2);

        //            lastLine.RefNormal = GetCellValue(xlRange, i, 3);
        //            lastLine.RefDim = GetCellValue(xlRange, i, 4);
        //            lastLine.RefDali = GetCellValue(xlRange, i, 5);

        //            lastLine.POWER_ATTS = GetCellValue(xlRange, i, 6);
        //            lastLine.LUMINOUS_FLOW_2600K = GetCellValue(xlRange, i, 7);
        //            //lastLine.LUMINOUS_FLOW_3000K = GetCellValue(xlRange, i, 7);
        //            //lastLine.LUMINOUS_FLOW_4000K = GetCellValue(xlRange, i, 7);
        //            //lastLine.LUMINOUS_FLOW_5700K = GetCellValue(xlRange, i, 7);
        //            //lastLine.LUMINOUS_FLOW_6000K = GetCellValue(xlRange, i, 7);
        //            //lastLine.LUMINOUS_FLOW_6500K = GetCellValue(xlRange, i, 7);
        //            lastLine.LUMINOUS_FLOW_RED = GetCellValue(xlRange, i, 7);
        //            lastLine.LUMINOUS_FLOW_GREEN = GetCellValue(xlRange, i, 7);
        //            lastLine.LUMINOUS_FLOW_BLEU = GetCellValue(xlRange, i, 7);
        //            lastLine.OUTSIDE_LENGHT = GetCellValue(xlRange, i, 8);
        //            lastLine.OUTSIDE_WIDTH = GetCellValue(xlRange, i, 9);
        //            lastLine.OUTSIDE_HEIGHT = GetCellValue(xlRange, i, 10);
        //            lastLine.OUTSIDE_DIAMETER_ = GetCellValue(xlRange, i, 11);
        //            lastLine.DIAMETER_TOTAL = GetCellValue(xlRange, i, 11);
        //            lastLine.HOLE_SIZE_LENGTH = GetCellValue(xlRange, i, 12);
        //            lastLine.HOLE_SIZE_WIDTH = GetCellValue(xlRange, i, 13);
        //            lastLine.PRODUCT_NAME = GetCellValue(xlRange, i, 14);
        //            lastLine.SupId = GetCellValue(xlRange, i, 16);
        //            lastLine.GUARANTY = GetCellValue(xlRange, i, 17);
        //            lastLine.ELECTRICAL_CLASS = GetCellValue(xlRange, i, 18);
        //            lastLine.IP = GetCellValue(xlRange, i, 19).ToString();
        //            lastLine.IK = GetCellValue(xlRange, i, 20).ToString();
        //            lastLine.PRODUCT_LIFETIME = GetCellValue(xlRange, i, 21);

        //            lastLine.VOLTAGE = GetCellValue(xlRange, i, 23);
        //            lastLine.UGR = GetCellValue(xlRange, i, 24);
        //            lastLine.IRC = GetCellValue(xlRange, i, 25);
        //            lastLine.BRAND_OF_LED = GetCellValue(xlRange, i, 26);
        //            lastLine.PRODUCT_SUB_NAME = GetCellValue(xlRange, i, 27);


        //            lastLine.COLOR_BLACK = GetCellValue(xlRange, i, 28);
        //            lastLine.COLOR_WHITE = GetCellValue(xlRange, i, 29);
        //            lastLine.COLOR_GREY = GetCellValue(xlRange, i, 30);
        //            lastLine.COLOR_DARKGREY = GetCellValue(xlRange, i, 31);
        //            lastLine.COLOR_SILVER = GetCellValue(xlRange, i, 32);
        //            lastLine.COLOR_YELLOW = GetCellValue(xlRange, i, 33);
        //            lastLine.COLOR_GREEN = GetCellValue(xlRange, i, 34);
        //            lastLine.COLOR_ORANGE = GetCellValue(xlRange, i, 35);



        //            //lastLine.SUPPLIER_NAME = xlRange.Cells[i, 3] != null ? xlRange.Cells[i, 3].Value2 : string.Empty;
        //            //lastLine.SUPPLIER_ADDRESS = xlRange.Cells[i, 4] != null ? xlRange.Cells[i, 4].Value2 : string.Empty;
        //            //lastLine.CONTACT_SUPPLIER = xlRange.Cells[i, 5] != null ? xlRange.Cells[i, 5].Value2 : string.Empty;
        //            //lastLine.SUPPLIER_REFERENCE = xlRange.Cells[i, 6] != null ? xlRange.Cells[i, 6].Value2 : string.Empty;
        //            //lastLine.ECOLED_REFERENCE = xlRange.Cells[i, 7] != null ? xlRange.Cells[i, 7].Value2 : string.Empty;
        //            //lastLine.ECOLED_NEW_REFERENCE = xlRange.Cells[i, 8] != null ? xlRange.Cells[i, 8].Value2 : string.Empty;
        //            //lastLine.PICTURE__Of_GOODS = xlRange.Cells[i, 10] != null ? xlRange.Cells[i, 10].Value2 : string.Empty;
        //            //lastLine.DESCRIPTION_OF_GOODS = xlRange.Cells[i, 11] != null ? xlRange.Cells[i, 11].Value2 : string.Empty;
        //            //lastLine.OUTSIDE_THICKNESS = xlRange.Cells[i, 16] != null ? xlRange.Cells[i, 16].Value2 : string.Empty;
        //            //lastLine.LENGTH_IN_mm = xlRange.Cells[i, 17] != null ? xlRange.Cells[i, 17].Value2 : string.Empty;
        //            //lastLine.WIDTH_IN_mm = xlRange.Cells[i, 18] != null ? xlRange.Cells[i, 18].Value2 : string.Empty;
        //            //lastLine.HEIGHT_IN_mm = xlRange.Cells[i, 19] != null ? xlRange.Cells[i, 19].Value2 : string.Empty;
        //            //lastLine.DEPTH_IN_ = xlRange.Cells[i, 23] != null ? xlRange.Cells[i, 23].Value2 : string.Empty;
        //            //lastLine.HOLE_SIZE_IN_ = xlRange.Cells[i, 24] != null ? xlRange.Cells[i, 24].Value2 : string.Empty;
        //            //lastLine.BASE = xlRange.Cells[i, 25] != null ? xlRange.Cells[i, 25].Value2 : string.Empty;
        //            //lastLine.MATERIAL_TYPE = xlRange.Cells[i, 27] != null ? xlRange.Cells[i, 27].Value2 : string.Empty;
        //            //lastLine.DIFUSER_TYPE = xlRange.Cells[i, 28] != null ? xlRange.Cells[i, 28].Value2 : string.Empty;
        //            //lastLine.Color_2600K = xlRange.Cells[i, 29] != null ? xlRange.Cells[i, 29].Value2 : string.Empty;
        //            //lastLine.Color_3000K = xlRange.Cells[i, 30] != null ? xlRange.Cells[i, 30].Value2 : string.Empty;
        //            //lastLine.Color_4000K = xlRange.Cells[i, 31] != null ? xlRange.Cells[i, 31].Value2 : string.Empty;
        //            //lastLine.Color_5700K = xlRange.Cells[i, 32] != null ? xlRange.Cells[i, 32].Value2 : string.Empty;
        //            //lastLine.Color_6000K = xlRange.Cells[i, 33] != null ? xlRange.Cells[i, 33].Value2 : string.Empty;
        //            //lastLine.Color_6700K = xlRange.Cells[i, 34] != null ? xlRange.Cells[i, 34].Value2 : string.Empty;

        //            //lastLine.Color_RED = xlRange.Cells[i, 35] != null ? xlRange.Cells[i, 35].Value2 : string.Empty;
        //            //lastLine.Color_GREEN = xlRange.Cells[i, 36] != null ? xlRange.Cells[i, 36].Value2 : string.Empty;
        //            //lastLine.Color_BLUE = xlRange.Cells[i, 37] != null ? xlRange.Cells[i, 37].Value2 : string.Empty;
        //            //lastLine.Color_WHITE = xlRange.Cells[i, 38] != null ? xlRange.Cells[i, 38].Value2 : string.Empty;
        //            //lastLine.Color_RGB = xlRange.Cells[i, 39] != null ? xlRange.Cells[i, 39].Value2 : string.Empty;

        //            //lastLine.Operation_NORMAL = xlRange.Cells[i, 40] != null ? xlRange.Cells[i, 40].Value2 : string.Empty;
        //            //lastLine.Operation_DIMMABLE = xlRange.Cells[i, 41] != null ? xlRange.Cells[i, 41].Value2 : string.Empty;
        //            //lastLine.Operation_DALI = xlRange.Cells[i, 42] != null ? xlRange.Cells[i, 42].Value2 : string.Empty;

        //            //lastLine.BRAND_OF_LED = xlRange.Cells[i, 45] != null ? xlRange.Cells[i, 45].Value2 : string.Empty;
        //            //lastLine.MODEL_OF_LED = xlRange.Cells[i, 46] != null ? xlRange.Cells[i, 46].Value2 : string.Empty;
        //            //lastLine.DRIVER_BRAND = xlRange.Cells[i, 47] != null ? xlRange.Cells[i, 47].Value2 : string.Empty;
        //            //lastLine.YIELD = xlRange.Cells[i, 48] != null ? xlRange.Cells[i, 48].Value2 : string.Empty;

        //            //lastLine.WEIGHT_OF_PRODUCT = xlRange.Cells[i, 49] != null ? xlRange.Cells[i, 49].Value2 : string.Empty;


        //            //lastLine.METER_POWER = xlRange.Cells[i, 51] != null ? xlRange.Cells[i, 51].Value2 : string.Empty;
        //            //lastLine.LED_BY_METER_STRIP_LED_or_LED_BAR = xlRange.Cells[i, 52] != null ? xlRange.Cells[i, 52].Value2 : string.Empty;

        //            //lastLine.REFERENCE_WHITE = xlRange.Cells[i, 63] != null ? xlRange.Cells[i, 63].Value2 : string.Empty;
        //            //lastLine.REFERENCE_RGB = xlRange.Cells[i, 64] != null ? xlRange.Cells[i, 64].Value2 : string.Empty;

        //            //lastLine.ELLIPSE_MacAdam = xlRange.Cells[i, 67] != null ? xlRange.Cells[i, 67].Value2 : string.Empty;
        //            //lastLine.GUARANTY = xlRange.Cells[i, 68] != null ? xlRange.Cells[i, 68].Value2 : string.Empty;
        //            //lastLine.CARTON_SIZE_BY_UNIT = xlRange.Cells[i, 69] != null ? xlRange.Cells[i, 69].Value2 : string.Empty;
        //            //lastLine.Unit_Carton_L = xlRange.Cells[i, 70] != null ? xlRange.Cells[i, 70].Value2 : string.Empty;
        //            //lastLine.Unit_Carton_I = xlRange.Cells[i, 71] != null ? xlRange.Cells[i, 71].Value2 : string.Empty;
        //            //lastLine.Unit_Carton_H = xlRange.Cells[i, 72] != null ? xlRange.Cells[i, 72].Value2 : string.Empty;
        //            //lastLine.WEIGHT_BY_UNIT_KG = xlRange.Cells[i, 73] != null ? xlRange.Cells[i, 73].Value2 : string.Empty;
        //            //lastLine.PACKAGING_PER_CARTONS_pcs = xlRange.Cells[i, 74] != null ? xlRange.Cells[i, 74].Value2 : string.Empty;
        //            //lastLine.WEIGHT_PER_CARTONS_KG = xlRange.Cells[i, 75] != null ? xlRange.Cells[i, 75].Value2 : string.Empty;
        //            //lastLine.Carton_L_mm = xlRange.Cells[i, 76] != null ? xlRange.Cells[i, 76].Value2 : string.Empty;
        //            //lastLine.Carton_I_mm = xlRange.Cells[i, 77] != null ? xlRange.Cells[i, 77].Value2 : string.Empty;
        //            //lastLine.Carton_H_mm = xlRange.Cells[i, 78] != null ? xlRange.Cells[i, 78].Value2 : string.Empty;
        //            //lastLine.PRICE_FROM_SUPPLIER_1 = xlRange.Cells[i, 79] != null ? xlRange.Cells[i, 79].Value2 : string.Empty;
        //            //lastLine.PRICE_FROM_SUPPLIER_100 = xlRange.Cells[i, 80] != null ? xlRange.Cells[i, 80].Value2 : string.Empty;
        //            //lastLine.PRICE_FROM_SUPPLIER_500PCS = xlRange.Cells[i, 81] != null ? xlRange.Cells[i, 81].Value2 : string.Empty;
        //            //lastLine.PUBLIC_PRICE_FROM_ECOLED = xlRange.Cells[i, 82] != null ? xlRange.Cells[i, 82].Value2 : string.Empty;
        //            //lastLine.CoefPrice1_100 = xlRange.Cells[i, 83] != null ? xlRange.Cells[i, 83].Value2 : string.Empty;
        //            //lastLine.CoefPrice100_500 = xlRange.Cells[i, 84] != null ? xlRange.Cells[i, 84].Value2 : string.Empty;

        //            listTechSheetFields.Add(lastLine);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        LogWriter.Write(ex.Message + "\r\n" + excelPath);
        //    }


        //    //cleanup
        //    GC.Collect();
        //    GC.WaitForPendingFinalizers();

        //    //rule of thumb for releasing com objects:
        //    //  never use two dots, all COM objects must be referenced and released individually
        //    //  ex: [somthing].[something].[something] is bad

        //    //release com objects to fully kill excel process from running in the background
        //    Marshal.ReleaseComObject(xlRange);
        //    Marshal.ReleaseComObject(xlWorksheet);

        //    //close and release
        //    xlWorkbook.Close();
        //    Marshal.ReleaseComObject(xlWorkbook);

        //    //quit and release
        //    xlApp.Quit();
        //    Marshal.ReleaseComObject(xlApp);
        //    return listTechSheetFields;
        //}

        //private dynamic GetCellValue(Excel.Range xlRange, int line, int index)
        //{
        //    if (xlRange.Cells[line, index] != null)
        //    {
        //        if (xlRange.Cells[line, index].Value2 != null && !string.IsNullOrEmpty(xlRange.Cells[line, index].Value2.ToString()))
        //        {
        //            return xlRange.Cells[line, index].Value2;
        //        }
        //        else
        //        {
        //            return null;
        //        }
        //    }
        //    else
        //    {
        //        return null;
        //    }
        //    //return xlRange.Cells[line, index] != null ?
        //    //    (!string.IsNullOrEmpty(xlRange.Cells[line, index].Value2.ToString()) ? xlRange.Cells[line, index].Value2 : string.Empty)
        //    //    : string.Empty;
        //}

        #endregion New import 2017-11-21

        #region 2018-01-08 Update Supplier and Price

        private void btn_update_sup_price_Click(object sender, EventArgs e)
        {
            OpenFileDialog selectFileDialog = new OpenFileDialog();
            Stream fileStream = null;
            //if ((selectFileDialog.ShowDialog() == DialogResult.OK) && (fileStream = selectFileDialog.OpenFile()) != null)
            if (selectFileDialog.ShowDialog() == DialogResult.OK)
            {
                string fileName = selectFileDialog.FileName;
                //var AllLines = ReadExcelWithExcelClass_2018_01_08(fileName);


                //TreateSupplierAndPrice_20180108(AllLines);

            }
        }


        //private List<ImportExcelClass> ReadExcelWithExcelClass_2018_01_08(string excelPath)
        //{
        //    Excel.Application xlApp = new Excel.Application();
        //    Excel.Workbook xlWorkbook = xlApp.Workbooks.Open(excelPath, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing); // if working with another excel
        //    Excel._Worksheet xlWorksheet = xlWorkbook.Sheets[1];
        //    Excel.Range xlRange = xlWorksheet.UsedRange;

        //    int rowCount = xlRange.Rows.Count;
        //    int colCount = xlRange.Columns.Count;


        //    /// todo: for test
        //    //rowCount = 355;

        //    Console.WriteLine("Treating file {0}", excelPath);
        //    //iterate over the rows and columns and print to the console as it appears in the file
        //    //excel is not zero based!!

        //    var listTechSheetFields = new List<ImportExcelClass>();

        //    // 直接从列入手做
        //    try
        //    {
        //        int startline = 3;
        //        // for test 
        //        //startline = 4;

        //        for (int i = startline; i <= rowCount; i++)
        //        {
        //            var lastLine = new ImportExcelClass();
        //            //var test = xlRange.Cells[i, 2];
        //            //if (test != null)
        //            //{
        //            //    var testqsdf = test.Value2;
        //            //}
        //            if (i == 31)
        //            {
        //                var qsdfqsdfqsfd = "";
        //            }

        //            lastLine.lineNumber = i;
        //            Console.WriteLine(i + "\r\n");
        //            lastLine.Type = 2;
        //            lastLine.PtyId = 2;
        //            lastLine.TEMP_REFERENCE = GetCellValue(xlRange, i, 1);

        //            lastLine.RefNormal = GetCellValue(xlRange, i, 2);
        //            lastLine.RefDim = GetCellValue(xlRange, i, 3);
        //            lastLine.RefDali = GetCellValue(xlRange, i, 4);
        //            lastLine.SupId = GetCellValue(xlRange, i, 7);
        //            lastLine.PRICE_FROM_SUPPLIER_1 = GetCellValue(xlRange, i, 9);
        //            lastLine.PRICE_FROM_SUPPLIER_100 = GetCellValue(xlRange, i, 10);
        //            lastLine.PRICE_FROM_SUPPLIER_500PCS = GetCellValue(xlRange, i, 11);

        //            listTechSheetFields.Add(lastLine);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        LogWriter.Write(ex.Message + "\r\n" + excelPath);
        //    }


        //    //cleanup
        //    GC.Collect();
        //    GC.WaitForPendingFinalizers();

        //    //rule of thumb for releasing com objects:
        //    //  never use two dots, all COM objects must be referenced and released individually
        //    //  ex: [somthing].[something].[something] is bad

        //    //release com objects to fully kill excel process from running in the background
        //    Marshal.ReleaseComObject(xlRange);
        //    Marshal.ReleaseComObject(xlWorksheet);

        //    //close and release
        //    xlWorkbook.Close();
        //    Marshal.ReleaseComObject(xlWorkbook);

        //    //quit and release
        //    xlApp.Quit();
        //    Marshal.ReleaseComObject(xlApp);
        //    return listTechSheetFields;
        //}

        private void TreateSupplierAndPrice_20180108(List<ImportExcelClass> lines)
        {
            List<KeyValue> SupPrdPrice = new List<KeyValue>();
            foreach (var oneline in lines)
            {
                var baseRef = oneline.TEMP_REFERENCE.ToString();
                var pits = ProductServices.GetPitByRef(baseRef);
                var pitsDim = pits.Where(m => m.PitRef.Contains(baseRef + "D")).ToList();
                var pitsDali = pits.Where(m => m.PitRef.Contains(baseRef + "L")).ToList();
                var pitsNormal = pits.Where(m => m.PitRef.Contains(baseRef + "N")).ToList();
                if (pitsNormal.Any() && pitsNormal.FirstOrDefault() != null)
                {
                    var pitNormal = pitsNormal.FirstOrDefault();
                    var oneSupPrdPrice = new KeyValue
                    {
                        Key = pitNormal.PrdId,
                        Key2 = (int)oneline.SupId.Value,
                        DcValue =
                            oneline.PRICE_FROM_SUPPLIER_1.HasValue ? (decimal)oneline.PRICE_FROM_SUPPLIER_1.Value : 0,
                        DcValue2 =
                            pitsDim.Any()
                                ? (oneline.PRICE_FROM_SUPPLIER_100.HasValue
                                    ? (decimal)oneline.PRICE_FROM_SUPPLIER_100.Value
                                    : 0)
                                : 0,
                        DcValue3 =
                            pitsDali.Any()
                                ? (oneline.PRICE_FROM_SUPPLIER_500PCS.HasValue
                                    ? (decimal)oneline.PRICE_FROM_SUPPLIER_500PCS.Value
                                    : 0)
                                : 0,
                    };
                    if (!SupPrdPrice.Any(m => m.Key == oneSupPrdPrice.Key)
                        &&
                        !(oneSupPrdPrice.DcValue == 0 && oneSupPrdPrice.DcValue2 == 0 && oneSupPrdPrice.DcValue3 == 0))
                    {
                        SupPrdPrice.Add(oneSupPrdPrice);
                    }
                }
            }

            foreach (var pitWithPrice in SupPrdPrice)
            {
                ProductServices.UpdateSupplierProduct(pitWithPrice.Key, Convert.ToInt32(pitWithPrice.Key2), pitWithPrice.DcValue,
                    pitWithPrice.DcValue2, pitWithPrice.DcValue3);
            }
        }

        #endregion 2018-01-08 Update Supplier and Price

        private void btn_generate_photo_phrase_Click(object sender, EventArgs e)
        {
            var photoBasePath = @"D:\SiteFilesFolder\ERP\Files\UpLoadFiles\Product\Photo";

            var allDir = Directory.GetDirectories(photoBasePath);
            foreach (var oneDir in allDir)
            {
                DirectoryInfo d = new DirectoryInfo(oneDir);
                FileInfo[] Files = d.GetFiles(); //Getting Text files
                foreach (var fileInfo in Files)
                {
                    var prdid = d.Name;
                    var order = fileInfo.Name.Split('.')[0];
                    var realpath = fileInfo.FullName;

                    string phrase = string.Format("insert into TI_PIM_Product_Image valeus ({0},'{1}',{2},null,{2});",
                        prdid, realpath, order);
                    rtxb_photo_phrase.AppendText(phrase + "\r\n");
                    //rtxb_photo_phrase.AppendText(fileInfo.Name + "\r\n");
                }

            }
        }

        private void btn_test_connection_Click(object sender, EventArgs e)
        {
            var prd = ProductServices.LoadProductByRef("X", 1);
            if (prd != null)
            {
                txb_test_connection.Text = prd.PrdName;
            }
        }

        private void btn_create_cat_Click(object sender, EventArgs e)
        {
            var allprds = ProductServices.GetAllProducts(1);
            var ptys = ProductTypeServices.GetProductTypesBySocId(1, 0);

            var subCats = new List<string>
            {
                "AMPOULE",
                "AR 111",
                "BARRE LED",
                "DALLE",
                "DOWNLIGHT",
                "HIGH BAY",
                "LIGNE LUMINEUSE",
                "PARK ETANCHE",
                "PLAFONNIER",
                "PROJECTEUR",
                //"Projecteur",
                "REGLETTE",
                "SPOT",
                "TUBE",
                "TUBULED",
            };

            foreach (var onepty in ptys)
            {
                var prdsInPty = allprds.Where(m => m.PtyId == onepty.Key).ToList();

                if (prdsInPty.Any())
                {
                    // create category
                    var onecat = new Category
                    {
                        SocId = 1,
                        CatParentCatId = null,
                        CatIsActived = true,
                        CatName = onepty.Value,
                        CatOrder = onepty.Key,
                        CatDisplayInExhibition = true,
                        CatDisplayInMenu = true,
                        CatSubName1 = null,
                        CatSubName2 = null,
                    };
                    var catId = CategoryServices.CreateUpdateCategory(onecat);
                    foreach (var product in prdsInPty)
                    {
                        var onesubcatName =
                            subCats.FirstOrDefault(
                                m =>
                                    !string.IsNullOrEmpty(product.PrdSubName) &&
                                    product.PrdSubName.ToLower().StartsWith(m.ToLower()));

                        if (!string.IsNullOrEmpty(onesubcatName))
                        {
                            Category searchCategory = new Category
                            {
                                CatName = onesubcatName,
                                SocId = 1,
                            };
                            var cats = CategoryServices.SearchCategory(searchCategory);
                            var onecats =
                                cats.FirstOrDefault(
                                    m => m.CatParentCatId == catId && m.CatName == searchCategory.CatName);
                            int subCatId = 0;
                            if (onecats != null)
                            {
                                subCatId = onecats.CatId;
                            }
                            else
                            {
                                var subCat = new Category
                                {
                                    SocId = 1,
                                    CatParentCatId = catId,
                                    CatIsActived = true,
                                    CatName = onesubcatName,
                                    CatOrder = 1,
                                    CatDisplayInExhibition = true,
                                    CatDisplayInMenu = true,
                                    CatSubName1 = null,
                                    CatSubName2 = null,
                                };
                                subCatId = CategoryServices.CreateUpdateCategory(subCat);
                            }
                            CategoryServices.CreateUpdatePca(1, 0, product.PrdId, subCatId, null);
                        }
                        //Console.WriteLine(product.PrdId + "\t" + onesubcat);
                        //CategoryServices.CreateUpdatePca(1, 0, product.PrdId, catId, null);
                    }
                }
            }
        }

        #region For Ecoem 2018-01-12

        private void btn_ecoem_Click(object sender, EventArgs e)
        {
            return;
            OpenFileDialog selectFileDialog = new OpenFileDialog();
            Stream fileStream = null;
            //if ((selectFileDialog.ShowDialog() == DialogResult.OK) && (fileStream = selectFileDialog.OpenFile()) != null)
            if (selectFileDialog.ShowDialog() == DialogResult.OK)
            {
                string fileName = selectFileDialog.FileName;
                var AllLines = ReadExcelWithExcelClass_2018_01_12_TXT((fileName));


                TreateSupplierAndPrice_20180112(AllLines);

            }
        }

        private List<ImportExcelClass> ReadExcelWithExcelClass_2018_01_12_TXT(string filePath)
        {
            List<string> allLines = File.ReadAllLines(filePath).ToList();

            int rowCount = allLines.Count();
            //int colCount = xlRange.Columns.Count;


            /// todo: for test
            //rowCount = 355;

            Console.WriteLine("Treating file {0}", filePath);
            //iterate over the rows and columns and print to the console as it appears in the file
            //excel is not zero based!!

            var listTechSheetFields = new List<ImportExcelClass>();

            // 直接从列入手做
            try
            {
                int startline = 1;
                // for test 
                //startline = 4;

                for (int i = startline; i < rowCount; i++)
                {
                    var lastLine = new ImportExcelClass();
                    if (i == 31)
                    {
                        var qsdfqsdfqsfd = "";
                    }

                    lastLine.lineNumber = i;
                    Console.WriteLine(i + "\r\n");
                    string oneline = allLines.ElementAt(i);
                    var linecontent = oneline.Split('\t').ToList();
                    lastLine.Type = 2;
                    lastLine.PtyId = 4;
                    lastLine.TEMP_REFERENCE = linecontent.ElementAt(0);

                    lastLine.RefNormal = linecontent.ElementAt(1);
                    lastLine.PRODUCT_NAME = linecontent.ElementAt(2);
                    lastLine.DESCRIPTION_OF_GOODS = linecontent.ElementAt(2);
                    double price;
                    Double.TryParse(linecontent.ElementAt(3), out price);
                    lastLine.PRICE_FROM_SUPPLIER_1 = price;
                    double supId;
                    Double.TryParse(linecontent.ElementAt(4), out supId);
                    lastLine.SupId = supId;
                    double saleprice;
                    double.TryParse(linecontent.ElementAt(5), out saleprice);
                    lastLine.PUBLIC_PRICE_FROM_ECOLED = saleprice;

                    listTechSheetFields.Add(lastLine);
                }
            }
            catch (Exception ex)
            {
                LogWriter.Write(ex.Message + "\r\n" + filePath);
            }


            return listTechSheetFields;
        }

        //private List<ImportExcelClass> ReadExcelWithExcelClass_2018_01_12(string excelPath)
        //{
        //    Excel.Application xlApp = new Excel.Application();
        //    Excel.Workbook xlWorkbook = xlApp.Workbooks.Open(excelPath, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing, Type.Missing); // if working with another excel
        //    Excel._Worksheet xlWorksheet = xlWorkbook.Sheets[1];
        //    Excel.Range xlRange = xlWorksheet.UsedRange;

        //    int rowCount = xlRange.Rows.Count;
        //    int colCount = xlRange.Columns.Count;


        //    /// todo: for test
        //    //rowCount = 355;

        //    Console.WriteLine("Treating file {0}", excelPath);
        //    //iterate over the rows and columns and print to the console as it appears in the file
        //    //excel is not zero based!!

        //    var listTechSheetFields = new List<ImportExcelClass>();

        //    // 直接从列入手做
        //    try
        //    {
        //        int startline = 2;
        //        // for test 
        //        //startline = 4;

        //        for (int i = startline; i <= rowCount; i++)
        //        {
        //            var lastLine = new ImportExcelClass();
        //            if (i == 31)
        //            {
        //                var qsdfqsdfqsfd = "";
        //            }

        //            lastLine.lineNumber = i;
        //            Console.WriteLine(i + "\r\n");
        //            lastLine.Type = 2;
        //            lastLine.PtyId = 4;
        //            lastLine.TEMP_REFERENCE = GetCellValue(xlRange, i, 1);

        //            lastLine.RefNormal = GetCellValue(xlRange, i, 2);
        //            lastLine.DESCRIPTION_OF_GOODS = GetCellValue(xlRange, i, 3);
        //            lastLine.PRICE_FROM_SUPPLIER_1 = GetCellValue(xlRange, i, 4);
        //            lastLine.SupId = GetCellValue(xlRange, i, 5);

        //            listTechSheetFields.Add(lastLine);
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        LogWriter.Write(ex.Message + "\r\n" + excelPath);
        //    }


        //    //cleanup
        //    GC.Collect();
        //    GC.WaitForPendingFinalizers();

        //    //rule of thumb for releasing com objects:
        //    //  never use two dots, all COM objects must be referenced and released individually
        //    //  ex: [somthing].[something].[something] is bad

        //    //release com objects to fully kill excel process from running in the background
        //    Marshal.ReleaseComObject(xlRange);
        //    Marshal.ReleaseComObject(xlWorksheet);

        //    //close and release
        //    xlWorkbook.Close();
        //    Marshal.ReleaseComObject(xlWorkbook);

        //    //quit and release
        //    xlApp.Quit();
        //    Marshal.ReleaseComObject(xlApp);
        //    return listTechSheetFields;
        //}

        private void TreateSupplierAndPrice_20180112(List<ImportExcelClass> lines)
        {
            List<Product> products = new List<Product>();
            int ptyId = 4;
            var propEx = ProductServices.GetPtyProppertyValues(ptyId, 1);

            //var baseRefs = AllLines.Select(m => m.TEMP_REFERENCE.ToString().Substring(0, 5)).Distinct().ToList();
            foreach (var oneRef in lines)
            {
                var basePrd = new Product();
                basePrd.SocId = 1;

                var defaultprd = oneRef;
                basePrd.PrdRef = oneRef.TEMP_REFERENCE.ToString() + oneRef.RefNormal.ToString();
                basePrd.PrdPurchasePrice = oneRef.PRICE_FROM_SUPPLIER_1.HasValue
                    ? Convert.ToDecimal(oneRef.PRICE_FROM_SUPPLIER_1.Value)
                    : 0;
                //basePrd.PrdPurchasePrice = (basePrd.PrdRef.StartsWith("GOL") || basePrd.PrdRef.StartsWith("SEA") ||
                //                            basePrd.PrdRef.StartsWith("FAR"))
                //    ? (basePrd.PrdPurchasePrice * (decimal)(0.45))
                //    : ((basePrd.PrdRef.StartsWith("HAG") || basePrd.PrdRef.StartsWith("LEG") ||
                //        basePrd.PrdRef.StartsWith("SCH"))
                //        ? (basePrd.PrdPurchasePrice * (decimal)(0.32))
                //        : 0);
                basePrd.PrdPrice = oneRef.PUBLIC_PRICE_FROM_ECOLED.HasValue
                    ? Convert.ToDecimal(oneRef.PUBLIC_PRICE_FROM_ECOLED.Value)
                    : (decimal?)0;
                basePrd.PtyId = ptyId;
                basePrd.PrdLength = (decimal?)null;
                basePrd.PrdWidth = (decimal?)null;
                basePrd.PrdHeight = (decimal?)null;
                basePrd.PrdOutsideDiameter = (decimal?)null;
                basePrd.PrdHoleWidth = null;
                basePrd.PrdName = defaultprd.PRODUCT_NAME.ToString();
                basePrd.PrdName = basePrd.PrdName.Replace("�", "°");
                basePrd.SupId = defaultprd.SupId.HasValue ? Convert.ToInt32(defaultprd.SupId.Value) : (int?)null;
                basePrd.PrdSubName = oneRef.RefNormal;
                //var aBaseRef = defaultprd.TEMP_REFERENCE.ToString().Substring(0, 5);

                var propBase = ObjectCopier.DeepCopy(propEx);

                #region Same Value


                basePrd.PrdGeneralInfoList = propBase;

                #endregion Same Value

                basePrd.InstanceList = new List<ProductInstance>();

                #region Pit Value

                var prdInstanceFiedls2Treat = propBase.Where(m => !m.PropIsSameValue).ToList();

                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var listPits = new ProductInstance
                {
                    PitRef = string.Format("{0}{1}", oneRef.TEMP_REFERENCE, oneRef.RefNormal),
                    PitAllInfo = pitInfo,
                    PitPurchasePrice = basePrd.PrdPurchasePrice,
                    PitPrice = basePrd.PrdPrice,
                };

                basePrd.InstanceList.Add(listPits);

                #endregion Pit Value

                products.Add(basePrd);

            }

            SupplierProductServices SupplierProductServices = new SupplierProductServices();
            foreach (var product in products)
            {
                var prdId = ProductServices.CreateUpdateProductForImport(product);

                #region supplier product

                if (product.SupId.HasValue && product.SupId > 0)
                {
                    int supId = product.SupId.Value;

                    SupplierProduct spr = new SupplierProduct
                    {
                        SocId = 1,
                        SupId = supId,
                        PrdId = prdId,
                        CurId = 3,
                        SprPrdRef = product.PrdSubName,
                        SprPrice_1_100 = product.PrdPurchasePrice,
                        SprPrice_100_500 = 0,
                        SprPrice_500_plus = 0,
                        SprCoef100 = 0,
                        SprCoef500 = 0,

                    };
                    SupplierProductServices.CreateUpdateSupplierProduct(spr);

                }
                Console.WriteLine(prdId + "#" + product.PrdSubName);

                #endregion supplier product

            }
        }

        #endregion For Ecoem 2018-01-12


        #region For Ecoem 2018-01-15

        private void btn_ecoem_price_Click(object sender, EventArgs e)
        {
            OpenFileDialog selectFileDialog = new OpenFileDialog();
            Stream fileStream = null;
            //if ((selectFileDialog.ShowDialog() == DialogResult.OK) && (fileStream = selectFileDialog.OpenFile()) != null)
            if (selectFileDialog.ShowDialog() == DialogResult.OK)
            {
                string fileName = selectFileDialog.FileName;
                var AllLines = ReadExcelWithExcelClass_2018_01_15_TXT((fileName));

                ProductServices.UpdateProductPriceAndSupPrice(AllLines);

                //TreateSupplierAndPrice_20180112(AllLines);

            }
        }


        private List<KeyValue> ReadExcelWithExcelClass_2018_01_15_TXT(string filePath)
        {
            List<string> allLines = File.ReadAllLines(filePath).ToList();

            int rowCount = allLines.Count();
            //int colCount = xlRange.Columns.Count;


            /// todo: for test
            //rowCount = 355;

            Console.WriteLine("Treating file {0}", filePath);
            //iterate over the rows and columns and print to the console as it appears in the file
            //excel is not zero based!!

            var listTechSheetFields = new List<KeyValue>();

            // 直接从列入手做
            try
            {
                int startline = 0;
                // for test 
                //startline = 4;

                for (int i = startline; i < rowCount; i++)
                {
                    var lastLine = new KeyValue();
                    if (i == 31)
                    {
                        var qsdfqsdfqsfd = "";
                    }

                    //lastLine.lineNumber = i;
                    Console.WriteLine(i + "\r\n");
                    string oneline = allLines.ElementAt(i);
                    var linecontent = oneline.Split('\t').ToList();
                    // pit Id
                    int pitid;
                    if (int.TryParse(linecontent.ElementAt(2), out pitid))
                    {
                        lastLine.Key = Convert.ToInt32(pitid);
                        lastLine.Value = linecontent.ElementAt(0);
                        lastLine.DcValue = Convert.ToDecimal(linecontent.ElementAt(1));
                        lastLine.Key2 = Convert.ToInt32(linecontent.ElementAt(3));
                        listTechSheetFields.Add(lastLine);
                    }
                }
            }
            catch (Exception ex)
            {
                LogWriter.Write(ex.Message + "\r\n" + filePath);
            }


            return listTechSheetFields;
        }


        private void TreateSupplierAndPrice_20180115(List<KeyValue> lines)
        {
            List<Product> products = new List<Product>();
            int ptyId = 4;
            var propEx = ProductServices.GetPtyProppertyValues(ptyId, 1);
            // update price

        }

        #endregion For Ecoem 2018-01-15

        private void btn_ecoem_updatename_Click(object sender, EventArgs e)
        {

        }

        private void btn_rename_ies_Click(object sender, EventArgs e)
        {
            var folder = @"E:\WorkSpace\EcoLed\IES\IES20180213";
            var allfiles = Directory.GetFiles(folder);
            // rename
            //foreach (var oneFile in allfiles)
            //{
            //    if (!string.IsNullOrEmpty(oneFile))
            //    {
            //        var newname = oneFile.Split('-').FirstOrDefault().Replace(".ies", "").Replace(".IES", "").Trim();
            //        File.Move(oneFile, newname + ".IES");
            //    }
            //}

            // todo: no use rename 2
            //foreach (var oneFile in allfiles)
            //{
            //    if (!string.IsNullOrEmpty(oneFile))
            //    {
            //        var thisFile = new FileInfo(oneFile);
            //        var oldname = thisFile.Name;
            //        var newname = oldname.Substring(0, 8);
            //        var newPathWithName = thisFile.DirectoryName + "\\" + newname + ".IES";
            //        File.Move(oneFile, newPathWithName);
            //    }
            //}


            // rename 3
            //foreach (var oneFile in allfiles)
            //{
            //    if (!string.IsNullOrEmpty(oneFile))
            //    {
            //        var thisFile = new FileInfo(oneFile);
            //        var oldname = thisFile.Name;
            //        var newname = oldname.Substring(0, 5);
            //        var newPathWithName = thisFile.DirectoryName + "\\" + newname + ".IES";
            //        if (File.Exists(newPathWithName))
            //        {
            //            thisFile.Delete();
            //        }
            //        else
            //        {
            //            File.Move(oneFile, newPathWithName);
            //        }
            //    }
            //}

            //// todo: no use copy for dimmable and dali
            ////foreach (var oneFile in allfiles)
            ////{
            ////    if (!string.IsNullOrEmpty(oneFile))
            ////    {
            ////        var thisFile = new FileInfo(oneFile);
            ////        var oldname = thisFile.Name;
            ////        var newname = oldname.Substring(0, 7);
            ////        var newPathWithNameDimmable = thisFile.DirectoryName + "\\" + newname + "D.IES";
            ////        File.Copy(oneFile, newPathWithNameDimmable);
            ////        var newPathWithNameDali = thisFile.DirectoryName + "\\" + newname + "L.IES";
            ////        File.Copy(oneFile, newPathWithNameDali);
            ////    }
            ////}


            // delete dimmable and dali
            //foreach (var oneFile in allfiles)
            //{
            //    if (!string.IsNullOrEmpty(oneFile))
            //    {
            //        var thisFile = new FileInfo(oneFile);
            //        var oldname = thisFile.Name;
            //        if (oldname.EndsWith("L.IES") || oldname.EndsWith("D.IES"))
            //        {
            //            thisFile.Delete();
            //        }
            //    }
            //}
            var allpits = ProductServices.GetAllPits();

            List<ProductInstance> pit2Update = new List<ProductInstance>();
            foreach (var onefile in allfiles)
            {
                if (!string.IsNullOrEmpty(onefile))
                {
                    var thisFile = new FileInfo(onefile);
                    var filenameRef = thisFile.Name.Replace(thisFile.Extension, "");
                    var pitswithRef = allpits.Where(m => m.PitRef.StartsWith(filenameRef)).ToList();
                    var newPath = @"D:\SiteFilesFolder\ECOLEDERP\Files\UpLoadFiles\Product\File\";
                    foreach (var onePit in pitswithRef)
                    {
                        if (!onePit.PitRef.Contains("RG"))
                        {
                            var pitFilePath = string.Format(@"{0}\{1}\{2}", newPath, onePit.PrdId, onePit.PitId);
                            if (!Directory.Exists(pitFilePath))
                            {
                                Directory.CreateDirectory(pitFilePath);
                            }
                            var pitIesPath = string.Format(@"{0}\{1}.IES", pitFilePath, onePit.PitRef);

                            // copy file 
                            File.Copy(onefile, pitIesPath);
                            // update all info product instance
                            var iesProp = onePit.PitAllInfo.FirstOrDefault(m => m.PropName == "IES");
                            if (iesProp != null)
                            {
                                iesProp.PropValue = pitIesPath;
                            }
                            // add to list to update all info product instance
                            pit2Update.Add(onePit);
                        }
                    }
                }
            }

            if (pit2Update.Any())
            {
                ProductServices.UpdateProdutInstanceProps(pit2Update);
            }
        }

        private void btn_launch_order_Click(object sender, EventArgs e)
        {
            FmNewOrder fmnewOrder = new FmNewOrder();
            fmnewOrder.Show();
        }

        private void btn_imp_cins_Click(object sender, EventArgs e)
        {
            var allcinsstr = rtxb_cins.Text;

            //var allcinstr = allcinsstr.Split(new[] { Environment.NewLine }, StringSplitOptions.None).ToList();
            var allcinstr = allcinsstr.Split('\n').ToList();

            //var allcincode = allcinstr.Select(m => m[2]).ToList().Distinct();

            var cinlist = new List<ClientInvoice>();

            foreach (var onecin in allcinstr)
            {
                var cininfo = onecin.Split('\t').ToList();
                var cin = new ClientInvoice();
                if (!string.IsNullOrEmpty(cininfo[0]))
                {
                    cin.ClientCompanyName = cininfo[0];
                    var datec = DateTime.Parse(cininfo[1]);
                    cin.CinCode = cininfo[2].Trim();

                    if (!string.IsNullOrEmpty(cin.CinCode))
                    {
                        cin.CinDCreation = datec;
                        cin.CinDInvoice = datec;
                        cin.CinDUpdate = datec;
                        // 还要更新date echeance 和 term
                        cin.CinCode = cininfo[2];
                        var oneline = new ClientInvoiceLine();
                        oneline.PrdName = cininfo[3];
                        oneline.PitName = cininfo[4];
                        oneline.CiiPrdDes = cininfo[5];
                        oneline.CiiDescription = cininfo[6];
                        oneline.CiiQuantity = Convert.ToInt32(!string.IsNullOrEmpty(cininfo[7].Replace("-", "").Trim()) ? cininfo[7].Replace("-", "").Trim() : "0");
                        oneline.VatRate = Convert.ToDecimal(!string.IsNullOrEmpty(cininfo[8].Replace("-", "").Trim()) ? cininfo[8].Replace("-", "").Trim() : "0");
                        oneline.CiiUnitPrice = Convert.ToDecimal(!string.IsNullOrEmpty(cininfo[9].Replace("-", "").Trim()) ? cininfo[9].Replace("-", "").Trim() : "0");
                        oneline.CiiPriceWithDiscountHt = oneline.CiiUnitPrice;
                        oneline.CiiTotalPrice = Convert.ToDecimal(!string.IsNullOrEmpty(cininfo[10].Replace("-", "").Trim()) ? cininfo[10].Replace("-", "").Trim() : "0");
                        oneline.CiiTotalCrudePrice = Convert.ToDecimal(!string.IsNullOrEmpty(cininfo[11].Replace("-", "").Trim()) ? cininfo[11].Replace("-", "").Trim() : "0");
                        cin.ClientInvoiceLines = new List<ClientInvoiceLine>();
                        cin.ClientInvoiceLines.Add(oneline);
                        cinlist.Add(cin);
                    }
                }
            }

            var cincodes = cinlist.Select(l => l.CinCode).Distinct().ToList();


            var newcinlist = new List<ClientInvoice>();
            foreach (var cincode in cincodes)
            {
                var cinsthisCode = cinlist.Where(l => l.CinCode == cincode).ToList();
                if (cinsthisCode.Any())
                {
                    var genCin = new ClientInvoice();
                    var fsCin = cinsthisCode.FirstOrDefault();
                    genCin.ClientCompanyName = fsCin.ClientCompanyName;
                    genCin.CinCode = fsCin.CinCode;
                    genCin.CinDCreation = fsCin.CinDCreation;
                    genCin.CinDInvoice = fsCin.CinDInvoice;
                    genCin.CinDUpdate = fsCin.CinDUpdate;
                    genCin.ClientInvoiceLines = new List<ClientInvoiceLine>();
                    foreach (var onecinwithLine in cinsthisCode)
                    {
                        if (onecinwithLine.ClientInvoiceLines.Any())
                        {
                            var cii = onecinwithLine.ClientInvoiceLines.FirstOrDefault();
                            var oneline = new ClientInvoiceLine();
                            oneline.PrdName = cii.PrdName;
                            oneline.PitName = cii.PitName;
                            oneline.CiiPrdDes = cii.CiiPrdDes;
                            oneline.CiiDescription = cii.CiiDescription;
                            oneline.CiiQuantity = cii.CiiQuantity;
                            oneline.VatRate = cii.VatRate;
                            oneline.CiiUnitPrice = cii.CiiUnitPrice;
                            oneline.CiiPriceWithDiscountHt = cii.CiiPriceWithDiscountHt;
                            oneline.CiiTotalPrice = cii.CiiTotalPrice;
                            oneline.CiiTotalCrudePrice = cii.CiiTotalCrudePrice;
                            genCin.ClientInvoiceLines.Add(oneline);
                        }
                    }
                    newcinlist.Add(genCin);
                }
            }
            ClientInvoiceServices.InsertCinWithCii(newcinlist);
        }

        private void btn_imp_bl_Click(object sender, EventArgs e)
        {
            var allcinsstr = rtxb_cins.Text;

            //var allcinstr = allcinsstr.Split(new[] { Environment.NewLine }, StringSplitOptions.None).ToList();
            var allblstr = allcinsstr.Split('\n').ToList();

            //var allcincode = allcinstr.Select(m => m[2]).ToList().Distinct();

            var codlist = new List<ClientOrder>();

            foreach (var onecod in allblstr)
            {
                var codinfo = onecod.Split('\t').ToList();
                var cod = new ClientOrder();
                if (!string.IsNullOrEmpty(codinfo[0]))
                {
                    cod.ClientCompanyName = codinfo[0];
                    var datec = DateTime.Parse(codinfo[1]);
                    //这是BL code
                    cod.CodInterComment = codinfo[2].Trim();

                    if (!string.IsNullOrEmpty(cod.CodInterComment))
                    {
                        cod.CodDateCreation = datec;
                        cod.CodDateUpdate = datec;
                        cod.CodFooterText = codinfo[12];
                        //cod.CinDUpdate = datec;
                        // 还要更新date echeance 和 term
                        //cod.CinCode = codinfo[2];
                        var oneline = new ClientOrderLine();
                        oneline.PrdName = codinfo[4];
                        //oneline.PitName = codinfo[4];
                        //oneline.CiiPrdDes = codinfo[5];
                        oneline.ColDescription = codinfo[6];
                        oneline.ColQuantity = Convert.ToInt32(!string.IsNullOrEmpty(codinfo[7].Replace("-", "").Trim()) ? codinfo[7].Replace("-", "").Trim() : "0");
                        oneline.VatRate = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[8].Replace("-", "").Trim()) ? codinfo[8].Replace("-", "").Trim() : "0");
                        oneline.ColUnitPrice = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[9].Replace("-", "").Trim()) ? codinfo[9].Replace("-", "").Trim() : "0");
                        oneline.ColPriceWithDiscountHt = oneline.ColUnitPrice;
                        oneline.ColTotalPrice = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[10].Replace("-", "").Trim()) ? codinfo[10].Replace("-", "").Trim() : "0");
                        oneline.ColTotalCrudePrice = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[11].Replace("-", "").Trim()) ? codinfo[11].Replace("-", "").Trim() : "0");
                        cod.ClientOrderLines = new List<ClientOrderLine>();
                        cod.ClientOrderLines.Add(oneline);
                        codlist.Add(cod);
                    }
                }
            }

            var cincodes = codlist.Select(l => l.CodInterComment).Distinct().ToList();


            var newcodlist = new List<ClientOrder>();
            foreach (var dfocode in cincodes)
            {
                var cinsthisCode = codlist.Where(l => l.CodInterComment == dfocode).ToList();
                if (cinsthisCode.Any())
                {
                    var gencod = new ClientOrder();
                    var fsCod = cinsthisCode.FirstOrDefault();
                    gencod.SocId = 1;
                    gencod.ClientCompanyName = fsCod.ClientCompanyName;
                    gencod.CodInterComment = fsCod.CodInterComment;
                    gencod.CodDateCreation = fsCod.CodDateCreation;
                    gencod.CodFooterText = fsCod.CodFooterText;
                    gencod.CodDateUpdate = fsCod.CodDateUpdate;
                    gencod.UsrCreatorId = 1;
                    gencod.ClientOrderLines = new List<ClientOrderLine>();
                    foreach (var onecinwithLine in cinsthisCode)
                    {
                        if (onecinwithLine.ClientOrderLines.Any())
                        {
                            var cii = onecinwithLine.ClientOrderLines.FirstOrDefault();
                            var oneline = new ClientOrderLine();
                            oneline.PrdName = cii.PrdName;
                            //oneline.PitName = cii.PitName;
                            oneline.ColDescription = cii.ColDescription;
                            oneline.ColQuantity = cii.ColQuantity;
                            oneline.VatRate = cii.VatRate;
                            oneline.ColUnitPrice = cii.ColUnitPrice;
                            oneline.ColPriceWithDiscountHt = cii.ColPriceWithDiscountHt;
                            oneline.ColTotalPrice = cii.ColTotalPrice;
                            oneline.ColTotalCrudePrice = cii.ColTotalCrudePrice;
                            gencod.ClientOrderLines.Add(oneline);
                        }
                    }
                    newcodlist.Add(gencod);
                }
            }
            ClientOrderServices.InsertCodDfoCin(newcodlist);

        }

        private void btn_imp_bl_fa_av_Click(object sender, EventArgs e)
        {
            var all_bl_fa_av = rtxb_cins.Text;

            var allblstr = all_bl_fa_av.Split('\n').ToList();

            //var allcincode = allblstr.Select(m => m[2]).ToList().Distinct();

            var codlist = new List<ClientOrder>();

            foreach (var onecod in allblstr)
            {
                var codinfo = onecod.Split('\t').ToList();
                var cod = new ClientOrder();
                if (!string.IsNullOrEmpty(codinfo[0]))
                {
                    cod.ClientCompanyName = codinfo[0];
                    var datec = DateTime.Parse(codinfo[1]);
                    cod.SocId = 1;
                    //这是BL code
                    cod.CodInterComment = codinfo[2].Trim(); // fa av code 
                    cod.CodClientComment = codinfo[3].Trim(); // bl code

                    if (!string.IsNullOrEmpty(cod.CodInterComment))
                    {
                        cod.CodDateCreation = datec;
                        cod.CodDateUpdate = datec;
                        //cod.CodFooterText = codinfo[12];
                        //cod.CinDUpdate = datec;
                        // 还要更新date echeance 和 term
                        //cod.CinCode = codinfo[2];
                        var oneline = new ClientOrderLine();
                        oneline.PrdName = codinfo[5];
                        //oneline.PitName = codinfo[4];
                        //oneline.CiiPrdDes = codinfo[5];
                        oneline.ColDescription = codinfo[7];
                        oneline.ColQuantity = Convert.ToInt32(!string.IsNullOrEmpty(codinfo[8].Replace("-", "").Trim()) ? codinfo[8].Replace("-", "").Trim() : "0");
                        oneline.VatRate = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[9].Replace("-", "").Trim()) ? codinfo[9].Replace("-", "").Trim() : "0");
                        oneline.ColUnitPrice = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[10].Replace("-", "").Trim()) ? codinfo[10].Replace("-", "").Trim() : "0");
                        oneline.ColPriceWithDiscountHt = oneline.ColUnitPrice;
                        oneline.ColTotalPrice = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[11].Replace("-", "").Trim()) ? codinfo[11].Replace("-", "").Trim() : "0");
                        oneline.ColTotalCrudePrice = Convert.ToDecimal(!string.IsNullOrEmpty(codinfo[12].Replace("-", "").Trim()) ? codinfo[12].Replace("-", "").Trim() : "0");
                        cod.ClientOrderLines = new List<ClientOrderLine>();
                        cod.ClientOrderLines.Add(oneline);
                        codlist.Add(cod);
                    }
                }
            }


            ClientOrderServices.InsertBLWithCIN(codlist);

        }
        private void button1_Click(object sender, EventArgs e)
        {
            OpenFileDialog selectFileDialog = new OpenFileDialog();
            Stream fileStream = null;
            string fileName = "";
            if (selectFileDialog.ShowDialog() == DialogResult.OK)
            {
                fileName = selectFileDialog.FileName;
            }
            //string filePath = @"G:\MyProject\ERP_LEADER\数据.xlsx";
            DataTable dt = new DataTable();
            using (FileStream file = new FileStream(fileName, FileMode.Open, FileAccess.Read))
            {
                dt = RenderDataTableFromExcel2007(file);
            }

            foreach (DataRow dr in dt.Rows)
            {
                ProductServices.CreateProduct(dr);
            }
        }


        public static DataTable RenderDataTableFromExcel2007(Stream excelFileStream)
        {
            DataTable table = new DataTable();
            try
            {
                using (excelFileStream)
                {
                    IWorkbook workbook = new XSSFWorkbook(excelFileStream);

                    ISheet sheet = workbook.GetSheetAt(0);//取第一个表 

                    IRow headerRow = sheet.GetRow(0);//第一行为标题行 
                    int cellCount = headerRow.LastCellNum;//LastCellNum = PhysicalNumberOfCells 
                    int rowCount = sheet.LastRowNum;//LastRowNum = PhysicalNumberOfRows - 1 

                    //handling header. 
                    for (int i = headerRow.FirstCellNum; i < cellCount; i++)
                    {
                        string columnname = headerRow.GetCell(i).StringCellValue;
                        if (columnname == "")
                            continue;
                        DataColumn column = new DataColumn(columnname);
                        table.Columns.Add(column);
                    }

                    for (int i = (sheet.FirstRowNum + 1); i <= rowCount; i++)
                    {
                        IRow row = sheet.GetRow(i);
                        if (row.FirstCellNum < 0)
                        {
                            continue;
                        }
                        else if (row.GetCell(row.FirstCellNum).ToString().Trim() == "")
                        {
                            continue;
                        }

                        DataRow dataRow = table.NewRow();

                        if (row != null)
                        {
                            for (int j = row.FirstCellNum; j < cellCount; j++)
                            {
                                if (row.GetCell(j) != null)
                                {
                                    switch (row.GetCell(j).CellType)
                                    { //空数据类型处理
                                        case CellType.Blank:
                                            dataRow[j] = "";
                                            break;
                                        case CellType.String:
                                            dataRow[j] = row.GetCell(j).StringCellValue;
                                            break;
                                        case CellType.Numeric: //数字类型  
                                            if (HSSFDateUtil.IsCellDateFormatted(row.GetCell(j)))
                                            {
                                                dataRow[j] = row.GetCell(j).DateCellValue;
                                            }
                                            else
                                            {
                                                dataRow[j] = row.GetCell(j).NumericCellValue;
                                            }
                                            break;
                                        case CellType.Formula:
                                            dataRow[j] = row.GetCell(j).NumericCellValue;
                                            break;
                                        default:
                                            dataRow[j] = "";
                                            break;
                                    }
                                }
                            }
                        }

                        table.Rows.Add(dataRow);
                    }
                    workbook = null;
                    sheet = null;
                    return table;

                }
            }
            catch (Exception ex)
            {
                string message = ex.Message;
                return null;
            }
        }



        public static DataTable RenderDataTableFromExcel2022(Stream excelFileStream)
        {
            DataTable table = new DataTable();
            try
            {
                using (excelFileStream)
                {
                    IWorkbook workbook = new XSSFWorkbook(excelFileStream);

                    ISheet sheet = workbook.GetSheetAt(0);//取第一个表 

                    IRow headerRow = sheet.GetRow(0);//第一行为标题行 
                    int cellCount = headerRow.LastCellNum;//LastCellNum = PhysicalNumberOfCells 
                    int rowCount = sheet.LastRowNum;//LastRowNum = PhysicalNumberOfRows - 1 

                    //handling header. 
                    for (int i = headerRow.FirstCellNum; i < cellCount; i++)
                    {
                        string columnname = headerRow.GetCell(i).StringCellValue;
                        if (columnname == "")
                            continue;
                        DataColumn column = new DataColumn(columnname);
                        table.Columns.Add(column);
                    }

                    for (int i = (sheet.FirstRowNum + 1); i <= rowCount; i++)
                    {
                        IRow row = sheet.GetRow(i);
                        if (row.FirstCellNum < 0)
                        {
                            continue;
                        }
                        else if (row.GetCell(row.FirstCellNum).ToString().Trim() == "")
                        {
                            continue;
                        }

                        DataRow dataRow = table.NewRow();

                        if (row != null)
                        {
                            for (int j = row.FirstCellNum; j < cellCount; j++)
                            {
                                if (row.GetCell(j) != null)
                                {
                                    row.GetCell(j).SetCellType(CellType.String);
                                    // dataRow[j] = row.GetCell(j).StringCellValue;
                                    switch (row.GetCell(j).CellType)
                                    {
                                        //空数据类型处理
                                        case CellType.Blank:
                                            dataRow[j] = "";
                                            break;
                                        case CellType.String:
                                            dataRow[j] = row.GetCell(j).StringCellValue;
                                            break;
                                        case CellType.Numeric: //数字类型  
                                            if (HSSFDateUtil.IsCellDateFormatted(row.GetCell(j)))
                                            {
                                                dataRow[j] = row.GetCell(j).DateCellValue;
                                            }
                                            else
                                            {
                                                dataRow[j] = row.GetCell(j).NumericCellValue;
                                            }
                                            break;
                                        case CellType.Formula:
                                            dataRow[j] = row.GetCell(j).NumericCellValue;
                                            break;
                                        default:
                                            dataRow[j] = "";
                                            break;
                                    }
                                }
                            }
                        }


                        table.Rows.Add(dataRow);
                    }
                    workbook = null;
                    sheet = null;
                    return table;

                }
            }
            catch (Exception ex)
            {
                string message = ex.Message;
                return null;
            }
        }

        /// <summary>
        /// 202204 导入新产品， 谭
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        private void button2_Click(object sender, EventArgs e)
        {
            OpenFileDialog selectFileDialog = new OpenFileDialog();
            Stream fileStream = null;
            string fileName = "";
            if (selectFileDialog.ShowDialog() == DialogResult.OK)
            {
                fileName = selectFileDialog.FileName;
            }
            //string filePath = @"G:\MyProject\ERP_LEADER\数据.xlsx";
            DataTable dt = new DataTable();
            using (FileStream file = new FileStream(fileName, FileMode.Open, FileAccess.Read))
            {
                dt = RenderDataTableFromExcel2022(file);
            }
            var res = new List<FileInfo>();
            var basePath = @"F:\Image\";
            ForeachFile(basePath, ref res);

            //分行处理
            foreach (DataRow dr in dt.Rows)
            {
                ProductServices.ImportProduct(dr, res);
            }
        }

        /// <summary>
        /// 遍历指定文件夹中的文件包括子文件夹的文件
        /// </summary>
        /// <param name="filePathByForeach">等待遍历的目录(绝对路径)</param>
        /// <param name="result">遍历之后的结果</param>
        /// <returns></returns>
        public static void ForeachFile(string filePathByForeach, ref List<FileInfo> result)
        {
            DirectoryInfo theFolder = new DirectoryInfo(filePathByForeach);
            DirectoryInfo[] dirInfo = theFolder.GetDirectories();//获取所在目录的文件夹
            FileInfo[] file = theFolder.GetFiles();//获取所在目录的文件

            foreach (FileInfo fileItem in file) //遍历文件
            {
                //result += "dirName:" + fileItem.DirectoryName + "    fileName:" + fileItem.Name + "\n";
                result.Add(fileItem);
            }
            //遍历文件夹
            foreach (DirectoryInfo NextFolder in dirInfo)
            {
                ForeachFile(NextFolder.FullName, ref result);
            }
        }



    }
}
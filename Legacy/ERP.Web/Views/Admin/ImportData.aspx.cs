using System;
using System.Collections.Generic;
using System.Data.Common.CommandTrees;
using System.Data.Objects.DataClasses;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ERP.DataServices;
using ERP.Entities;
using ERP.Repositories.Extensions;
using ERP.Web.Shared;
//using Excel = Microsoft.Office.Interop.Excel;
using System.Web.Configuration;
using System.Xml;

//Microsoft Excel 14 object in references-> COM tab

namespace ERP.Web.Views.Admin
{
    public partial class ImportData : BasePage.BasePage
    {
        public ProductServices ProductServices = new ProductServices();
        public ClientServices ClientServices = new ClientServices();
        public ContactClientServices ContactClientServices = new ContactClientServices();
        public SupplierProductServices SupplierProductServices = new SupplierProductServices();
        public DeliveryFormServices DeliveryFormServices = new DeliveryFormServices();
        protected void Page_Load(object sender, EventArgs e)
        {
            if (CurrentUser.RolId != 1)
            {
                ClientScript.RegisterStartupScript(Page.GetType(), "OnLoad", "RightErrorRedirect();", true);
            }
        }

        protected void btn_treate_supplier_product_OnClick(object sender, EventArgs e)
        {
            var content = txb_supplier_product.Text;
            if (!string.IsNullOrEmpty(content))
            {
                var AllLines = ReadFromText(content);

                foreach (var importExcelClass in AllLines)
                {
                    var prdPropValues = ProductServices.GetPtyProppertyValues(importExcelClass.PtyId.Obj2Int().Value, 1);
                    GetProductExcelWithExcelClass(prdPropValues, importExcelClass);
                }
            }



            //if (fup_supplier_product.HasFile)
            //{
            //    var FileName = fup_supplier_product.FileName;
            //    string _path = Server.MapPath("~");

            //    var extension = Path.GetExtension(FileName);
            //    var filename_short = FileName.Replace(extension, "");



            //    var appSettingPath = "UpLoadFilesTempFile";
            //    string tmpPath = WebConfigurationManager.AppSettings[appSettingPath];

            //    string prdPath = string.Format(@"{0}", tmpPath);
            //    if (!Directory.Exists(prdPath))
            //    {
            //        Directory.CreateDirectory(prdPath);
            //    }
            //    string savedFileName = FileControl.CheckAndGetNewPath(prdPath + "\\" + filename_short + Guid.NewGuid() + extension);
            //    fup_supplier_product.SaveAs(savedFileName);


            //    var AllLines = ReadExcelWithExcelClass(savedFileName);
            //    foreach (var importExcelClass in AllLines)
            //    {
            //        var prdPropValues = ProductServices.GetPtyProppertyValues(importExcelClass.PtyId.Obj2Int().Value, 1);
            //        GetProductExcelWithExcelClass(prdPropValues, importExcelClass);
            //    }
            //}
        }

        private List<ImportExcelClass> ReadFromText(string text)
        {
            var listTechSheetFields = new List<ImportExcelClass>();
            var alllines = text.Split(new string[] { "\r\n" }, StringSplitOptions.None).ToList();
            foreach (var oneLine in alllines)
            {
                var allFields = oneLine.Split('\t').ToList();
                if (allFields.Count > 70)
                {
                    var lastLine = new ImportExcelClass();
                    lastLine.PtyId = allFields.ElementAt(0).Obj2Double();
                    lastLine.SupId = allFields.ElementAt(1).Obj2Double();
                    lastLine.SUPPLIER_REFERENCE = allFields.ElementAt(5);
                    lastLine.ECOLED_REFERENCE = allFields.ElementAt(6);
                    lastLine.PICTURE__Of_GOODS = allFields.ElementAt(7);
                    lastLine.DESCRIPTION_OF_GOODS = allFields.ElementAt(8);
                    lastLine.OUTSIDE_DIAMETER_ = allFields.ElementAt(9).Obj2Double();
                    lastLine.LENGTH_IN_mm = allFields.ElementAt(10).Obj2Double();
                    lastLine.WIDTH_IN_mm = allFields.ElementAt(11).Obj2Double();
                    lastLine.HEIGHT_IN_mm = allFields.ElementAt(12).Obj2Double();
                    lastLine.DEPTH_IN_ = allFields.ElementAt(13).Obj2Double();
                    lastLine.HOLE_SIZE_IN_ = allFields.ElementAt(14).Obj2Double();
                    lastLine.BASE = allFields.ElementAt(15);
                    lastLine.ELECTRICAL_CLASS = allFields.ElementAt(16);
                    lastLine.MATERIAL_TYPE = allFields.ElementAt(17);
                    lastLine.DIFUSER_TYPE = allFields.ElementAt(18);
                    lastLine.Color_2600K = allFields.ElementAt(19).Obj2Double();
                    lastLine.Color_3000K = allFields.ElementAt(20).Obj2Double();
                    lastLine.Color_4000K = allFields.ElementAt(21).Obj2Double();
                    lastLine.Color_5700K = allFields.ElementAt(22).Obj2Double();
                    lastLine.Color_6000K = allFields.ElementAt(23).Obj2Double();
                    lastLine.Color_6700K = allFields.ElementAt(24).Obj2Double();
                    lastLine.Color_RED = allFields.ElementAt(25).Obj2Double();
                    lastLine.Color_GREEN = allFields.ElementAt(26).Obj2Double();
                    lastLine.Color_BLUE = allFields.ElementAt(27).Obj2Double();
                    lastLine.Color_WHITE = allFields.ElementAt(28).Obj2Double();
                    lastLine.Color_RGB = allFields.ElementAt(29).Obj2Double();
                    lastLine.Operation_NORMAL = allFields.ElementAt(30).Obj2Double();
                    lastLine.Operation_DIMMABLE = allFields.ElementAt(31).Obj2Double();
                    lastLine.Operation_DALI = allFields.ElementAt(32).Obj2Double();
                    lastLine.IP = allFields.ElementAt(33).Obj2String();
                    lastLine.IK = allFields.ElementAt(34).Obj2String();
                    lastLine.BRAND_OF_LED = allFields.ElementAt(35);
                    lastLine.MODEL_OF_LED = allFields.ElementAt(36);
                    lastLine.DRIVER_BRAND = allFields.ElementAt(37);
                    lastLine.YIELD = allFields.ElementAt(38).Obj2Double();
                    lastLine.WEIGHT_OF_PRODUCT = allFields.ElementAt(39).Obj2Double();
                    lastLine.POWER_ATTS = allFields.ElementAt(40).Obj2Double();
                    lastLine.METER_POWER = allFields.ElementAt(41);
                    lastLine.LED_BY_METER_STRIP_LED_or_LED_BAR = allFields.ElementAt(42);
                    lastLine.VOLTAGE = allFields.ElementAt(43);
                    lastLine.LUMINOUS_FLOW_2600K = allFields.ElementAt(44).Obj2Double();
                    lastLine.LUMINOUS_FLOW_3000K = allFields.ElementAt(45).Obj2Double();
                    lastLine.LUMINOUS_FLOW_4000K = allFields.ElementAt(46).Obj2Double();
                    lastLine.LUMINOUS_FLOW_5700K = allFields.ElementAt(47).Obj2Double();
                    lastLine.LUMINOUS_FLOW_6000K = allFields.ElementAt(48).Obj2Double();
                    lastLine.LUMINOUS_FLOW_6500K = allFields.ElementAt(49).Obj2Double();
                    lastLine.LUMINOUS_FLOW_RED = allFields.ElementAt(50).Obj2Double();
                    lastLine.LUMINOUS_FLOW_GREEN = allFields.ElementAt(51).Obj2Double();
                    lastLine.LUMINOUS_FLOW_BLEU = allFields.ElementAt(52).Obj2Double();
                    lastLine.REFERENCE_WHITE = allFields.ElementAt(53).Obj2Double();
                    lastLine.REFERENCE_RGB = allFields.ElementAt(54).Obj2Double();
                    lastLine.PRODUCT_LIFETIME = allFields.ElementAt(55).Obj2Double();
                    lastLine.UGR = allFields.ElementAt(56);
                    lastLine.ELLIPSE_MacAdam = allFields.ElementAt(57);
                    lastLine.GUARANTY = allFields.ElementAt(58).Obj2Double();
                    lastLine.CARTON_SIZE_BY_UNIT = allFields.ElementAt(59);
                    lastLine.Unit_Carton_L = allFields.ElementAt(60).Obj2Double();
                    lastLine.Unit_Carton_I = allFields.ElementAt(61).Obj2Double();
                    lastLine.Unit_Carton_H = allFields.ElementAt(62).Obj2Double();
                    lastLine.WEIGHT_BY_UNIT_KG = allFields.ElementAt(63).Obj2Double();
                    lastLine.PACKAGING_PER_CARTONS_pcs = allFields.ElementAt(64).Obj2Double();
                    lastLine.WEIGHT_PER_CARTONS_KG = allFields.ElementAt(65).Obj2Double();
                    lastLine.Carton_L_mm = allFields.ElementAt(69).Obj2Double();
                    lastLine.Carton_I_mm = allFields.ElementAt(70).Obj2Double();
                    lastLine.Carton_H_mm = allFields.ElementAt(71).Obj2Double();
                    lastLine.PRICE_FROM_SUPPLIER_1 = allFields.ElementAt(72).Obj2Double();
                    lastLine.PRICE_FROM_SUPPLIER_100 = allFields.ElementAt(73).Obj2Double();
                    lastLine.PRICE_FROM_SUPPLIER_500PCS = allFields.ElementAt(74).Obj2Double();
                    listTechSheetFields.Add(lastLine);
                }
            }
            return listTechSheetFields;
        }
        private List<Entities.ContactClient> ReadClientFromText(string text)
        {
            var listclient = new List<Entities.ContactClient>();
            var alllines = text.Split(new string[] { "\r\n" }, StringSplitOptions.None).ToList();
            foreach (var oneLine in alllines)
            {
                var allFields = oneLine.Split('\t').ToList();
                if (allFields.Count > 3)
                {
                    var cco = new ContactClient();
                    cco.CcoFirstname = !string.IsNullOrEmpty(allFields.ElementAt(1)) && allFields.ElementAt(1).Contains(" ") ? allFields.ElementAt(1).Split(' ')[0] : string.Empty;
                    cco.CcoLastname = !string.IsNullOrEmpty(allFields.ElementAt(1)) && allFields.ElementAt(1).Contains(" ") ? allFields.ElementAt(1).Split(' ')[1] : string.Empty;
                    cco.CcoFax = allFields.ElementAt(2);
                    cco.CcoTel1 = allFields.ElementAt(3);
                    cco.CcoComment = allFields.ElementAt(0);
                    listclient.Add(cco);
                }
            }
            return listclient;
        }
        public Entities.Product GetProductFromExcelKeyValue(List<KeyValue> prdKeyValues, List<PropertyValue> prdPropertyValues, int ptyId)
        {
            int socId = 1;
            int prdId = 0;
            var refs = prdKeyValues.Where(m => m.KeyStr1.StartsWith("Référence")).ToList();
            var onePrd = new Entities.Product();
            onePrd.PtyId = ptyId;
            onePrd.SocId = socId;
            int ficheTechCount = 0;
            foreach (var prdKeyValue in prdKeyValues)
            {
                if (prdKeyValue.KeyStr1 == "Fiche Technique")
                {
                    break;
                }
                ficheTechCount++;
            }
            onePrd.PrdName = prdKeyValues[ficheTechCount + 1].KeyStr1;
            onePrd.PrdRef = prdKeyValues[ficheTechCount + 1].KeyStr1.Split(' ')[0];
            onePrd.PrdFileName = prdKeyValues.FirstOrDefault().Value2;

            // 处理 general 内容
            var propGeneral = prdPropertyValues.Where(m => m.PropIsSameValue).ToList();
            foreach (var propV in propGeneral)
            {
                var name = propV.PropName;
                var excelProp = prdKeyValues.FirstOrDefault(m => m.KeyStr1.StartsWith(name));

                propV.PropValue = excelProp != null ? excelProp.Value : string.Empty;
                if (propV.PropValue.Contains("IRC"))
                {
                    propV.PropValue = propV.PropValue.Replace("IRC", "").Trim();
                }
                if (propV.PropType == "2" || propV.PropType == "3")
                {
                    var value = propV.PropValue;
                    value = value.Replace(".", ",").Replace(" ", "");
                    value = Regex.Replace(value, "[^0-9,]", "");
                    propV.PropValue = value;
                }
            }
            var prdGeneralFields = prdPropertyValues.Where(m => m.PropIsSameValue).ToList();
            //var speXml = ProductServices.GenerateXmlFieldForGeneralInfo(prdGeneralFields);
            onePrd.PrdGeneralInfoList = prdGeneralFields;

            // 添加 product instance
            var prdInstanceFiedls2Treat = prdPropertyValues.Where(m => !m.PropIsSameValue).ToList();

            List<ProductInstance> listPits = new List<ProductInstance>();
            foreach (var oneRef in refs)
            {
                var onePit = new ProductInstance();
                //onePit.PrdId = prdId;
                onePit.PtyId = ptyId;

                var temperature = oneRef.KeyStr1.Replace("Référence", "").Trim();
                var reference = oneRef.Value;
                var fluxLumineuxvalue = prdKeyValues.FirstOrDefault(m => m.KeyStr1 == "Flux lumineux" && m.Value.StartsWith(temperature));
                var fluxLumineux = string.Empty;
                if (fluxLumineuxvalue != null)
                {
                    fluxLumineux = fluxLumineuxvalue.Value.Replace(temperature, "");
                    fluxLumineux = Regex.Replace(fluxLumineux, "[^0-9,]", "");
                }

                var newProp2Treat = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);

                foreach (var propertyValue in newProp2Treat)
                {
                    if (propertyValue.PropType == "2" || propertyValue.PropType == "3")
                    {
                        var value = propertyValue.PropValue;
                        value = value.Replace(".", ",").Replace(" ", "");
                        value = Regex.Replace(value, "[^0-9,]", "");
                        propertyValue.PropValue = value;
                    }

                    if (propertyValue.PropName == "Référence")
                    {
                        propertyValue.PropValue = reference;
                    }
                    else if (propertyValue.PropName == "Température de couleur")
                    {

                        propertyValue.PropValue = temperature;
                    }
                    else if (propertyValue.PropName == "Flux lumineux")
                    {
                        propertyValue.PropValue = fluxLumineux;
                    }
                }
                onePit.PitAllInfo = newProp2Treat;
                listPits.Add(onePit);
            }
            onePrd.InstanceList = listPits;

            // 插入数据库
            prdId = ProductServices.CreateUpdateProduct(onePrd);

            return onePrd;
        }
        public Entities.Product GetProductExcelWithExcelClass(List<PropertyValue> prdPropertyValues, ImportExcelClass onePrd)
        {
            #region product instant count
            var pitColorCount = 0;
            if (onePrd.Color_2200K == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_2600K == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_3000K == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_4000K == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_5700K == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_6000K == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_6700K == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_RED == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_GREEN == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_BLUE == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_WHITE == 1)
            {
                pitColorCount++;
            }
            if (onePrd.Color_RGB == 1)
            {
                pitColorCount++;
            }

            var pitOperationCount = 0;
            if (onePrd.Operation_NORMAL == 1)
            {
                pitOperationCount++;
            }
            if (onePrd.Operation_DIMMABLE == 1)
            {
                pitOperationCount++;
            }
            if (onePrd.Operation_DALI == 1)
            {
                pitOperationCount++;
            }
            #endregion product instant count

            int ptyId = onePrd.PtyId.Obj2Int().Value;
            var newPrd = new Entities.Product();
            newPrd.PrdRef = onePrd.ECOLED_REFERENCE.Obj2String();
            newPrd.PrdName = string.Empty;
            newPrd.PrdDescription = onePrd.DESCRIPTION_OF_GOODS.Obj2String();
            newPrd.PrdOutsideDiameter = onePrd.OUTSIDE_DIAMETER_.Obj2Decimal();
            newPrd.PrdLength = onePrd.LENGTH_IN_mm.Obj2Decimal();
            newPrd.PrdWidth = onePrd.WIDTH_IN_mm.Obj2Decimal();
            newPrd.PrdHeight = onePrd.HEIGHT_IN_mm.Obj2Decimal();
            newPrd.PrdDepth = onePrd.DEPTH_IN_.Obj2Decimal();
            newPrd.PrdHoleSize = onePrd.HOLE_SIZE_IN_.Obj2Decimal();
            newPrd.PrdWeight = onePrd.WEIGHT_OF_PRODUCT.Obj2Decimal();
            newPrd.PrdUnitLength = onePrd.Unit_Carton_L.Obj2Decimal();
            newPrd.PrdUnitWeight = onePrd.Unit_Carton_I.Obj2Decimal();
            newPrd.PrdUnitHeight = onePrd.Unit_Carton_H.Obj2Decimal();
            newPrd.PrdUnitWeight = onePrd.WEIGHT_BY_UNIT_KG.Obj2Decimal();
            newPrd.PrdQuantityEachCarton = onePrd.PACKAGING_PER_CARTONS_pcs.Obj2Int();
            newPrd.PrdCartonWeight = onePrd.WEIGHT_PER_CARTONS_KG.Obj2Decimal();
            newPrd.PrdCartonLength = onePrd.Carton_L_mm.Obj2Decimal();
            newPrd.PrdCartonWeight = onePrd.Carton_I_mm.Obj2Decimal();
            newPrd.PrdCartonHeight = onePrd.Carton_H_mm.Obj2Decimal();
            newPrd.PrdPurchasePrice = onePrd.PRICE_FROM_SUPPLIER_1.Obj2Decimal();
            newPrd.PtyId = ptyId;
            newPrd.SocId = 1;
            //newPrd.PrdRef = onePrd.SUPPLIER_REFERENCE.Obj2String();


            // 处理 general 内容
            var propGeneral = prdPropertyValues.Where(m => m.PropIsSameValue).ToList();
            var electrivalClass = propGeneral.FirstOrDefault(m => m.PropName == "Electrical Class");
            if (electrivalClass != null)
            {
                electrivalClass.PropValue = onePrd.ELECTRICAL_CLASS.Obj2String();
            }
            var Materail = propGeneral.FirstOrDefault(m => m.PropName == "Matériaux");
            if (Materail != null)
            {
                Materail.PropValue = onePrd.MATERIAL_TYPE.Obj2String();
            }
            var difuser = propGeneral.FirstOrDefault(m => m.PropName == "Diffuseur");
            if (difuser != null)
            {
                difuser.PropValue = onePrd.DIFUSER_TYPE.Obj2String();
            }
            var Protection = propGeneral.FirstOrDefault(m => m.PropName == "Protection");
            if (Protection != null)
            {
                var ip = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IP.Obj2String()) ? "" : "IP", onePrd.IP.Obj2String());
                var ik = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IK.Obj2String()) ? "" : "IK", onePrd.IK.Obj2String());
                Protection.PropValue = ip + string.Format("{0}{1}", string.IsNullOrEmpty(ik) ? "" : "/", ik);
            }
            var LED = propGeneral.FirstOrDefault(m => m.PropName == "LED");
            if (LED != null)
            {
                LED.PropValue = onePrd.BRAND_OF_LED.Obj2String();
            }

            var Lampe = propGeneral.FirstOrDefault(m => m.PropName == "Lampe");
            if (Lampe != null)
            {
                Lampe.PropValue = onePrd.MODEL_OF_LED.Obj2String();
            }

            var Transformateur = propGeneral.FirstOrDefault(m => m.PropName == "Transformateur");
            if (Transformateur != null)
            {
                Transformateur.PropValue = onePrd.DRIVER_BRAND.Obj2String();
            }

            var Puissance = propGeneral.FirstOrDefault(m => m.PropName == "Puissance");
            if (Puissance != null)
            {
                Puissance.PropValue = onePrd.POWER_ATTS.Obj2Int().Obj2String();
            }
            var Tension = propGeneral.FirstOrDefault(m => m.PropName == "Tension");
            if (Tension != null)
            {
                Tension.PropValue = onePrd.VOLTAGE.Obj2String();
            }

            var dureedevie = propGeneral.FirstOrDefault(m => m.PropName == "Durée de vie");
            if (dureedevie != null)
            {
                dureedevie.PropValue = onePrd.PRODUCT_LIFETIME.Obj2Int().Obj2String();
            }

            var UGR = propGeneral.FirstOrDefault(m => m.PropName == "UGR");
            if (UGR != null)
            {
                UGR.PropValue = onePrd.UGR.Obj2String();
            }

            var Garantie = propGeneral.FirstOrDefault(m => m.PropName == "Garantie");
            if (Garantie != null)
            {
                Garantie.PropValue = onePrd.GUARANTY.Obj2Int().Obj2String();
            }

            var prdGeneralFields = prdPropertyValues.Where(m => m.PropIsSameValue).ToList();
            newPrd.PrdGeneralInfoList = prdGeneralFields;

            #region product instant

            // 添加 product instance
            var prdInstanceFiedls2Treat = prdPropertyValues.Where(m => !m.PropIsSameValue).ToList();
            List<ProductInstance> listPits = new List<ProductInstance>();
            var onePit = new ProductInstance();
            onePit.PitDescription = onePrd.DESCRIPTION_OF_GOODS.Obj2String();
            onePit.PitPurchasePrice = onePrd.PRICE_FROM_SUPPLIER_1.Obj2Decimal();

            #region color 2200
            if (onePrd.Color_2200K == 1)
            {
                var pit2200 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "2200";
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit2200);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "220" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit2200);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "220" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit2200);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "220" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color 2200

            #region color 2600
            if (onePrd.Color_2600K == 1)
            {
                var pit2600 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "2600";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_2600K.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit2600);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "260" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit2600);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "260" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit2600);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "260" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color 2200

            #region color 3000
            if (onePrd.Color_3000K == 1)
            {
                var pit3000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "3000";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_3000K.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit3000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "300" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit3000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "300" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit3000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "300" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color 3000

            #region color 4000
            if (onePrd.Color_4000K == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "4000";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_4000K.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "400" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "400" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "400" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color 4000

            #region color 5700
            if (onePrd.Color_5700K == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "5700";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_5700K.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "570" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "570" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "570" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color 5700

            #region color 6000
            if (onePrd.Color_6000K == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "6000";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_6000K.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "600" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "600" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "600" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color 6000

            #region color 6700
            if (onePrd.Color_6700K == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "6700";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_6500K.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "670" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "670" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "670" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color 6700

            #region color red
            if (onePrd.Color_RED == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "RED";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_RED.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "RED" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RED" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RED" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color red

            #region color green
            if (onePrd.Color_GREEN == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "GREEN";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_GREEN.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "GRN" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "GRN" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "GRN" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color green

            #region color bleu
            if (onePrd.Color_BLUE == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "BLEU";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.LUMINOUS_FLOW_BLEU.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "BLE" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "BLE" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "BLE" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color bleu

            #region color white
            if (onePrd.Color_WHITE == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "WHITE";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.REFERENCE_WHITE.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "WHI" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "WHI" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "WHI" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color white

            #region color rgb
            if (onePrd.Color_RGB == 1)
            {
                var pit4000 = ObjectCopier.DeepCopy(onePit);
                var pitInfo = ObjectCopier.DeepCopy(prdInstanceFiedls2Treat);
                var tempCol = pitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                if (tempCol != null)
                {
                    tempCol.PropValue = "RGB";
                }
                var flux = pitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                if (flux != null)
                {
                    flux.PropValue = onePrd.REFERENCE_RGB.Obj2Int().Obj2String();
                }
                if (onePrd.Operation_NORMAL.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "NORMAL";
                    }
                    var pit2200_normal = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_normal = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_normal.PitAllInfo = pitInfo_normal;
                    pit2200_normal.PitRef = newPrd.PrdRef + "RGB" + "N";
                    listPits.Add(pit2200_normal);
                }
                if (onePrd.Operation_DIMMABLE.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DIMMABLE";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RGB" + "D";
                    listPits.Add(pit2200_dimmable);
                }
                if (onePrd.Operation_DALI.Obj2Int() == 1)
                {
                    var operation = pitInfo.FirstOrDefault(m => m.PropName == "Opération");
                    if (operation != null)
                    {
                        operation.PropValue = "DALI";
                    }
                    var pit2200_dimmable = ObjectCopier.DeepCopy(pit4000);
                    var pitInfo_dimmable = ObjectCopier.DeepCopy(pitInfo);
                    pit2200_dimmable.PitAllInfo = pitInfo_dimmable;
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RGB" + "L";
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color rgb

            newPrd.InstanceList = listPits;

            #endregion product instant

            int prdId = 0;

            //todo: 插入数据库
            prdId = ProductServices.CreateUpdateProduct(newPrd);

            #region supplier product

            int supId = onePrd.SupId.Obj2Int().Value;
            SupplierProduct spr = new SupplierProduct
            {
                SocId = 1,
                SupId = supId,
                PrdId = prdId,
                CurId = 3,
                SprPrdRef = onePrd.SUPPLIER_REFERENCE.Obj2String(),
                SprPrice_1_100 = onePrd.PRICE_FROM_SUPPLIER_1.Obj2Decimal(),
                SprPrice_100_500 = onePrd.PRICE_FROM_SUPPLIER_100.Obj2Decimal(),
                SprPrice_500_plus = onePrd.PRICE_FROM_SUPPLIER_500PCS.Obj2Decimal(),
            };
            // todo: 插入数据库
            SupplierProductServices.CreateUpdateSupplierProduct(spr);


            #endregion supplier product


            // todo: create supplier product




            return null;
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

        protected void btn_treate_clients_OnClick(object sender, EventArgs e)
        {

            var content = txb_clients.Text;
            if (!string.IsNullOrEmpty(content))
            {
                var AllLines = ReadClientFromText(content);

                foreach (var onecco in AllLines)
                {
                    var client = new Entities.Client
                    {
                        CompanyName = onecco.CcoComment,
                        VatId = 1,
                        PcoId = 1,
                        PmoId = 1,
                        SocId = 1,
                        UsrCreatedBy = 1,
                        CtyId = 1,
                        CurId = 1,
                        Isactive = true,
                        Isblocked = false,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        RecieveNewsletter = false,
                        Tel1 = onecco.CcoTel1,
                        Fax = onecco.CcoFax
                    };
                    int cliId = ClientServices.CreateUpdateClient(client);
                    var cco = new Entities.ContactClient()
                    {
                        CliId = cliId,
                        CivId = 1,
                        CcoFirstname = !string.IsNullOrEmpty(onecco.CcoFirstname) ? onecco.CcoFirstname : "",
                        CcoLastname = !string.IsNullOrEmpty(onecco.CcoLastname) ? onecco.CcoLastname : "",
                        CcoRecieveNewsletter = false,
                        CcoIsDeliveryAdr = true,
                        CcoIsInvoicingAdr = true,
                        UsrCreatedBy = 1,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        CcoAdresseTitle = "Adresse Fac & Liv",
                        CcoTel1 = onecco.CcoTel1,
                        CcoFax = onecco.CcoFax
                    };
                    ContactClientServices.CreateUpdateContactClient(cco);
                }
            }
        }

        protected void btn_import_20231017_Suivi_Admin_OnClick(object sender, EventArgs e)
        {
            // 20251027 屏蔽这个按键·
            return;
            var suiviadminText = txb_suivi_admin.Text;
            var linenbs = ReadFromTextForSuiviAdmin(suiviadminText);
            //var produitsList = DeliveryFormServices.GetCeePrd();

            var dfowithlinenb = DeliveryFormServices.GetDfoFromGdoclineNb(linenbs);
            var text2display = string.Empty;

            var linenblist = linenbs.Distinct().ToList();

            foreach (var oneline in linenblist)
            {
                //foreach (var keyValue in dfowithlinenb)
                //{
                //    text2display += string.Format("{0}\t{1}\r\n", keyValue.Key, keyValue.Value);
                //}
                var forthisline = dfowithlinenb.Where(l => l.Key == oneline).ToList();
                text2display += oneline;
                foreach (var keyValue in forthisline)
                {
                    text2display += string.Format("\t{0}", keyValue.Value);
                }
                text2display += "\r\n";
            }
            txb_clients.Text = text2display;
        }

        /// <summary>
        /// after 20231124
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        private List<int> ReadFromTextForSuiviAdmin(string text)
        {
            var listTechSheetFields = new List<SuiviAdmin>();
            var listSeperated = new List<SuiviAdmin>();

            var alllines = text.Split(new string[] { "\r\n" }, StringSplitOptions.None).ToList();
            var linenbs = new List<int>();
            foreach (var oneLine in alllines)
            {
                var allFields = oneLine.Split('\t').ToList();
                if (allFields.Count >= 26)
                {
                    var lastLine = new SuiviAdmin();
                    //lastLine.PtyId = allFields.ElementAt(0).Obj2Double();
                    //lastLine.SupId = allFields.ElementAt(1).Obj2Double();
                    lastLine.Mandataire = allFields.ElementAt(0).Trim();
                    lastLine.Statut = allFields.ElementAt(1).Trim();
                    lastLine.Commentaire = allFields.ElementAt(2).Trim();
                    lastLine.Client = allFields.ElementAt(3).Trim();
                    lastLine.CommandeNbr = allFields.ElementAt(5).Trim();
                    //lastLine.Client = "ECO NEGOCE";
                    lastLine.SignatureDevisDate = allFields.ElementAt(6).Trim();
                    lastLine.CommandeDate = allFields.ElementAt(7).Trim();
                    lastLine.CommandeName = allFields.ElementAt(8).Trim();
                    lastLine.Contact = allFields.ElementAt(10).Trim();
                    lastLine.Adresse = allFields.ElementAt(11).Trim();
                    lastLine.Postcode = allFields.ElementAt(12).Trim();
                    lastLine.Ville = allFields.ElementAt(13).Trim();
                    lastLine.Departement = allFields.ElementAt(14).Trim();
                    lastLine.Portable = allFields.ElementAt(15).Trim();
                    if (!string.IsNullOrEmpty(lastLine.Portable) && lastLine.Portable.Length < 10)
                    {
                        lastLine.Portable = string.Format("0{0}", lastLine.Portable);
                    }
                    lastLine.Email = allFields.ElementAt(16).Trim();
                    var check = 0;
                    lastLine.Projecteur_30W = allFields.ElementAt(17).Obj2Int();
                    check += lastLine.Projecteur_30W ?? 0;
                    lastLine.Projecteur_50W = allFields.ElementAt(18).Obj2Int();
                    check += lastLine.Projecteur_50W ?? 0;
                    lastLine.Projecteur_100W = allFields.ElementAt(19).Obj2Int();
                    check += lastLine.Projecteur_100W ?? 0;
                    lastLine.Projecteur_150W = allFields.ElementAt(20).Obj2Int();
                    check += lastLine.Projecteur_150W ?? 0;
                    lastLine.Parc_Etanche_1m20 = allFields.ElementAt(21).Obj2Int();
                    check += lastLine.Parc_Etanche_1m20 ?? 0;
                    lastLine.Hublot_18W = allFields.ElementAt(22).Obj2Int();
                    check += lastLine.Hublot_18W ?? 0;
                    lastLine.Candelabres_50W = allFields.ElementAt(23).Obj2Int();
                    check += lastLine.Candelabres_50W ?? 0;
                    lastLine.Candelabres_100W = allFields.ElementAt(24).Obj2Int();
                    check += lastLine.Candelabres_100W ?? 0;
                    lastLine.Solaire_10W = allFields.ElementAt(25).Obj2Int();
                    check += lastLine.Solaire_10W ?? 0;

                    //int columnCount = 26;
                    //while (columnCount <= allFields.Count)
                    //{
                    //}

                    lastLine.TotalCheck = allFields.ElementAt(26).Obj2Int();
                    lastLine.LineNb = allFields.ElementAt(27).Obj2Int();
                    linenbs.Add(lastLine.LineNb ?? 0);
                    // to check
                    if (lastLine.TotalCheck != check)
                    {
                        var testerror = "test";
                    }

                    // 20231211 重新区分三park etanche , street led (candelabre) 和 solaire 三类，是否都单独列出
                    if (cbx_seperate_parc.Checked
                        || cbx_seperate_street.Checked
                        || cbx_seperate_street100w.Checked
                        || cbx_seperate_solar.Checked
                        || cbx_seperate_prj_150.Checked)
                    {
                        var seprateLine = new SuiviAdmin();
                        seprateLine = (SuiviAdmin)lastLine.Clone();
                        seprateLine.Projecteur_30W = 0;
                        seprateLine.Projecteur_50W = 0;
                        //seprateLine.Projecteur_100W = 0;
                        //seprateLine.Projecteur_150W = 0;
                        seprateLine.Hublot_18W = 0;
                        int checkqtyforseprateline = 0;

                        //100w
                        if (!cbx_seperate_prj_100.Checked)
                        {
                            seprateLine.Projecteur_100W = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.Projecteur_100W.Value;
                            lastLine.Projecteur_100W = 0;
                        }
                        //150w
                        if (!cbx_seperate_prj_150.Checked)
                        {
                            seprateLine.Projecteur_150W = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.Projecteur_150W.Value;
                            lastLine.Projecteur_150W = 0;
                        }
                        //parc etanche
                        if (!cbx_seperate_parc.Checked)
                        {
                            seprateLine.Parc_Etanche_1m20 = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.Parc_Etanche_1m20.Value;
                            lastLine.Parc_Etanche_1m20 = 0;
                        }
                        // candelabres 50w
                        if (!cbx_seperate_street.Checked)
                        {
                            seprateLine.Candelabres_50W = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.Candelabres_50W.Value;
                            lastLine.Candelabres_50W = 0;
                        }
                        // candelabres 100w
                        if (!cbx_seperate_street100w.Checked)
                        {
                            seprateLine.Candelabres_100W = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.Candelabres_100W.Value;
                            lastLine.Candelabres_100W = 0;
                        }
                        // solaire
                        if (!cbx_seperate_solar.Checked)
                        {
                            seprateLine.Solaire_10W = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.Solaire_10W.Value;
                            lastLine.Solaire_10W = 0;
                        }
                        seprateLine.XmlField = CreateXmlForSuiviAdmin(seprateLine);
                        // check quantite
                        if (checkqtyforseprateline > 0)
                        {
                            listSeperated.Add(seprateLine);
                        }
                    }

                    //if (cbx_seperate_parc.Checked)
                    //{
                    //    // 这一行如果这三项任意都不为零，则需要新开辟一行
                    //    if (lastLine.Parc_Etanche_1m20 != 0 || lastLine.Candelabres_50W != 0 || lastLine.Candelabres_100W != 0)
                    //    {
                    //        var seprateLine = new SuiviAdmin();
                    //        seprateLine = (SuiviAdmin)lastLine.Clone();
                    //        seprateLine.Projecteur_30W = 0;
                    //        seprateLine.Projecteur_50W = 0;
                    //        seprateLine.Projecteur_100W = 0;
                    //        seprateLine.Projecteur_150W = 0;
                    //        seprateLine.Hublot_18W = 0;
                    //        seprateLine.XmlField = CreateXmlForSuiviAdmin(seprateLine);
                    //        listSeperated.Add(seprateLine);
                    //        // reset old line
                    //        lastLine.Parc_Etanche_1m20 = 0;
                    //        lastLine.Candelabres_50W = 0;
                    //        lastLine.Candelabres_100W = 0;
                    //    }
                    //}

                    var totalqtycheck =
                        lastLine.Projecteur_30W +
                        lastLine.Projecteur_50W +
                        //lastLine.Projecteur_100W +
                        //lastLine.Projecteur_150W +
                        lastLine.Hublot_18W;
                    //if (!cbx_seperate_parc.Checked)
                    //{
                    //    totalqtycheck += lastLine.Parc_Etanche_1m20 + lastLine.Candelabres_50W + lastLine.Candelabres_100W;
                    //}
                    if (!cbx_seperate_prj_100.Checked)
                    {
                        totalqtycheck += lastLine.Projecteur_100W;
                    }
                    if (!cbx_seperate_prj_150.Checked)
                    {
                        totalqtycheck += lastLine.Projecteur_150W;
                    }
                    if (!cbx_seperate_parc.Checked)
                    {
                        totalqtycheck += lastLine.Parc_Etanche_1m20;
                    }
                    if (!cbx_seperate_street.Checked)
                    {
                        totalqtycheck += lastLine.Candelabres_50W;
                    }
                    if (!cbx_seperate_street100w.Checked)
                    {
                        totalqtycheck += lastLine.Candelabres_100W;
                    }
                    if (!cbx_seperate_solar.Checked)
                    {
                        totalqtycheck += lastLine.Solaire_10W;
                    }

                    if (totalqtycheck > 0)
                    {
                        lastLine.XmlField = CreateXmlForSuiviAdmin(lastLine);
                        listTechSheetFields.Add(lastLine);
                    }
                }
            }
            DeliveryFormServices.GenerateClientOrderAndDfo(listTechSheetFields, CurrentUser);
            if (listSeperated.Any())
            {
                DeliveryFormServices.GenerateClientOrderAndDfo(listSeperated, CurrentUser);
            }
            return linenbs;
        }

        public string GetPropertyName<T>(Expression<Func<T>> propertyLambda)
        {
            var me = propertyLambda.Body as MemberExpression;

            if (me == null)
            {
                throw new ArgumentException("You must pass a lambda of the form: '() => Class.Property' or '() => object.Property'");
            }

            return me.Member.Name;
        }

        private string CreateXmlForSuiviAdmin(SuiviAdmin oneline)
        {
            using (var stringWriter = new StringWriter())
            {
                using (var xmlTextWriter = XmlWriter.Create(stringWriter))
                {
                    //创建类型声明节点
                    XmlDocument xmlDoc = new XmlDocument();
                    XmlNode node = xmlDoc.CreateXmlDeclaration("1.0", "utf-16", "");
                    xmlDoc.AppendChild(node);
                    //创建根节点
                    XmlNode root = xmlDoc.CreateElement("PropertyList");
                    if (oneline != null)
                    {
                        XmlElement propName = xmlDoc.CreateElement("Propety");
                        propName.SetAttribute(GetPropertyName(() => oneline.Mandataire), oneline.Mandataire);
                        propName.SetAttribute(GetPropertyName(() => oneline.Statut), oneline.Statut);
                        propName.SetAttribute(GetPropertyName(() => oneline.Commentaire), oneline.Commentaire);
                        propName.SetAttribute(GetPropertyName(() => oneline.Client), oneline.Client);
                        propName.SetAttribute(GetPropertyName(() => oneline.CommandeNbr), oneline.CommandeNbr);
                        propName.SetAttribute(GetPropertyName(() => oneline.SignatureDevisDate), oneline.SignatureDevisDate);
                        propName.SetAttribute(GetPropertyName(() => oneline.CommandeDate), oneline.CommandeDate);
                        propName.SetAttribute(GetPropertyName(() => oneline.CommandeName), oneline.CommandeName);
                        propName.SetAttribute(GetPropertyName(() => oneline.Contact), oneline.Contact);
                        propName.SetAttribute(GetPropertyName(() => oneline.Adresse), oneline.Adresse);
                        propName.SetAttribute(GetPropertyName(() => oneline.Postcode), oneline.Postcode);
                        propName.SetAttribute(GetPropertyName(() => oneline.Ville), oneline.Ville);
                        propName.SetAttribute(GetPropertyName(() => oneline.Departement), oneline.Departement);
                        propName.SetAttribute(GetPropertyName(() => oneline.Portable), oneline.Portable);
                        propName.SetAttribute(GetPropertyName(() => oneline.Email), oneline.Email);
                        propName.SetAttribute(GetPropertyName(() => oneline.Projecteur_30W), (oneline.Projecteur_30W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Projecteur_50W), (oneline.Projecteur_50W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Projecteur_100W), (oneline.Projecteur_100W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Projecteur_150W), (oneline.Projecteur_150W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Parc_Etanche_1m20), (oneline.Parc_Etanche_1m20 ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Hublot_18W), (oneline.Hublot_18W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Candelabres_50W), (oneline.Candelabres_50W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Candelabres_100W), (oneline.Candelabres_100W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.Solaire_10W), (oneline.Solaire_10W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.TotalCheck), (oneline.TotalCheck ?? 0).ToString());
                        root.AppendChild(propName);
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }

        }

        public static T CopyEntity<T>(T entity, bool copyKeys = false) where T : new()
        {
            T clone = new T();
            PropertyInfo[] pis = entity.GetType().GetProperties();

            foreach (PropertyInfo pi in pis)
            {
                EdmScalarPropertyAttribute[] attrs = (EdmScalarPropertyAttribute[])
            pi.GetCustomAttributes(typeof(EdmScalarPropertyAttribute), false);

                foreach (EdmScalarPropertyAttribute attr in attrs)
                {
                    if (!copyKeys && attr.EntityKeyProperty)
                        continue;

                    pi.SetValue(clone, pi.GetValue(entity, null), null);
                }
            }
            return clone;
        }

        private List<SuiviAdmin> ReadFromTextForSuiviAdmin_old(string text)
        {
            var listTechSheetFields = new List<SuiviAdmin>();
            var alllines = text.Split(new string[] { "\r\n" }, StringSplitOptions.None).ToList();
            foreach (var oneLine in alllines)
            {
                var allFields = oneLine.Split('\t').ToList();
                if (allFields.Count == 26)
                {
                    var lastLine = new SuiviAdmin();
                    //lastLine.PtyId = allFields.ElementAt(0).Obj2Double();
                    //lastLine.SupId = allFields.ElementAt(1).Obj2Double();
                    lastLine.Client = allFields.ElementAt(3).Trim();
                    //lastLine.Client = "ECO NEGOCE";
                    lastLine.CommandeName = allFields.ElementAt(7).Trim();
                    lastLine.Contact = allFields.ElementAt(9).Trim();
                    lastLine.Adresse = allFields.ElementAt(11).Trim();
                    lastLine.Postcode = allFields.ElementAt(12).Trim();
                    lastLine.Ville = allFields.ElementAt(13).Trim();
                    lastLine.Portable = allFields.ElementAt(15).Trim();
                    if (!string.IsNullOrEmpty(lastLine.Portable) && lastLine.Portable.Length < 10)
                    {
                        lastLine.Portable = string.Format("0{0}", lastLine.Portable);
                    }
                    lastLine.Email = allFields.ElementAt(16).Trim();
                    var check = 0;
                    lastLine.Projecteur_30W = allFields.ElementAt(17).Obj2Int();
                    check += lastLine.Projecteur_30W ?? 0;
                    lastLine.Projecteur_50W = allFields.ElementAt(18).Obj2Int();
                    check += lastLine.Projecteur_50W ?? 0;
                    lastLine.Projecteur_100W = allFields.ElementAt(19).Obj2Int();
                    check += lastLine.Projecteur_100W ?? 0;
                    lastLine.Projecteur_150W = allFields.ElementAt(20).Obj2Int();
                    check += lastLine.Projecteur_150W ?? 0;
                    lastLine.Parc_Etanche_1m20 = allFields.ElementAt(21).Obj2Int();
                    check += lastLine.Parc_Etanche_1m20 ?? 0;
                    lastLine.Hublot_18W = allFields.ElementAt(22).Obj2Int();
                    check += lastLine.Hublot_18W ?? 0;
                    lastLine.Candelabres_50W = allFields.ElementAt(23).Obj2Int();
                    check += lastLine.Candelabres_50W ?? 0;
                    lastLine.Candelabres_100W = allFields.ElementAt(24).Obj2Int();
                    check += lastLine.Candelabres_100W ?? 0;
                    lastLine.TotalCheck = allFields.ElementAt(25).Obj2Int();

                    // to check
                    if (lastLine.TotalCheck != check)
                    {
                        var testerror = "test";
                    }


                    listTechSheetFields.Add(lastLine);
                }
            }
            return listTechSheetFields;
        }

        #region 20251027 LIVRAISON CDL

        protected void btn_livraison_cdl_20251027_OnClick(object sender, EventArgs e)
        {
            var suiviadminText = txb_livraisoncdl.Text;
            var linenbs = ReadFromTextForLivraisonAndInsertIntoDb(suiviadminText);
            //var produitsList = DeliveryFormServices.GetCeePrd();

            var dfowithlinenb = DeliveryFormServices.GetDfoFromGdoclineNb(linenbs);
            var text2display = string.Empty;

            var linenblist = linenbs.Distinct().ToList();

            foreach (var oneline in linenblist)
            {
                //foreach (var keyValue in dfowithlinenb)
                //{
                //    text2display += string.Format("{0}\t{1}\r\n", keyValue.Key, keyValue.Value);
                //}
                var forthisline = dfowithlinenb.Where(l => l.Key == oneline).ToList();
                text2display += oneline;
                foreach (var keyValue in forthisline)
                {
                    text2display += string.Format("\t{0}", keyValue.Value);
                }
                text2display += "\r\n";
            }
            txb_clients.Text = text2display;
        }

        /// <summary>
        /// 将textarea 里面的文字插入到数据库中
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        private List<int> ReadFromTextForLivraisonAndInsertIntoDb(string text)
        {
            var listTechSheetFields = new List<LivraisonCdl>();
            var listSeperated = new List<LivraisonCdl>();

            var alllines = text.Split(new string[] { "\r\n" }, StringSplitOptions.None).ToList();
            var linenbs = new List<int>();
            foreach (var oneLine in alllines)
            {
                var allFields = oneLine.Split('\t').ToList();
                if (allFields.Count >= 10)
                {
                    var lastLine = new LivraisonCdl();
                    lastLine.COMPANY = allFields.ElementAt(0).SubTrim();
                    lastLine.DATE = allFields.ElementAt(1).SubTrim();
                    lastLine.CLIENT = allFields.ElementAt(2).SubTrim();
                    lastLine.SIRET = allFields.ElementAt(3).SubTrim();
                    lastLine.ADRESSE_DE_LIVRAISON = allFields.ElementAt(4).SubTrim();
                    lastLine.CP_VILLE = allFields.ElementAt(5).SubTrim();
                    lastLine.CONTACT_SUR_PLACE = allFields.ElementAt(6).SubTrim();
                    lastLine.Adresse_MAIL = allFields.ElementAt(7).SubTrim();
                    lastLine.NUMERO_TEL = allFields.ElementAt(8).SubTrim();
                    if (!string.IsNullOrEmpty(lastLine.NUMERO_TEL) && lastLine.NUMERO_TEL.Length < 10)
                    {
                        lastLine.NUMERO_TEL = string.Format("0{0}", lastLine.NUMERO_TEL);
                    }
                    lastLine.QUANTITE_HIGHBAY_250W = allFields.ElementAt(9).SubTrim().Obj2Int();
                    lastLine.QUANTITE_LINEAR_250W = allFields.ElementAt(10).SubTrim().Obj2Int();
                    lastLine.COMMENTAIRES = allFields.ElementAt(11).SubTrim();
                    lastLine.NUMERO_DE_LIGNE = allFields.ElementAt(12).SubTrim().Obj2Int() ?? 0;

                    linenbs.Add(lastLine.NUMERO_DE_LIGNE);

                    // 20231211 重新区分三park etanche , street led (candelabre) 和 solaire 三类，是否都单独列出
                    if (cbx_sp_ufo.Checked
                        || cbx_sp_linear.Checked)
                    {
                        var seprateLine = new LivraisonCdl();
                        seprateLine = (LivraisonCdl)lastLine.Clone();
                        seprateLine.QUANTITE_HIGHBAY_250W = 0;
                        seprateLine.QUANTITE_LINEAR_250W = 0;
                        int checkqtyforseprateline = 0;

                        //ufo
                        if (!cbx_sp_ufo.Checked)
                        {
                            seprateLine.QUANTITE_HIGHBAY_250W = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.QUANTITE_HIGHBAY_250W.Value;
                            lastLine.QUANTITE_HIGHBAY_250W = 0;
                        }
                        //linear
                        if (!cbx_sp_linear.Checked)
                        {
                            seprateLine.QUANTITE_LINEAR_250W = 0;
                        }
                        else
                        {
                            checkqtyforseprateline += lastLine.QUANTITE_LINEAR_250W.Value;
                            lastLine.QUANTITE_LINEAR_250W = 0;
                        }
                        seprateLine.XmlField = CreateXmlForLivraisonCDL(seprateLine);
                        // check quantite
                        if (checkqtyforseprateline > 0)
                        {
                            listSeperated.Add(seprateLine);
                        }
                    }

                    var totalqtycheck =
                        lastLine.QUANTITE_HIGHBAY_250W +
                        lastLine.QUANTITE_LINEAR_250W;

                    if (!cbx_sp_ufo.Checked)
                    {
                        totalqtycheck += lastLine.QUANTITE_HIGHBAY_250W;
                    }
                    if (!cbx_sp_linear.Checked)
                    {
                        totalqtycheck += lastLine.QUANTITE_LINEAR_250W;
                    }
                    if (totalqtycheck > 0)
                    {
                        lastLine.XmlField = CreateXmlForLivraisonCDL(lastLine);
                        listTechSheetFields.Add(lastLine);
                    }
                }
            }
            DeliveryFormServices.GenerateClientOrderAndDfoFromLivraisonCdl(listTechSheetFields, CurrentUser);
            if (listSeperated.Any())
            {
                DeliveryFormServices.GenerateClientOrderAndDfoFromLivraisonCdl(listSeperated, CurrentUser);
            }
            return linenbs;
        }

        /// <summary>
        /// 建立XML用于储存插入的数据
        /// </summary>
        /// <param name="oneline"></param>
        /// <returns></returns>
        private string CreateXmlForLivraisonCDL(LivraisonCdl oneline)
        {
            using (var stringWriter = new StringWriter())
            {
                using (var xmlTextWriter = XmlWriter.Create(stringWriter))
                {
                    //创建类型声明节点
                    XmlDocument xmlDoc = new XmlDocument();
                    XmlNode node = xmlDoc.CreateXmlDeclaration("1.0", "utf-16", "");
                    xmlDoc.AppendChild(node);
                    //创建根节点
                    XmlNode root = xmlDoc.CreateElement("PropertyList");
                    if (oneline != null)
                    {
                        XmlElement propName = xmlDoc.CreateElement("Propety");
                        propName.SetAttribute(GetPropertyName(() => oneline.DATE), oneline.DATE);
                        propName.SetAttribute(GetPropertyName(() => oneline.CLIENT), oneline.CLIENT);
                        propName.SetAttribute(GetPropertyName(() => oneline.SIRET), oneline.SIRET);
                        propName.SetAttribute(GetPropertyName(() => oneline.ADRESSE_DE_LIVRAISON), oneline.ADRESSE_DE_LIVRAISON);
                        propName.SetAttribute(GetPropertyName(() => oneline.CP_VILLE), oneline.CP_VILLE);
                        propName.SetAttribute(GetPropertyName(() => oneline.CONTACT_SUR_PLACE), oneline.CONTACT_SUR_PLACE);
                        propName.SetAttribute(GetPropertyName(() => oneline.Adresse_MAIL), oneline.Adresse_MAIL);
                        propName.SetAttribute(GetPropertyName(() => oneline.NUMERO_TEL), oneline.NUMERO_TEL);
                        propName.SetAttribute(GetPropertyName(() => oneline.QUANTITE_HIGHBAY_250W), (oneline.QUANTITE_HIGHBAY_250W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.QUANTITE_LINEAR_250W), (oneline.QUANTITE_LINEAR_250W ?? 0).ToString());
                        propName.SetAttribute(GetPropertyName(() => oneline.COMMENTAIRES), oneline.COMMENTAIRES);
                        propName.SetAttribute(GetPropertyName(() => oneline.NUMERO_DE_LIGNE), oneline.NUMERO_DE_LIGNE.ToString());
                        root.AppendChild(propName);
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        #endregion 20251027 LIVRAISON CDL

    }



    public static class Extension
    {
        public static string Obj2String(this object obj)
        {
            return obj != null ? obj.ToString() : string.Empty;
        }

        public static decimal? Obj2Decimal(this object obj)
        {
            decimal? decNull = null;
            if (obj != null)
            {
                decimal dec;
                decimal.TryParse(obj.Obj2String(), out dec);
                decNull = dec;
            }
            return decNull;
        }

        public static double? Obj2Double(this object obj)
        {
            double? decNull = null;
            if (obj != null)
            {
                double dec;
                double.TryParse(obj.Obj2String(), out dec);
                decNull = dec;
            }
            return decNull;
        }
        public static int? Obj2Int(this object obj)
        {
            int? decNull = null;
            if (obj != null)
            {
                int dec;
                obj = obj.ToString().Replace(" ", "");
                obj = obj.ToString().Replace(" ", "");
                int.TryParse(obj.Obj2String(), out dec);
                decNull = dec;
            }
            return decNull;
        }

        public static string SubTrim(this object obj)
        {
            return obj != null ? obj.ToString().Trim() : string.Empty;
        }
    }
}
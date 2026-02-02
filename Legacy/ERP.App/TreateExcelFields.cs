using System;
using System.Collections.Generic;
using System.Data.Common.CommandTrees;
using System.Linq;
using System.Text;
using ERP.DataServices;
using ERP.Entities;
using System.Text.RegularExpressions;
using ERP.Repositories.Extensions;

namespace ERP.App
{
    public class TreateExcelFields
    {
        public ProductServices ProductServices = new ProductServices();
        public SupplierProductServices SupplierProductServices = new SupplierProductServices();
        public Product GetProductFromExcelKeyValue(List<KeyValue> prdKeyValues, List<PropertyValue> prdPropertyValues, int ptyId)
        {
            int socId = 1;
            int prdId = 0;
            var refs = prdKeyValues.Where(m => m.KeyStr1.StartsWith("Référence")).ToList();
            var onePrd = new Product();
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

        public Product GetProductExcelWithExcelClass(List<PropertyValue> prdPropertyValues, ImportExcelClass onePrd)
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
            var newPrd = new Product();
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

            // 插入数据库
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
            SupplierProductServices.CreateUpdateSupplierProduct(spr);


            #endregion supplier product


            // todo: create supplier product




            return null;
        }
        
        public Product GetProductExcelWithExcelClass_2017_09_28(List<PropertyValue> prdPropertyValues, ImportExcelClass onePrd)
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
            if (onePrd.Operation_NORMAL == onePrd.Operation_DIMMABLE && onePrd.Operation_DIMMABLE == onePrd.Operation_DALI)
            {
                if (onePrd.Operation_NORMAL == 0 || onePrd.Operation_NORMAL == null)
                {
                    onePrd.Operation_NORMAL = 1;
                }
            }

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
            var newPrd = new Product();
            newPrd.PrdRef = onePrd.ECOLED_REFERENCE.Obj2String();
            newPrd.PrdName = onePrd.PRODUCT_NAME.Obj2String();

            // 使用temp reference 2017-09-29
            newPrd.PrdRef = onePrd.TEMP_REFERENCE.Obj2String();
            //newPrd.PrdDescription = onePrd.DESCRIPTION_OF_GOODS.Obj2String();
            //newPrd.PrdOutsideDiameter = onePrd.OUTSIDE_DIAMETER_.Obj2Decimal();
            newPrd.PrdLength = onePrd.LENGTH_IN_mm.Obj2Decimal();
            newPrd.PrdWidth = onePrd.WIDTH_IN_mm.Obj2Decimal();
            newPrd.PrdHeight = onePrd.HEIGHT_IN_mm.Obj2Decimal();
            newPrd.PrdDepth = onePrd.DEPTH_IN_.Obj2Decimal();
            //newPrd.PrdHoleSize = onePrd.HOLE_SIZE_IN_.Obj2Decimal();
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



            #region 2017-09-28

            newPrd.PrdTmpRef = onePrd.TEMP_REFERENCE.Obj2String();
            newPrd.PrdNewRef = onePrd.ECOLED_NEW_REFERENCE.Obj2String();
            newPrd.PrdName = onePrd.PRODUCT_NAME.Obj2String();
            newPrd.PrdSupDes = onePrd.DESCRIPTION_OF_GOODS.Obj2String();
            newPrd.PrdOutsideLength = onePrd.OUTSIDE_LENGHT.Obj2Decimal();
            newPrd.PrdOutsideWidth = onePrd.OUTSIDE_WIDTH.Obj2Decimal();
            newPrd.PrdOutsideHeight = onePrd.OUTSIDE_HEIGHT.Obj2Decimal();
            newPrd.PrdOutsideDiameter = onePrd.OUTSIDE_DIAMETER_.Obj2Decimal();
            newPrd.PrdLength = onePrd.LENGTH_IN_mm.Obj2Decimal();
            newPrd.PrdWidth = onePrd.WIDTH_IN_mm.Obj2Decimal();
            newPrd.PrdHeight = onePrd.HEIGHT_IN_mm.Obj2Decimal();
            newPrd.PrdHoleLength = onePrd.HOLE_SIZE_LENGTH.Obj2Decimal();
            newPrd.PrdHoleWidth = onePrd.HOLE_SIZE_WIDTH.Obj2Decimal();
            newPrd.PrdHoleSize = onePrd.HOLE_SIZE_IN_.Obj2Decimal();
            //newPrd.PrdHoleDiameter = onePrd.HOLE_SIZE_WIDTH


            #endregion 2017-09-28



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
            //var Protection = propGeneral.FirstOrDefault(m => m.PropName == "Protection");
            //if (Protection != null)
            //{
            //    var ip = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IP.Obj2String()) ? "" : "IP", onePrd.IP.Obj2String());
            //    var ik = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IK.Obj2String()) ? "" : "IK", onePrd.IK.Obj2String());
            //    Protection.PropValue = ip + string.Format("{0}{1}", string.IsNullOrEmpty(ik) ? "" : "/", ik);
            //}

            var ProtectionIP = propGeneral.FirstOrDefault(m => m.PropName == "Protection IP");
            if (ProtectionIP != null)
            {
                //var ip = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IP.Obj2String()) ? "" : "IP", onePrd.IP.Obj2String());
                //var ik = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IK.Obj2String()) ? "" : "IK", onePrd.IK.Obj2String());
                //Protection.PropValue = ip + string.Format("{0}{1}", string.IsNullOrEmpty(ik) ? "" : "/", ik);

                ProtectionIP.PropValue = onePrd.IP.Obj2String();
            }


            var ProtectionIK = propGeneral.FirstOrDefault(m => m.PropName == "Protection IK");
            if (ProtectionIK != null)
            {
                //var ip = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IP.Obj2String()) ? "" : "IP", onePrd.IP.Obj2String());
                //var ik = string.Format("{0}{1}", string.IsNullOrEmpty(onePrd.IK.Obj2String()) ? "" : "IK", onePrd.IK.Obj2String());
                //Protection.PropValue = ip + string.Format("{0}{1}", string.IsNullOrEmpty(ik) ? "" : "/", ik);
                var ik = onePrd.IK.Obj2String();
                if (string.IsNullOrEmpty(ik))
                {
                    ik = "N";
                }
                else if (ik == "10")
                {
                    ik = "A";
                }
                ProtectionIK.PropValue = ik;
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
            onePit.PitPurchasePrice = onePrd.PRICE_FROM_SUPPLIER_1.Obj2Decimal();


            var _ip = onePrd.IP.Obj2String();
            if (string.IsNullOrEmpty(_ip))
            {
                _ip = "NA";
            }
            var _ik = onePrd.IK.Obj2String();
            if (string.IsNullOrEmpty(_ik))
            {
                _ik = "N";
            }
            else if (_ik == "10")
            {
                _ik = "A";
            }

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
                    pit2200_normal.PitRef = newPrd.PrdRef + "22" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "22" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "22" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "26" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "26" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "26" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "30" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "30" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "30" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "40" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "40" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "40" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "57" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "57" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "57" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "60" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "60" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "60" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "67" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "67" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "67" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "RD" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RD" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RD" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "GN" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "GN" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "GN" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "BL" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "BL" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "BL" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "WT" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "WT" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "WT" + "L" + _ip + _ik;
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
                    pit2200_normal.PitRef = newPrd.PrdRef + "RG" + "N" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RG" + "D" + _ip + _ik;
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
                    pit2200_dimmable.PitRef = newPrd.PrdRef + "RG" + "L" + _ip + _ik;
                    listPits.Add(pit2200_dimmable);
                }
            }
            #endregion color rgb

            newPrd.InstanceList = listPits;

            #endregion product instant

            int prdId = 0;

            // 插入数据库
            prdId = ProductServices.CreateUpdateProductForImport(newPrd);

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
                SprCoef100 = onePrd.CoefPrice1_100.Obj2Decimal(),
                SprCoef500 = onePrd.CoefPrice100_500.Obj2Decimal(),

            };
            SupplierProductServices.CreateUpdateSupplierProduct(spr);


            #endregion supplier product


            // todo: create supplier product




            return null;
        }
        
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
        public static int? Obj2Int(this object obj)
        {
            int? decNull = null;
            if (obj != null)
            {
                int dec;
                int.TryParse(obj.Obj2String(), out dec);
                decNull = dec;
            }
            return decNull;
        }
    }

}

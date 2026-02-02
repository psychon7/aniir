using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;

namespace ERP.Repositories.SqlServer
{
    public partial class ProductTypeRepository : BaseSqlServerRepository
    {
        #region For Matrice

        public void CreateUpdateProductTypeMatrix(int ptyId, List<PropertyValue> propertyXNames, List<PropertyValue> propertyYNames)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            bool isCreate = false;
            if (ptm != null)
            {
                // update xml fields
                var propnamesX = propertyXNames;
                var propnamesY = propertyYNames;

                if (propertyXNames != null && propertyXNames.Any())
                {
                    propnamesX = XSortPropertyValues(propnamesX, ptyId);
                }
                if (propertyYNames != null && propertyYNames.Any())
                {
                    propnamesY = YSortPropertyValues(propnamesY, ptyId);
                }
                if (propnamesX != null && propnamesY != null && propnamesX.Any() && propnamesY.Any())
                {
                    var onePtm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
                    if (onePtm != null)
                    {
                        string rangeX = XPropety2XmlString(propertyXNames);
                        string rangeY = YPropety2XmlString(propertyYNames);
                        onePtm.ptm_range_X = rangeX;
                        onePtm.ptm_range_Y = rangeY;
                        _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(onePtm);
                        _db.SaveChanges();
                        var propX = GetMatrixXProperty(onePtm.ptm_range_X);
                        var propY = GetMatrixYProperty(onePtm.ptm_range_Y);
                        var propMx = GetMatrixMatrixProperty(onePtm.ptm_matrix);
                        var matrix = CreateUpdateMatrixXY(ptyId, propX, propY, propMx);
                        onePtm.ptm_matrix = matrix;
                        _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(onePtm);
                        _db.SaveChanges();
                    }
                    else
                    {
                        isCreate = true;
                    }
                }
            }
            else
            {
                isCreate = true;
            }
            if (isCreate)
            {
                // create xml fields
                var propnamesX = propertyXNames;
                var propnamesY = propertyYNames;

                if (propertyXNames != null && propertyXNames.Any())
                {
                    propnamesX = XSortPropertyValues(propnamesX, ptyId);
                }
                if (propertyYNames != null && propertyYNames.Any())
                {
                    propnamesY = YSortPropertyValues(propnamesY, ptyId);
                }
                if (propnamesX != null && propnamesY != null && propnamesX.Any() && propnamesY.Any())
                {
                    string rangeX = XPropety2XmlString(propertyXNames);
                    string rangeY = YPropety2XmlString(propertyYNames);
                    var onePtm = new TM_PTM_Product_Type_Matrix
                    {
                        pty_id = ptyId,
                        ptm_range_X = rangeX,
                        ptm_range_Y = rangeY
                    };
                    _db.TM_PTM_Product_Type_Matrix.AddObject(onePtm);
                    _db.SaveChanges();

                    int ptmId = onePtm.ptm_id;
                    var propX = GetMatrixXProperty(onePtm.ptm_range_X);
                    var propY = GetMatrixYProperty(onePtm.ptm_range_Y);
                    var propMx = GetMatrixMatrixProperty(onePtm.ptm_matrix);
                    var matrix = CreateUpdateMatrixXY(ptyId, propX, propY, propMx);
                    onePtm.ptm_matrix = matrix;
                    _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(onePtm);
                    _db.SaveChanges();
                }
            }
        }

        private string CreateUpdateMatrixXY(int ptyId, List<PropertyValue> propertyXNames, List<PropertyValue> propertyYNames, List<PropertyYValue> matrixNames)
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
                    XmlNode root = xmlDoc.CreateElement("PropertyMatrix");

                    // 如果没有X，Y值，表明新属性，没有Matrix项目
                    if (propertyXNames != null && propertyXNames.Any() && propertyYNames != null && propertyYNames.Any())
                    {
                        var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
                        if (ptm != null)
                        {
                            foreach (var xValue in propertyXNames)
                            {
                                foreach (var yValue in propertyYNames)
                                {
                                    XmlElement propName = xmlDoc.CreateElement("Propety");
                                    var mtCheckValue = matrixNames != null ? matrixNames.FirstOrDefault(m => m.PropXGuid == xValue.PropGuid && m.PropYGuid == yValue.PropGuid) : null;
                                    propName.SetAttribute("PropGuid", CheckAndParseGuid(mtCheckValue != null ? mtCheckValue.PropGuid : string.Empty).ToString());
                                    propName.SetAttribute("PropXGuid", xValue.PropGuid);
                                    propName.SetAttribute("PropName", xValue.PropName);
                                    propName.SetAttribute("PropType", xValue.PropType);
                                    propName.SetAttribute("PropUnit", xValue.PropUnit);
                                    propName.SetAttribute("PropOrder", xValue.PropOrder.ToString());
                                    propName.SetAttribute("PropParentOrder", xValue.PropParentOrder.ToString());
                                    propName.SetAttribute("PropSubOrder", xValue.PropSubOrder.ToString(CultureInfo.InvariantCulture));
                                    propName.SetAttribute("PropIsTitle", xValue.PropIsTitle.ToString());
                                    propName.SetAttribute("PropIsInTechReport", xValue.PropIsInTechReport.ToString());
                                    propName.SetAttribute("PropIsImage", xValue.PropIsImage.ToString());
                                    propName.SetAttribute("PropIsUnitRightSide", xValue.PropIsUnitRightSide.ToString());
                                    propName.SetAttribute("PropYGuid", yValue.PropGuid);
                                    propName.SetAttribute("PropSubOrderY", Convert.ToInt32(Math.Ceiling(yValue.PropSubOrder)).ToString());
                                    propName.SetAttribute("PropValue", "");
                                    root.AppendChild(propName);
                                }
                            }
                        }
                    }

                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        private static string XPropety2XmlString(List<PropertyValue> propertyNames)
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
                    foreach (var propertyValue in propertyNames)
                    {
                        XmlElement propName = xmlDoc.CreateElement("Propety");
                        propName.SetAttribute("PropGuid", CheckAndParseGuid(propertyValue.PropGuid).ToString());
                        propName.SetAttribute("PropName", propertyValue.PropName);
                        propName.SetAttribute("PropType", propertyValue.PropType);
                        propName.SetAttribute("PropUnit", propertyValue.PropUnit);
                        propName.SetAttribute("PropDescription", propertyValue.PropDescription);
                        propName.SetAttribute("PropOrder", propertyValue.PropOrder.ToString());
                        propName.SetAttribute("PropParentOrder", propertyValue.PropParentOrder.ToString());
                        propName.SetAttribute("PropSubOrder", propertyValue.PropSubOrder.ToString(CultureInfo.InvariantCulture));
                        //propName.SetAttribute("PropValue", "");
                        propName.SetAttribute("PropIsTitle", propertyValue.PropIsTitle.ToString());
                        propName.SetAttribute("PropIsInTechReport", propertyValue.PropIsInTechReport.ToString());
                        propName.SetAttribute("PropIsImage", propertyValue.PropIsImage.ToString());
                        propName.SetAttribute("PropIsUnitRightSide", propertyValue.PropIsUnitRightSide.ToString());
                        root.AppendChild(propName);
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        private static string YPropety2XmlString(List<PropertyValue> propertyNames)
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
                    foreach (var propertyValue in propertyNames)
                    {
                        XmlElement propName = xmlDoc.CreateElement("Propety");
                        propName.SetAttribute("PropGuid", CheckAndParseGuid(propertyValue.PropGuid).ToString());
                        propName.SetAttribute("PropName", propertyValue.PropName);
                        propName.SetAttribute("PropDescription", propertyValue.PropDescription);
                        propName.SetAttribute("PropSubOrder", propertyValue.PropSubOrder.ToString(CultureInfo.InvariantCulture));
                        //propName.SetAttribute("PropValue", "");
                        root.AppendChild(propName);
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        private List<PropertyValue> XSortPropertyValues(List<PropertyValue> values, int ptyId)
        {
            if (values.Any())
            {
                var order_0 = values.Where(m => m.PropOrder == 0);
                var order_not_0 = values.Where(m => m.PropOrder != 0);
                var oneqty = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
                var lastOrder = 0;
                if (oneqty != null)
                {
                    var propxml = oneqty.ptm_range_X;
                    if (propxml != null)
                    {
                        XmlDocument xdoc = new XmlDocument();
                        xdoc.Load(propxml);
                        if (xdoc.DocumentElement != null)
                        {
                            var props = xdoc.DocumentElement.ChildNodes;
                            var orders = (from XmlNode prop in props
                                          let xmlAttributeCollection = prop.Attributes
                                          where xmlAttributeCollection != null
                                          select Convert.ToInt32(xmlAttributeCollection["PropOrder"])).ToList();
                            orders = orders.OrderByDescending(m => m).ToList();
                            lastOrder = orders.FirstOrDefault();
                        }
                    }
                }
                lastOrder++;
                foreach (var propertyValue in order_0)
                {
                    propertyValue.PropOrder = lastOrder;
                    if (propertyValue.PropParentOrder == 0)
                    {
                        propertyValue.PropParentOrder = propertyValue.PropOrder;
                    }
                    lastOrder++;
                }

                foreach (var propertyValue in order_not_0)
                {
                    if (propertyValue.PropParentOrder == 0)
                    {
                        propertyValue.PropParentOrder = propertyValue.PropOrder;
                    }
                }

                // 处理显示顺序
                var displayOrderWithValue = values.Where(m => m.PropSubOrder != 0m).OrderBy(m => m.PropSubOrder);
                var displayOrderWithoutValue = values.Where(m => m.PropSubOrder == 0m);
                decimal stepValue = 0.0001m;
                foreach (var propV in displayOrderWithValue)
                {
                    var oneV = propV;
                    var sameParentOrder = displayOrderWithoutValue.Where(m => m.PropParentOrder == oneV.PropParentOrder)
                            .OrderBy(m => m.PropIsTitle);
                    var subCount = sameParentOrder.Count();
                    var subStepValue = subCount / 1000 > 0
                        ? 0.0001m
                        : (subCount / 100 > 0
                            ? 0.001m
                            : (subCount / 10 > 0
                                ? 0.01m
                                : (0.1m)));
                    stepValue = subStepValue;
                    foreach (var subPropV in sameParentOrder)
                    {
                        subPropV.PropSubOrder = oneV.PropSubOrder + subStepValue;
                        subStepValue += stepValue;
                    }
                }
                stepValue = 0.0001m;
                displayOrderWithoutValue = values.Where(m => m.PropSubOrder == 0).OrderBy(m => m.PropParentOrder);

                // 处理没有编号的顺序
                var maxsubOrder = Convert.ToDecimal(Rounding_Int(Convert.ToDouble(values.Max(m => m.PropSubOrder))) + 1);
                foreach (var propV in displayOrderWithoutValue)
                {
                    var oneV = propV;
                    var sameParentOrder = displayOrderWithoutValue.Where(m => m.PropParentOrder == oneV.PropParentOrder).OrderByDescending(m => m.PropIsTitle);
                    var subCount = sameParentOrder.Count();
                    if (subCount > 0)
                    {
                        var subStepValue = subCount / 1000 > 0
                           ? 0.0001m
                           : (subCount / 100 > 0
                               ? 0.001m
                               : (subCount / 10 > 0
                                   ? 0.01m
                                   : (0.1m)));
                        stepValue = subStepValue;
                        int integerFlag = 1;
                        foreach (var subPropV in sameParentOrder)
                        {
                            subPropV.PropSubOrder = integerFlag == 1 ? maxsubOrder : maxsubOrder + subStepValue;
                            subStepValue += integerFlag == 1 ? 0 : stepValue;
                            integerFlag++;
                        }
                        maxsubOrder += 1;
                    }
                }
            }
            return values;
        }

        private List<PropertyValue> YSortPropertyValues(List<PropertyValue> values, int ptyId)
        {
            if (values.Any())
            {
                var order_0 = values.Where(m => m.PropOrder == 0);
                var order_not_0 = values.Where(m => m.PropOrder != 0);
                var oneqty = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
                var lastOrder = 0;
                if (oneqty != null)
                {
                    var propxml = oneqty.ptm_range_X;
                    if (propxml != null)
                    {
                        XmlDocument xdoc = new XmlDocument();
                        xdoc.Load(propxml);
                        if (xdoc.DocumentElement != null)
                        {
                            var props = xdoc.DocumentElement.ChildNodes;
                            var orders = (from XmlNode prop in props
                                          let xmlAttributeCollection = prop.Attributes
                                          where xmlAttributeCollection != null
                                          select Convert.ToInt32(xmlAttributeCollection["PropSubOrder"])).ToList();
                            orders = orders.OrderByDescending(m => m).ToList();
                            lastOrder = orders.FirstOrDefault();
                        }
                    }
                }
                lastOrder++;
                foreach (var propertyValue in order_0)
                {
                    propertyValue.PropSubOrder = lastOrder;
                    lastOrder++;
                }

                //foreach (var propertyValue in order_not_0)
                //{
                //    if (propertyValue.PropParentOrder == 0)
                //    {
                //        propertyValue.PropParentOrder = propertyValue.PropOrder;
                //    }
                //}

                //// 处理显示顺序
                //var displayOrderWithValue = values.Where(m => m.PropSubOrder != 0m).OrderBy(m => m.PropSubOrder);
                //var displayOrderWithoutValue = values.Where(m => m.PropSubOrder == 0m);
                //decimal stepValue = 0.0001m;
                //foreach (var propV in displayOrderWithValue)
                //{
                //    var oneV = propV;
                //    var sameParentOrder = displayOrderWithoutValue.Where(m => m.PropParentOrder == oneV.PropParentOrder).OrderBy(m => m.PropIsTitle);
                //    var subCount = sameParentOrder.Count();
                //    var subStepValue = 1m;
                //    stepValue = subStepValue;
                //    foreach (var subPropV in sameParentOrder)
                //    {
                //        subPropV.PropSubOrder = oneV.PropSubOrder + subStepValue;
                //        subStepValue += stepValue;
                //    }
                //}
                //stepValue = 0.0001m;
                //displayOrderWithoutValue = values.Where(m => m.PropSubOrder == 0).OrderBy(m => m.PropParentOrder);

                //// 处理没有编号的顺序
                //var maxsubOrder = Convert.ToDecimal(Rounding_Int(Convert.ToDouble(values.Max(m => m.PropSubOrder))) + 1);
                //foreach (var propV in displayOrderWithoutValue)
                //{
                //    var oneV = propV;
                //    var sameParentOrder = displayOrderWithoutValue.Where(m => m.PropParentOrder == oneV.PropParentOrder).OrderByDescending(m => m.PropIsTitle);
                //    var subCount = sameParentOrder.Count();
                //    if (subCount > 0)
                //    {
                //        var subStepValue = 1m;
                //        stepValue = subStepValue;
                //        int integerFlag = 1;
                //        foreach (var subPropV in sameParentOrder)
                //        {
                //            subPropV.PropSubOrder = integerFlag == 1 ? maxsubOrder : maxsubOrder + subStepValue;
                //            subStepValue += integerFlag == 1 ? 0 : stepValue;
                //            integerFlag++;
                //        }
                //        maxsubOrder += 1;
                //    }
                //    //displayOrderWithoutValue = values.Where(m => m.PropSubOrder == 0).OrderBy(m => m.PropParentOrder);
                //}
            }
            return values;
        }

        /// <summary>
        /// 为读取数据以及组建Matrix
        /// </summary>
        /// <param name="xmlfield"></param>
        /// <returns></returns>
        private List<PropertyValue> GetMatrixXProperty(string xmlfield)
        {
            var propNames = new List<PropertyValue>();
            if (!string.IsNullOrEmpty(xmlfield))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlfield);
                var nodeList = doc.SelectNodes("PropertyList/Propety");
                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var oneProp = new PropertyValue();
                        if (node.Attributes != null)
                        {
                            oneProp.PropGuid = node.Attributes["PropGuid"] != null ? node.Attributes["PropGuid"].Value : string.Empty;
                            oneProp.PropName = node.Attributes["PropName"] != null ? node.Attributes["PropName"].Value : string.Empty;
                            oneProp.PropDescription = node.Attributes["PropDescription"] != null ? node.Attributes["PropDescription"].Value : string.Empty;
                            oneProp.PropType = node.Attributes["PropType"] != null ? node.Attributes["PropType"].Value : string.Empty;
                            oneProp.PropUnit = node.Attributes["PropUnit"] != null ? node.Attributes["PropUnit"].Value : string.Empty;
                            oneProp.PropIsTitle = node.Attributes["PropIsTitle"] != null && Convert.ToBoolean(node.Attributes["PropIsTitle"].Value);
                            oneProp.PropIsInTechReport = node.Attributes["PropIsInTechReport"] != null && Convert.ToBoolean(node.Attributes["PropIsInTechReport"].Value);
                            oneProp.PropIsImage = node.Attributes["PropIsImage"] != null && Convert.ToBoolean(node.Attributes["PropIsImage"].Value);
                            oneProp.PropIsUnitRightSide = node.Attributes["PropIsUnitRightSide"] != null && Convert.ToBoolean(node.Attributes["PropIsUnitRightSide"].Value);
                            oneProp.PropOrder = node.Attributes["PropOrder"] != null ? Convert.ToInt32(node.Attributes["PropOrder"].Value) : 0;
                            oneProp.PropParentOrder = node.Attributes["PropParentOrder"] != null ? Convert.ToInt32(node.Attributes["PropParentOrder"].Value) : 0;
                            oneProp.PropSubOrder = node.Attributes["PropSubOrder"] != null ? Convert.ToDecimal(node.Attributes["PropSubOrder"].Value, CultureInfo.InvariantCulture) : 0;
                        }
                        propNames.Add(oneProp);
                    }
                }
            }
            propNames = propNames.OrderBy(m => m.PropSubOrder).ThenBy(m => m.PropParentOrder).ThenBy(m => m.PropOrder).ToList();
            return propNames;
        }

        /// <summary>
        /// 为读取数据以及组建Matrix
        /// </summary>
        /// <param name="xmlfield"></param>
        /// <returns></returns>
        private List<PropertyValue> GetMatrixYProperty(string xmlfield)
        {
            var propNames = new List<PropertyValue>();
            if (!string.IsNullOrEmpty(xmlfield))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlfield);
                var nodeList = doc.SelectNodes("PropertyList/Propety");
                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var oneProp = new PropertyValue();
                        if (node.Attributes != null)
                        {
                            oneProp.PropGuid = node.Attributes["PropGuid"] != null ? node.Attributes["PropGuid"].Value : string.Empty;
                            oneProp.PropName = node.Attributes["PropName"] != null ? node.Attributes["PropName"].Value : string.Empty;
                            oneProp.PropDescription = node.Attributes["PropDescription"] != null ? node.Attributes["PropDescription"].Value : string.Empty;
                            oneProp.PropSubOrder = node.Attributes["PropSubOrder"] != null ? Convert.ToDecimal(node.Attributes["PropSubOrder"].Value, CultureInfo.InvariantCulture) : 0;
                        }
                        propNames.Add(oneProp);
                    }
                }
            }
            propNames = propNames.OrderBy(m => m.PropSubOrder).ThenBy(m => m.PropParentOrder).ThenBy(m => m.PropOrder).ToList();
            return propNames;
        }

        /// <summary>
        /// 为读取数据以及组建Matrix
        /// </summary>
        /// <param name="xmlfield"></param>
        /// <returns></returns>
        private List<PropertyYValue> GetMatrixMatrixProperty(string xmlfield)
        {
            var propNames = new List<PropertyYValue>();
            if (!string.IsNullOrEmpty(xmlfield))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlfield);
                var nodeList = doc.SelectNodes("PropertyMatrix/Propety");
                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var oneProp = new PropertyYValue();
                        if (node.Attributes != null)
                        {
                            oneProp.PropGuid = node.Attributes["PropGuid"] != null ? node.Attributes["PropGuid"].Value : string.Empty;
                            oneProp.PropName = node.Attributes["PropName"] != null ? node.Attributes["PropName"].Value : string.Empty;
                            oneProp.PropDescription = node.Attributes["PropDescription"] != null ? node.Attributes["PropDescription"].Value : string.Empty;
                            oneProp.PropType = node.Attributes["PropType"] != null ? node.Attributes["PropType"].Value : string.Empty;
                            oneProp.PropUnit = node.Attributes["PropUnit"] != null ? node.Attributes["PropUnit"].Value : string.Empty;
                            oneProp.PropIsTitle = node.Attributes["PropIsTitle"] != null && Convert.ToBoolean(node.Attributes["PropIsTitle"].Value);
                            oneProp.PropIsInTechReport = node.Attributes["PropIsInTechReport"] != null && Convert.ToBoolean(node.Attributes["PropIsInTechReport"].Value);
                            oneProp.PropIsImage = node.Attributes["PropIsImage"] != null && Convert.ToBoolean(node.Attributes["PropIsImage"].Value);
                            oneProp.PropIsUnitRightSide = node.Attributes["PropIsUnitRightSide"] != null && Convert.ToBoolean(node.Attributes["PropIsUnitRightSide"].Value);
                            oneProp.PropOrder = node.Attributes["PropOrder"] != null ? Convert.ToInt32(node.Attributes["PropOrder"].Value) : 0;
                            oneProp.PropParentOrder = node.Attributes["PropParentOrder"] != null ? Convert.ToInt32(node.Attributes["PropParentOrder"].Value) : 0;
                            oneProp.PropSubOrder = node.Attributes["PropSubOrder"] != null ? Convert.ToDecimal(node.Attributes["PropSubOrder"].Value, CultureInfo.InvariantCulture) : 0;
                            oneProp.PropXGuid = node.Attributes["PropXGuid"] != null ? node.Attributes["PropXGuid"].Value : string.Empty;
                            oneProp.PropYGuid = node.Attributes["PropYGuid"] != null ? node.Attributes["PropYGuid"].Value : string.Empty;
                            oneProp.PropSubOrderY = node.Attributes["PropSubOrderY"] != null ? Convert.ToInt32(node.Attributes["PropSubOrderY"].Value) : 0;
                        }
                        propNames.Add(oneProp);
                    }
                }
            }
            propNames = propNames.OrderBy(m => m.PropSubOrder).ThenBy(m => m.PropParentOrder).ThenBy(m => m.PropOrder).ThenBy(m => m.PropSubOrderY).ToList();
            return propNames;
        }

        #endregion For Matrice

        #region For Matrix New

        public PropertyValue CreateUpdateMartrixColumn(int ptyId, PropertyValue propertyValue)
        {
            if (propertyValue != null)
            {
                var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
                bool isCreate = false;
                if (ptm != null)
                {
                    // update xml fields
                    var xRange = ptm.ptm_range_X;
                    var xprop = GetXColumn(xRange);
                    var oneprop = xprop.FirstOrDefault(m => m.PropGuid == propertyValue.PropGuid);
                    if (oneprop != null)
                    {
                        oneprop.PropName = propertyValue.PropName;
                        oneprop.PropUnit = propertyValue.PropUnit;
                        oneprop.PropIsUnitRightSide = propertyValue.PropIsUnitRightSide;
                        oneprop.PropSubOrder = propertyValue.PropSubOrder;
                        oneprop.PropType = propertyValue.PropType;
                        oneprop.PropDescription = propertyValue.PropDescription;

                        var xXmlString = XColumnsPropety2XmlStringCreateUpdate(xprop);
                        ptm.ptm_range_X = xXmlString;
                        _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                        _db.SaveChanges();
                        propertyValue.SubYPropValues = GetYItems(ptm.ptm_range_Y).Where(m => m.PropXGuid == propertyValue.PropGuid).ToList();
                    }
                    else
                    {
                        // add new column
                        propertyValue.PropGuid = Guid.NewGuid().ToString();
                        xprop.Add(propertyValue);
                        var xXmlString = XColumnsPropety2XmlStringCreateUpdate(xprop);
                        ptm.ptm_range_X = xXmlString;
                        _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                        _db.SaveChanges();
                        //propertyValue.PropGuid = GetXColumn(xXmlString).FirstOrDefault().PropGuid;
                    }
                }
                else
                {
                    isCreate = true;
                }
                if (isCreate)
                {
                    // create xml fields
                    var listprop = new List<PropertyValue>();
                    listprop.Add(propertyValue);
                    var xXmlString = XColumnsPropety2XmlStringCreateUpdate(listprop);
                    ptm = new TM_PTM_Product_Type_Matrix
                    {
                        pty_id = ptyId,
                        ptm_range_X = xXmlString
                    };
                    _db.TM_PTM_Product_Type_Matrix.AddObject(ptm);
                    _db.SaveChanges();
                    propertyValue.PropGuid = GetXColumn(xXmlString).FirstOrDefault().PropGuid;
                }
            }
            return propertyValue;
        }

        private List<PropertyValue> TreateXColumnBeforeCreateUpdate(int ptyId, List<PropertyValue> propertyNames, List<PropertyYValue> propertyYValues)
        {
            var returnvalue = new List<PropertyValue>();
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            bool isCreate = false;
            if (ptm != null)
            {
                // update xml fields

            }
            else
            {
                isCreate = true;
            }
            if (isCreate)
            {
                // create xml fields
                var xXmlValue = XColumnsPropety2XmlStringCreateUpdate(propertyNames);
                var yXmlValue = YColumnsPropety2XmlStringCreateUpdate(propertyYValues);
                var onePtm = new TM_PTM_Product_Type_Matrix
                {
                    pty_id = ptyId,
                    ptm_range_X = xXmlValue,
                    ptm_range_Y = yXmlValue
                };
                _db.TM_PTM_Product_Type_Matrix.AddObject(onePtm);
                _db.SaveChanges();
                CreateUpdateXYMatrix(propertyNames, propertyYValues);
                //returnvalue = GetXColumn(onePtm.ptm_range_X);

            }
            return returnvalue;
        }

        /// <summary>
        /// 创建或者更新XColumn的值，如果是单列的话，就单列更新，如果是多列的话，就多列更新;同时用于Z轴
        /// </summary>
        /// <param name="propertyNames"></param>
        /// <returns></returns>
        private static string XColumnsPropety2XmlStringCreateUpdate(List<PropertyValue> propertyNames)
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
                    foreach (var propertyValue in propertyNames)
                    {
                        XmlElement propName = xmlDoc.CreateElement("Propety");
                        propName.SetAttribute("PropGuid", CheckAndParseGuid(propertyValue.PropGuid).ToString());
                        propName.SetAttribute("PropName", propertyValue.PropName);
                        propName.SetAttribute("PropType", propertyValue.PropType);
                        propName.SetAttribute("PropUnit", propertyValue.PropUnit);
                        propName.SetAttribute("PropDescription", propertyValue.PropDescription);
                        // 这里只有显示顺序
                        propName.SetAttribute("PropSubOrder", Convert.ToInt32(Math.Ceiling(propertyValue.PropSubOrder)).ToString());
                        propName.SetAttribute("PropIsUnitRightSide", propertyValue.PropIsUnitRightSide.ToString());
                        root.AppendChild(propName);
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        private static string YColumnsPropety2XmlStringCreateUpdate(List<PropertyYValue> propertyNames)
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
                    Guid guid;
                    foreach (var propertyValue in propertyNames)
                    {
                        try
                        {
                            guid = new Guid(propertyValue.PropXGuid);
                            XmlElement propName = xmlDoc.CreateElement("Propety");
                            propName.SetAttribute("PropGuid", CheckAndParseGuid(propertyValue.PropGuid).ToString());
                            propName.SetAttribute("PropXGuid", CheckAndParseGuid(propertyValue.PropXGuid).ToString());
                            propName.SetAttribute("PropName", propertyValue.PropName);
                            propName.SetAttribute("PropDescription", propertyValue.PropDescription);
                            root.AppendChild(propName);
                        }
                        catch (FormatException)
                        {
                        }
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        private static string CreateUpdateXYMatrix(List<PropertyValue> propertyX, List<PropertyYValue> propertyY)
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
                    XmlNode root = xmlDoc.CreateElement("PropertyMatrix");

                    // 如果没有X，Y值，表明新属性，没有Matrix项目
                    if (propertyX != null && propertyX.Any() && propertyY != null && propertyY.Any())
                    {
                        List<List<PropertyYValue>> listprops = new List<List<PropertyYValue>>();

                        // 将Y值按照X值放到list中
                        foreach (var xValue in propertyX)
                        {
                            var oneXvalue = xValue;
                            var yvalueForX = propertyY.Where(m => m.PropXGuid == oneXvalue.PropGuid).Select(m => new PropertyYValue
                            {
                                PropGuid = m.PropGuid,
                                PropXGuid = oneXvalue.PropGuid,
                                PropName = m.PropName,
                                PropXName = oneXvalue.PropName
                            }).ToList();
                            listprops.Add(yvalueForX);
                        }

                        var listYKeyValue = new List<KeyValue>();
                        var listYcount = new List<int>();
                        // 建立list keyvalue 将 Y值按顺序放到list 中，准备处理
                        foreach (var oneXprop in listprops)
                        {
                            int xCount = 1;
                            foreach (var oneyValue in oneXprop)
                            {
                                var keyvalue = new KeyValue
                                {
                                    Key = xCount,
                                    Value = oneyValue.PropXName,
                                    Value2 = oneyValue.PropName,
                                    Value3 = oneyValue.PropXGuid,
                                    Value4 = oneyValue.PropGuid
                                };
                                listYKeyValue.Add(keyvalue);
                                xCount++;
                            }
                            listYcount.Add(oneXprop.Count);
                        }

                        var itemsCount = listYcount.Aggregate(1, (current, count) => current * (count != 0 ? count : 1));

                        // 构成新的属性列表
                        // listListKeyValues 中有 itemsCount行的 List<KeyValue> 也就是, List<KeyValue>的count就是X列的数目
                        var listAllItemsSeperateByItemCount = new List<List<KeyValue>>();
                        var xPropCount = listYKeyValue.Max(m => m.Key) - 1;
                        for (int i = 0; i < itemsCount; i++)
                        {
                            var listKeyValue = new List<KeyValue>();
                            for (int j = 0; j < xPropCount; j++)
                            {
                                var kv = new KeyValue();
                                listKeyValue.Add(kv);
                            }
                            listAllItemsSeperateByItemCount.Add(listYKeyValue);
                        }
                        for (int xindex = 0; xindex < xPropCount; xindex++)
                        {
                            var xindex1 = xindex;
                            var yValuesForX = listYKeyValue.Where(m => m.Key == xindex1 + 1);
                            foreach (var listXitem in listAllItemsSeperateByItemCount)
                            {
                                foreach (var yValue in yValuesForX)
                                {
                                    // X name
                                    listXitem[xindex].Value = yValue.Value;
                                    // Y name
                                    listXitem[xindex].Value2 = yValue.Value2;
                                    // X Guid
                                    listXitem[xindex].Value3 = yValue.Value3;
                                    // Y Guid
                                    listXitem[xindex].Value4 = yValue.Value4;
                                }
                            }
                        }

                        foreach (var oneItem in listAllItemsSeperateByItemCount)
                        {
                            if (oneItem.Any())
                            {
                                XmlElement propName = xmlDoc.CreateElement("Propety");
                                propName.SetAttribute("PropGuid", CheckAndParseGuid(string.Empty).ToString());
                                foreach (var yValue in oneItem)
                                {
                                    propName.SetAttribute(yValue.Value + "_Guid", yValue.Value3);
                                    propName.SetAttribute(yValue.Value, yValue.Value);
                                    propName.SetAttribute(yValue.Value2 + "_Guid", yValue.Value4);
                                    propName.SetAttribute(yValue.Value2, yValue.Value2);
                                }
                                root.AppendChild(propName);
                            }
                        }


                        //XmlElement propName = xmlDoc.CreateElement("Propety");
                        //var mtCheckValue = matrixNames != null ? matrixNames.FirstOrDefault(m => m.PropXGuid == xValue.PropGuid && m.PropYGuid == yValue.PropGuid) : null;
                        //propName.SetAttribute("PropGuid", CheckAndParseGuid(string.Empty).ToString());



                        //propName.SetAttribute("PropXGuid", xValue.PropGuid);
                        //propName.SetAttribute("PropName", xValue.PropName);
                        //propName.SetAttribute("PropType", xValue.PropType);
                        //propName.SetAttribute("PropUnit", xValue.PropUnit);
                        //propName.SetAttribute("PropOrder", xValue.PropOrder.ToString());
                        //propName.SetAttribute("PropParentOrder", xValue.PropParentOrder.ToString());
                        //propName.SetAttribute("PropSubOrder", xValue.PropSubOrder.ToString(CultureInfo.InvariantCulture));
                        //propName.SetAttribute("PropIsTitle", xValue.PropIsTitle.ToString());
                        //propName.SetAttribute("PropIsInTechReport", xValue.PropIsInTechReport.ToString());
                        //propName.SetAttribute("PropIsImage", xValue.PropIsImage.ToString());
                        //propName.SetAttribute("PropIsUnitRightSide", xValue.PropIsUnitRightSide.ToString());
                        //propName.SetAttribute("PropYGuid", yValue.PropGuid);
                        //propName.SetAttribute("PropSubOrderY",
                        //    Convert.ToInt32(Math.Ceiling(yValue.PropSubOrder)).ToString());
                        //propName.SetAttribute("PropValue", "");
                        //root.AppendChild(propName);
                    }

                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        /// <summary>
        /// 用于X与Z轴
        /// </summary>
        /// <param name="xmlFields"></param>
        /// <returns></returns>
        private static List<PropertyValue> GetXColumn(string xmlFields)
        {
            var propNames = new List<PropertyValue>();
            if (!string.IsNullOrEmpty(xmlFields))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlFields);
                var nodeList = doc.SelectNodes("PropertyList/Propety");
                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var oneProp = new PropertyValue();
                        if (node.Attributes != null)
                        {
                            oneProp.PropGuid = node.Attributes["PropGuid"] != null ? node.Attributes["PropGuid"].Value : string.Empty;
                            oneProp.PropName = node.Attributes["PropName"] != null ? node.Attributes["PropName"].Value : string.Empty;
                            oneProp.PropDescription = node.Attributes["PropDescription"] != null ? node.Attributes["PropDescription"].Value : string.Empty;
                            oneProp.PropType = node.Attributes["PropType"] != null ? node.Attributes["PropType"].Value : string.Empty;
                            oneProp.PropUnit = node.Attributes["PropUnit"] != null ? node.Attributes["PropUnit"].Value : string.Empty;
                            oneProp.PropIsUnitRightSide = node.Attributes["PropIsUnitRightSide"] != null && Convert.ToBoolean(node.Attributes["PropIsUnitRightSide"].Value);
                            oneProp.PropSubOrder = node.Attributes["PropSubOrder"] != null ? Convert.ToInt32(node.Attributes["PropSubOrder"].Value, CultureInfo.InvariantCulture) : 0;
                        }
                        propNames.Add(oneProp);
                    }
                }
            }
            propNames = propNames.OrderBy(m => m.PropSubOrder).ThenBy(m => m.PropSubOrder).ToList();
            return propNames;
        }

        private static List<PropertyYValue> GetYItems(string xmlFields)
        {
            var propNames = new List<PropertyYValue>();
            if (!string.IsNullOrEmpty(xmlFields))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlFields);
                var nodeList = doc.SelectNodes("PropertyList/Propety");
                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var oneProp = new PropertyYValue();
                        if (node.Attributes != null)
                        {
                            oneProp.PropGuid = node.Attributes["PropGuid"] != null ? node.Attributes["PropGuid"].Value : string.Empty;
                            oneProp.PropName = node.Attributes["PropName"] != null ? node.Attributes["PropName"].Value : string.Empty;
                            oneProp.PropDescription = node.Attributes["PropDescription"] != null ? node.Attributes["PropDescription"].Value : string.Empty;
                            oneProp.PropXGuid = node.Attributes["PropXGuid"] != null ? node.Attributes["PropXGuid"].Value : string.Empty;
                        }
                        propNames.Add(oneProp);
                    }
                }
            }
            propNames = propNames.OrderBy(m => m.PropName).ToList();
            return propNames;
        }

        public List<PropertyValue> GetProductMatrixByPtyId(int ptyId)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                var xRange = GetXColumn(ptm.ptm_range_X);
                var yRange = GetYItems(ptm.ptm_range_Y);
                foreach (var aProp in xRange)
                {
                    var prop = aProp;
                    var yValues = yRange.Where(m => m.PropXGuid == prop.PropGuid);
                    prop.SubYPropValues = yValues.ToList();
                }
                return xRange;
            }
            else
            {
                return null;
            }
        }

        public PropertyValue GetProductMatrixByIdGuid(int ptyId, string xGuid)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                var xRange = GetXColumn(ptm.ptm_range_X).FirstOrDefault(m => m.PropGuid == xGuid);
                var yRange = GetYItems(ptm.ptm_range_Y).Where(m => m.PropXGuid == xGuid).ToList();
                if (xRange != null)
                {
                    var yValues = yRange.Where(m => m.PropXGuid == xRange.PropGuid);
                    xRange.SubYPropValues = yValues.ToList();
                }
                return xRange;
            }
            else
            {
                return null;
            }
        }

        public bool DeleteOnePropertyByXGuid(int ptyId, string propGuid)
        {
            bool returnvalue = false;
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                try
                {
                    // 1. delete Y
                    var yxmlfields = ptm.ptm_range_Y;
                    var newYXmlFields = DeletePropYbyXGuid(yxmlfields, propGuid);
                    // 2. delete X
                    var xxmlfield = ptm.ptm_range_X;
                    var newXXmlFields = DeletePropXbyGuid(xxmlfield, propGuid);
                    ptm.ptm_range_Y = newYXmlFields;
                    ptm.ptm_range_X = newXXmlFields;
                    _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                    _db.SaveChanges();
                    //TODO: 3. re-build Matrix
                }
                catch (Exception)
                {
                }
            }
            return returnvalue;
        }

        public PropertyValue AddUpdateOneYItemByXGuid(int ptyId, PropertyYValue propertyName)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                var yRange = ptm.ptm_range_Y;
                var yValues = GetYItems(yRange);
                var xGuid = CheckAndParseGuid(propertyName.PropXGuid).ToString();
                var checkYValue = yValues.FirstOrDefault(m => m.PropGuid == propertyName.PropGuid);
                var yGuid = string.Empty;
                if (checkYValue != null)
                {
                    yGuid = checkYValue.PropGuid;
                    yValues.Remove(checkYValue);
                }
                var newValue = new PropertyYValue
                {
                    PropGuid = CheckAndParseGuid(yGuid).ToString(),
                    PropName = propertyName.PropName,
                    PropDescription = propertyName.PropDescription,
                    PropXGuid = propertyName.PropXGuid
                };
                yValues.Add(newValue);
                var newYRange = YColumnsPropety2XmlStringCreateUpdate(yValues);
                ptm.ptm_range_Y = newYRange;
                _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                _db.SaveChanges();
                return GetProductMatrixByIdGuid(ptyId, xGuid);
            }
            else
            {
                return null;
            }
        }

        public PropertyValue DeleteOneYValue(int ptyId, PropertyYValue propertyName)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                var yRange = ptm.ptm_range_Y;
                var yValues = GetYItems(yRange);
                var xGuid = CheckAndParseGuid(propertyName.PropXGuid).ToString();
                var checkYValue = yValues.FirstOrDefault(m => m.PropGuid == propertyName.PropGuid);
                if (checkYValue != null)
                {
                    yValues.Remove(checkYValue);
                }
                var newYRange = YColumnsPropety2XmlStringCreateUpdate(yValues);
                ptm.ptm_range_Y = newYRange;
                _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                _db.SaveChanges();
                return GetProductMatrixByIdGuid(ptyId, xGuid);
            }
            else
            {
                return null;
            }
        }

        public PropertyValue GetPropXValueById(int ptyId, string xGuid)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                var xRange = ptm.ptm_range_X;
                var xValues = GetXColumn(xRange);
                var oneXValue = xValues.FirstOrDefault(m => m.PropGuid == xGuid);
                return oneXValue;
            }
            else
            {
                return null;
            }
        }

        #region Matrix
        // TODO: 建一个将处理XY成Matrix的function

        public void TreateMatrixForXYZ(int ptyId)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                try
                {
                    // 1. get all Z
                    var zxmlfields = ptm.ptm_range_Z;
                    var zValues = GetXColumn(zxmlfields);
                    // 2. get all Y
                    var yxmlfields = ptm.ptm_range_Y;
                    var yValues = GetYItems(yxmlfields);
                    // 3. get matrix existed
                    var matrixxml = ptm.ptm_matrix;
                    var xGuids = yValues.Select(m => m.PropXGuid).Distinct();
                    List<int> yCountForX = xGuids.Select(xGuid => yValues.Count(m => m.PropXGuid == xGuid)).ToList();
                    int yCollectionCount = yCountForX.Aggregate(1, (current, ycount) => current * (ycount != 0 ? ycount : 1));
                    var matrixValues = GetMatrixValues(yCollectionCount, matrixxml);


                    GetNewMatrixValues(yValues, null);
                    //// 1. delete Y
                    //var newYXmlFields = DeletePropYbyXGuid(yxmlfields, propGuid);
                    //// 2. delete X
                    //var xxmlfield = ptm.ptm_range_X;
                    //var newXXmlFields = DeletePropXbyGuid(xxmlfield, propGuid);
                    //ptm.ptm_range_Y = newYXmlFields;
                    //ptm.ptm_range_X = newXXmlFields;
                    //_db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                    //_db.SaveChanges();
                    //TODO: 3. re-build Matrix
                }
                catch (Exception)
                {
                }
            }
        }

        public List<PropertyMatrix> GetMatrixValues(int yCollectionCount, string xmlFields)
        {
            var listMatrix = new List<PropertyMatrix>();
            if (!string.IsNullOrEmpty(xmlFields))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlFields);
                var nodeList = doc.SelectNodes("PropertyList/Propety");
                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var oneMatrix = new PropertyMatrix();
                        var listYGuids = new List<string>();
                        if (node.Attributes != null)
                        {
                            oneMatrix.PropGuid = node.Attributes["MatrixId"] != null ? node.Attributes["MatrixId"].Value : string.Empty;
                            for (int yindex = 1; yindex < (yCollectionCount + 1); yindex++)
                            {
                                var attrname = string.Format("YId{0}", yindex);
                                if (node.Attributes[attrname] != null)
                                {
                                    string yguid = node.Attributes[attrname].Value;
                                    listYGuids.Add(yguid);
                                }
                            }
                        }
                        oneMatrix.ListYGuids = listYGuids;
                        listMatrix.Add(oneMatrix);
                    }
                }
            }
            return listMatrix;
        }

        public List<PropertyMatrix> GetNewMatrixValues(List<PropertyYValue> yValues, List<PropertyMatrix> oldMatrixValues)
        {
            var xGuidList = new List<string>();
            var xGuid2List = yValues.Select(m => m.PropXGuid).Distinct().ToList();
            var refList = new List<PropertyMatrix>();
            GetMatrixList(yValues, ref xGuidList, ref xGuid2List, ref refList);
            //return refList;
            return null;
        }

        public void GetMatrixList(List<PropertyYValue> yValues, ref List<string> listTreatedXGuid, ref List<string> list2TreatedXGuid, ref List<PropertyMatrix> refList)
        {
            if (list2TreatedXGuid.Any())
            {
                var xGuid2Treate = list2TreatedXGuid.FirstOrDefault();
                var yValueForThisX = yValues.Where(m => m.PropXGuid == xGuid2Treate).Distinct().ToList();
                if (!refList.Any())
                {
                    refList.AddRange(yValueForThisX.Select(yValue => new PropertyMatrix
                    {
                        ListYGuids = new List<string> { yValue.PropGuid }
                    }));
                }
                else
                {
                    var newMatrixList = refList.Select(ObjectCopier.DeepCopy).ToList();
                    var treatedMatrixList = new List<PropertyMatrix>();
                    foreach (var yValue in yValueForThisX)
                    {
                        var copiedList = newMatrixList.Select(ObjectCopier.DeepCopy).ToList();
                        foreach (var propertyMatrix in copiedList)
                        {
                            propertyMatrix.ListYGuids.Add(yValue.PropGuid);
                        }
                        treatedMatrixList.AddRange(copiedList);
                    }
                    refList = treatedMatrixList;

                }
                listTreatedXGuid.Add(xGuid2Treate);
                listTreatedXGuid = listTreatedXGuid.Distinct().ToList();
                list2TreatedXGuid.Remove(xGuid2Treate);
                list2TreatedXGuid = list2TreatedXGuid.Distinct().ToList();
                GetMatrixList(yValues, ref listTreatedXGuid, ref list2TreatedXGuid, ref refList);
            }
        }

        public List<PropertyMatrix> CompareMatrixList(List<PropertyMatrix> newMatrixValues, List<PropertyMatrix> oldMatrixValues)
        {
            var resultList = new List<PropertyMatrix>();

            List<string> yNewValues = new List<string>();
            var allYList = newMatrixValues.Select(m => m.ListYGuids).ToList();
            foreach (var oneYList in allYList)
            {
                yNewValues.AddRange(oneYList);
            }
            yNewValues = yNewValues.Distinct().ToList();

            List<string> yOldValues = new List<string>();
            var allOldYList = oldMatrixValues.Select(m => m.ListYGuids).ToList();
            foreach (var oneYList in allOldYList)
            {
                yOldValues.AddRange(oneYList);
            }
            yOldValues = yOldValues.Distinct().ToList();

            bool isSameY = yNewValues.All(yOldValues.Contains) && yNewValues.Count == yOldValues.Count;
            if (isSameY)
            {
                resultList = oldMatrixValues;
            }
            else
            {
                int newCount = newMatrixValues.Count;
                int oldCount = oldMatrixValues.Count;

                // 新的比老的多，説明由新增項目，新的比老的少，説明項目移除
                var bigList = newCount > oldCount ? newMatrixValues : oldMatrixValues;
                var littleList = !(newCount > oldCount) ? newMatrixValues : oldMatrixValues;

                // 1. 先处理新增项目
                if (newCount > oldCount)
                {
                    var oneOld = oldMatrixValues.FirstOrDefault();
                    bool checkExist = false;
                    foreach (var oneNewValue in newMatrixValues)
                    {
                        //if(oneNewValue.ListYGuids.)
                        foreach (var oneYGuid in oneOld.ListYGuids)
                        {
                            if (oneNewValue.ListYGuids.Contains(oneYGuid))
                            {

                            }
                            else
                            {

                            }
                        }
                    }
                }
                // 2. 再处理移除项目，包括新增相等项目
                else
                {

                }
            }

            //int newCount = newMatrixValues.Count;
            //int oldCount = oldMatrixValues.Count;

            //var bigList = newCount > oldCount ? newMatrixValues : oldMatrixValues;
            //var littleList = !(newCount > oldCount) ? newMatrixValues : oldMatrixValues;

            //foreach (var bigProp in bigList)
            //{
            //    foreach (var litProp in littleList)
            //    {
            //        var bigYList = bigProp.ListYGuids;
            //        var litYList = litProp.ListYGuids;
            //        var firstNotSecond = bigYList.Except(litYList).ToList();
            //        var secondNotFirst = litYList.Except(bigYList).ToList();
            //        if (firstNotSecond.Any() || secondNotFirst.Any())
            //        {

            //        }
            //    }
            //}

            //foreach (var oldValue in oldMatrixValues)
            //{
            //    var oneNewValue = newMatrixValues.Where(m => m.ListYGuids.All(oldValue.ListYGuids.Contains)).ToList();
            //    if (oneNewValue.Any())
            //    {
            //        resultList.Add(oldValue);
            //    }
            //}
            //var restOld = oldMatrixValues.Except(resultList);
            //if (restOld.Any())
            //{
            //}






            return null;
        }

        #endregion Matrix

        public string DeletePropYbyXGuid(string yXmlFields, string xGuid)
        {
            string xmlreturn = yXmlFields;
            if (!string.IsNullOrEmpty(yXmlFields))
            {
                var doc = new XmlDocument();
                doc.LoadXml(yXmlFields);
                var selectstr = string.Format("/PropertyList/Propety[@PropXGuid='{0}']", xGuid);
                try
                {
                    var rvNodes = doc.SelectNodes(selectstr);
                    if (rvNodes != null && rvNodes.Count > 0)
                    {
                        foreach (XmlNode oneNode in rvNodes)
                        {
                            if (oneNode.ParentNode != null)
                            {
                                oneNode.ParentNode.RemoveChild(oneNode);
                            }
                        }
                    }
                    using (var stringWriter = new StringWriter())
                    {
                        using (var xmlTextWriter = XmlWriter.Create(stringWriter))
                        {
                            doc.WriteTo(xmlTextWriter);
                            xmlTextWriter.Flush();
                            xmlreturn = stringWriter.GetStringBuilder().ToString();
                        }
                    }
                }
                catch (Exception)
                {
                }
            }
            return xmlreturn;
        }

        /// <summary>
        /// 删除X或者Z轴值
        /// </summary>
        /// <param name="xXmlFields"></param>
        /// <param name="guid"></param>
        /// <returns></returns>
        public string DeletePropXbyGuid(string xXmlFields, string guid)
        {
            string xmlreturn = xXmlFields;
            if (!string.IsNullOrEmpty(xXmlFields))
            {
                var doc = new XmlDocument();
                doc.LoadXml(xXmlFields);
                var selectstr = string.Format("/PropertyList/Propety[@PropGuid='{0}']", guid);
                try
                {
                    var rvNodes = doc.SelectNodes(selectstr);
                    if (rvNodes != null && rvNodes.Count > 0)
                    {
                        foreach (XmlNode oneNode in rvNodes)
                        {
                            if (oneNode.ParentNode != null)
                            {
                                oneNode.ParentNode.RemoveChild(oneNode);
                            }
                        }
                    }
                    using (var stringWriter = new StringWriter())
                    {
                        using (var xmlTextWriter = XmlWriter.Create(stringWriter))
                        {
                            doc.WriteTo(xmlTextWriter);
                            xmlTextWriter.Flush();
                            xmlreturn = stringWriter.GetStringBuilder().ToString();
                        }
                    }
                }
                catch (Exception)
                {
                }
            }
            return xmlreturn;
        }

        #region Z 轴
        public List<PropertyValue> CreateUpdateZValue(int ptyId, PropertyValue zValue)
        {
            var returnvalue = new List<PropertyValue>();
            if (zValue != null)
            {
                var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
                bool isCreate = false;
                if (ptm != null)
                {
                    // update xml fields
                    var zRange = ptm.ptm_range_Z;
                    var zProp = GetXColumn(zRange);
                    var oneprop = zProp.FirstOrDefault(m => m.PropGuid == zValue.PropGuid);
                    if (oneprop != null)
                    {
                        oneprop.PropName = zValue.PropName;
                        oneprop.PropUnit = zValue.PropUnit;
                        oneprop.PropIsUnitRightSide = zValue.PropIsUnitRightSide;
                        oneprop.PropSubOrder = zValue.PropSubOrder;
                        oneprop.PropType = zValue.PropType;
                        oneprop.PropDescription = zValue.PropDescription;

                        var zXmlString = XColumnsPropety2XmlStringCreateUpdate(zProp);
                        ptm.ptm_range_Z = zXmlString;
                        _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                        _db.SaveChanges();
                        returnvalue = GetXColumn(zXmlString);
                    }
                    else
                    {
                        // add new column
                        zValue.PropGuid = Guid.NewGuid().ToString();
                        zProp.Add(zValue);
                        var zXmlString = XColumnsPropety2XmlStringCreateUpdate(zProp);
                        ptm.ptm_range_Z = zXmlString;
                        _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                        _db.SaveChanges();
                        returnvalue = GetXColumn(zXmlString);
                    }
                }
                else
                {
                    isCreate = true;
                }
                if (isCreate)
                {
                    // create xml fields
                    var listprop = new List<PropertyValue>();
                    listprop.Add(zValue);
                    var zXmlString = XColumnsPropety2XmlStringCreateUpdate(listprop);
                    ptm = new TM_PTM_Product_Type_Matrix
                    {
                        pty_id = ptyId,
                        ptm_range_X = zXmlString
                    };
                    _db.TM_PTM_Product_Type_Matrix.AddObject(ptm);
                    _db.SaveChanges();
                    //zValue.PropGuid = GetXColumn(zXmlString).FirstOrDefault().PropGuid;
                    returnvalue = GetXColumn(zXmlString);
                }
            }
            return returnvalue;
        }

        public bool DeleteZValue(int ptyId, string guid)
        {
            bool returnvalue = false;
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                try
                {
                    // delete Z
                    var xxmlfield = ptm.ptm_range_Z;
                    var newZXmlFields = DeletePropXbyGuid(xxmlfield, guid);
                    ptm.ptm_range_Z = newZXmlFields;
                    _db.TM_PTM_Product_Type_Matrix.ApplyCurrentValues(ptm);
                    _db.SaveChanges();
                    //TODO: 3. re-build Matrix
                    returnvalue = true;
                }
                catch (Exception)
                {
                }
            }
            return returnvalue;
        }

        public List<PropertyValue> GetProductMatrixZPtyId(int ptyId)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                var zRange = GetXColumn(ptm.ptm_range_Z);
                return zRange;
            }
            else
            {
                return null;
            }
        }

        public PropertyValue GetPropZValueById(int ptyId, string xGuid)
        {
            var ptm = _db.TM_PTM_Product_Type_Matrix.FirstOrDefault(m => m.pty_id == ptyId);
            if (ptm != null)
            {
                var zRange = ptm.ptm_range_Z;
                var zValues = GetXColumn(zRange);
                var oneZValue = zValues.FirstOrDefault(m => m.PropGuid == xGuid);

                // todo : test 
                TreateMatrixForXYZ(ptyId);

                return oneZValue;
            }
            else
            {
                return null;
            }
        }

        #endregion Z 轴

        #endregion For Matrix New
    }
}

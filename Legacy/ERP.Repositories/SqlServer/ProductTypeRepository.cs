using System;
using System.Collections.Generic;
using System.Data.OleDb;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Xml;
using ERP.Entities;
using ERP.Repositories.DataBase;
using ERP.Repositories.Extensions;

namespace ERP.Repositories.SqlServer
{
    public partial class ProductTypeRepository : BaseSqlServerRepository
    {
        #region Product type
        public ProductType LoadProduitAttributeById(int ptyId)
        {
            ProductType productType = null;
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId);
            if (pty != null)
            {
                productType = new ProductType
                                  {
                                      PtyId = pty.pty_id,
                                      SocId = pty.soc_id,
                                      PtyName = pty.pty_name,
                                      PtyActived = pty.pty_active,
                                      PtyDescription = pty.pty_description,
                                      PtyStandards = pty.pty_standards,
                                      CorId = pty.cor_id
                                  };
                var xmlfield = pty.pty_specifications_fields;
                var propNames = GetPropertyValueListFromXml(xmlfield);
                propNames = propNames.OrderBy(m => m.PropSubOrder).ThenBy(m => m.PropParentOrder).ThenBy(m => m.PropOrder).ToList();
                productType.PropertyNames = propNames;
            }
            return productType;
        }

        public static List<PropertyValue> GetPropertyValueListFromXml(string xmlfield)
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
                            oneProp.PropValue = node.Attributes["PropValue"] != null ? node.Attributes["PropValue"].Value : string.Empty;
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
                            oneProp.PropIsSameValue = node.Attributes["PropIsSameValue"] != null && Convert.ToBoolean(node.Attributes["PropIsSameValue"].Value);
                            oneProp.PropIsNullable = node.Attributes["PropIsNullable"] != null && Convert.ToBoolean(node.Attributes["PropIsNullable"].Value);
                            oneProp.PropIsSearchField = node.Attributes["PropIsSearchField"] != null && Convert.ToBoolean(node.Attributes["PropIsSearchField"].Value);
                            oneProp.PropIsForPrice = node.Attributes["PropIsForPrice"] != null && Convert.ToBoolean(node.Attributes["PropIsForPrice"].Value);
                        }
                        propNames.Add(oneProp);
                    }
                }
            }
            return propNames;
        }

        public List<ProductType> SearchProductTypes(ProductType prdType)
        {
            var prdtp = _db.TM_PTY_Product_Type.Where(m =>
                m.soc_id == prdType.SocId
                &&
                (string.IsNullOrEmpty(prdType.PtyName) || m.pty_name.StartsWith(prdType.PtyName))
                &&
                (string.IsNullOrEmpty(prdType.PtyDescription) || m.pty_description.Contains(prdType.PtyDescription))
                ).Distinct().Select(m => new ProductType
                {
                    PtyId = m.pty_id,
                    SocId = m.soc_id,
                    PtyName = m.pty_name,
                    PtyDescription = m.pty_description,
                    PtyActived = m.pty_active,
                    CorId = m.cor_id
                }).OrderBy(l => l.PtyName).ToList();
            foreach (var item in prdtp)
            {
                item.FId = StringCipher.EncoderSimple(item.PtyId.ToString(), "ptyId");
            }
            return prdtp;
        }

        public int CreateUpdateProductType(ProductType oneProductType)
        {
            bool create = false;
            int ptyId = 0;
            if (oneProductType.PtyId != 0)
            {
                var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == oneProductType.PtyId);
                if (pty != null)
                {
                    pty.pty_name = oneProductType.PtyName;
                    pty.pty_description = oneProductType.PtyDescription;
                    pty.pty_active = oneProductType.PtyActived;
                    pty.cor_id = oneProductType.CorId != 0 ? oneProductType.CorId : null;
                    pty.pty_standards = oneProductType.PtyStandards;
                    // update xml fields
                    var propnames = oneProductType.PropertyNames;
                    propnames = SortPropertyValues(propnames, ptyId);
                    string xml = Propety2XmlString(propnames);
                    pty.pty_specifications_fields = xml;
                    _db.TM_PTY_Product_Type.ApplyCurrentValues(pty);
                    _db.SaveChanges();
                    ptyId = pty.pty_id;
                }
                else
                {
                    create = true;
                }
            }
            else
            {
                create = true;
            }
            if (create)
            {
                var newPty = new TM_PTY_Product_Type
                {
                    pty_name = oneProductType.PtyName,
                    pty_description = oneProductType.PtyDescription,
                    soc_id = oneProductType.SocId,
                    pty_active = oneProductType.PtyActived,
                    pty_standards = oneProductType.PtyStandards,
                    cor_id = oneProductType.CorId != 0 ? oneProductType.CorId : null
                };
                _db.TM_PTY_Product_Type.AddObject(newPty);
                _db.SaveChanges();
                ptyId = newPty.pty_id;
                var propnames = oneProductType.PropertyNames;
                propnames = SortPropertyValues(propnames, ptyId);
                // create xml fields
                try
                {
                    string xml = Propety2XmlString(propnames);
                    newPty.pty_specifications_fields = xml;
                    _db.TM_PTY_Product_Type.ApplyCurrentValues(newPty);
                    _db.SaveChanges();
                }
                catch (Exception)
                {
                    // ignored
                }
            }
            // for matrix
            try
            {
                CreateUpdateProductTypeMatrix(ptyId, oneProductType.PropertyXNames, oneProductType.PropertyYNames);
            }
            catch (Exception)
            {
                // ignored
            }
            return ptyId;
        }

        public bool DeleteOneProperty(int ptyId, string propGuid)
        {
            bool returnvalue = false;
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId);
            if (pty != null)
            {
                var xmlfield = pty.pty_specifications_fields;
                if (!string.IsNullOrEmpty(xmlfield))
                {
                    var doc = new XmlDocument();
                    doc.LoadXml(xmlfield);
                    var selectstr = string.Format("/PropertyList/Propety[@PropGuid='{0}']", propGuid);
                    try
                    {
                        var oneNode = doc.SelectSingleNode(selectstr);
                        if (oneNode != null)
                        {
                            if (oneNode.ParentNode != null)
                            {
                                oneNode.ParentNode.RemoveChild(oneNode);
                            }
                        }

                        using (var stringWriter = new StringWriter())
                        {
                            using (var xmlTextWriter = XmlWriter.Create(stringWriter))
                            {
                                doc.WriteTo(xmlTextWriter);
                                xmlTextWriter.Flush();
                                pty.pty_specifications_fields = stringWriter.GetStringBuilder().ToString();
                            }
                        }
                        _db.TM_PTY_Product_Type.ApplyCurrentValues(pty);
                        _db.SaveChanges();
                        returnvalue = true;
                    }
                    catch (Exception)
                    {
                        // ignored
                    }
                }
            }
            return returnvalue;
        }

        private List<PropertyValue> SortPropertyValues(List<PropertyValue> values, int ptyId)
        {
            if (values.Any())
            {
                var order0 = values.Where(m => m.PropOrder == 0);
                var orderNot0 = values.Where(m => m.PropOrder != 0);
                var oneqty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId);
                var lastOrder = 0;
                if (oneqty != null)
                {
                    var propxml = oneqty.pty_specifications_fields;
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
                foreach (var propertyValue in order0)
                {
                    propertyValue.PropOrder = lastOrder;
                    if (propertyValue.PropParentOrder == 0)
                    {
                        propertyValue.PropParentOrder = propertyValue.PropOrder;
                    }
                    lastOrder++;
                }

                foreach (var propertyValue in orderNot0)
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

        private List<PropertyValue> SortPropertyValues_old(List<PropertyValue> values, int ptyId)
        {
            var order_0 = values.Where(m => m.PropOrder == 0);
            var order_not_0 = values.Where(m => m.PropOrder != 0);
            var oneqty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId);
            var lastOrder = 0;
            if (oneqty != null)
            {
                var propxml = oneqty.pty_specifications_fields;
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
                lastOrder++;
            }

            return values;
        }

        private static string Propety2XmlString(List<PropertyValue> propertyNames)
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
                        //propName.SetAttribute("PropGuid", Guid.NewGuid().ToString());
                        propName.SetAttribute("PropGuid", CheckAndParseGuid(propertyValue.PropGuid).ToString());
                        propName.SetAttribute("PropName", propertyValue.PropName);
                        propName.SetAttribute("PropValue", propertyValue.PropValue);
                        propName.SetAttribute("PropType", propertyValue.PropType);
                        propName.SetAttribute("PropUnit", propertyValue.PropUnit);
                        propName.SetAttribute("PropDescription", propertyValue.PropDescription);
                        propName.SetAttribute("PropOrder", propertyValue.PropOrder.ToString());
                        propName.SetAttribute("PropParentOrder", propertyValue.PropParentOrder.ToString());
                        propName.SetAttribute("PropSubOrder", propertyValue.PropSubOrder.ToString(CultureInfo.InvariantCulture));
                        propName.SetAttribute("PropIsTitle", propertyValue.PropIsTitle.ToString());
                        propName.SetAttribute("PropIsInTechReport", propertyValue.PropIsInTechReport.ToString());
                        propName.SetAttribute("PropIsImage", propertyValue.PropIsImage.ToString());
                        propName.SetAttribute("PropIsUnitRightSide", propertyValue.PropIsUnitRightSide.ToString());
                        propName.SetAttribute("PropIsSameValue", propertyValue.PropIsSameValue.ToString());
                        propName.SetAttribute("PropIsNullable", (propertyValue.PropIsNullable).ToString());
                        propName.SetAttribute("PropIsSearchField", propertyValue.PropIsSearchField.ToString());
                        propName.SetAttribute("PropIsForPrice", propertyValue.PropIsForPrice.ToString());
                        root.AppendChild(propName);
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        /// <summary>
        /// for product page
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="selectedType"></param>
        /// <returns></returns>
        public List<KeyValue> GetProductTypesBySocId(int socId, int selectedType)
        {
            var prdtp = _db.TM_PTY_Product_Type.Where(m =>
                m.soc_id == socId
                && (m.pty_id == selectedType || m.pty_active)).Distinct().Select(m => new KeyValue
                {
                    Key = m.pty_id,
                    Value = m.pty_name
                }).OrderBy(l => l.Value).ToList();
            return prdtp;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="ptyId"></param>
        /// <returns>-1 : error; 0 : in use; 1 : delete OK</returns>
        public int DeleteAttribute(int ptyId)
        {
            int returnvalue = -1;
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId);
            if (pty != null)
            {
                var inuse = _db.TM_PRD_Product.Any(m => m.pty_id == ptyId);
                if (inuse)
                {
                    returnvalue = 0;
                }
                else
                {
                    try
                    {
                        var ptms = _db.TM_PTM_Product_Type_Matrix.Where(m => m.pty_id == ptyId);

                        foreach (var oneptm in ptms)
                        {
                            _db.TM_PTM_Product_Type_Matrix.DeleteObject(oneptm);
                        }
                        _db.SaveChanges();
                        _db.TM_PTY_Product_Type.DeleteObject(pty);
                        _db.SaveChanges();
                        returnvalue = 1;
                    }
                    catch (Exception)
                    {
                        // ignored
                    }
                }
            }
            return returnvalue;
        }

        public int DuplicateProductType(int ptyId, int socId, string ptyName)
        {
            int pty_id = 0;
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId && m.soc_id == socId);
            if (pty != null)
            {
                var newpty = CopyEntity(_db, pty);
                if (!string.IsNullOrEmpty(ptyName))
                {
                    newpty.pty_name = ptyName;
                }
                var xmlfield = pty.pty_specifications_fields;
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
                                oneProp.PropGuid = Guid.NewGuid().ToString();
                                oneProp.PropName = node.Attributes["PropName"] != null ? node.Attributes["PropName"].Value : string.Empty;
                                oneProp.PropValue = node.Attributes["PropValue"] != null ? node.Attributes["PropValue"].Value : string.Empty;
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
                                oneProp.PropIsSameValue = node.Attributes["PropIsSameValue"] != null && Convert.ToBoolean(node.Attributes["PropIsSameValue"].Value);
                                oneProp.PropIsNullable = node.Attributes["PropIsNullable"] != null && Convert.ToBoolean(node.Attributes["PropIsNullable"].Value);
                                oneProp.PropIsSearchField = node.Attributes["PropIsSearchField"] != null && Convert.ToBoolean(node.Attributes["PropIsSearchField"].Value);
                                oneProp.PropIsForPrice = node.Attributes["PropIsForPrice"] != null && Convert.ToBoolean(node.Attributes["PropIsForPrice"].Value);
                            }
                            propNames.Add(oneProp);
                        }
                    }
                }
                var newXmlField = Propety2XmlString(propNames);
                newpty.pty_specifications_fields = newXmlField;
                _db.TM_PTY_Product_Type.AddObject(newpty);
                _db.SaveChanges();
                pty_id = newpty.pty_id;
            }
            return pty_id;
        }

        #region for searching product

        public List<PropertyValue> GetPtySearchFields(int ptyId, int socId)
        {
            var resultList = new List<PropertyValue>();
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.soc_id == socId && m.pty_id == ptyId);
            if (pty != null)
            {
                var xmlFields = pty.pty_specifications_fields;
                resultList = GetPropertyValueListFromXml(xmlFields).Where(m => m.PropIsSearchField).ToList();
            }
            return resultList;
        }

        #endregion for searching product


        #endregion Product type
    }
}

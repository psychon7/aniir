using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml;
using ERP.Entities;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer
{
    /// <summary>
    /// Repository for ProductInstance (TM_PIT_Product_Instance) operations
    /// </summary>
    public class ProductInstanceRepository : BaseSqlServerRepository
    {
        #region Read Operations

        /// <summary>
        /// Get all product instances for a society
        /// </summary>
        /// <param name="socId">Society ID</param>
        /// <returns>List of product instances</returns>
        public List<ProductInstance> GetAllProductInstances(int socId)
        {
            var instances = _db.TM_PIT_Product_Instance
                .Where(m => m.TM_PRD_Product.soc_id == socId)
                .Select(m => new ProductInstance
                {
                    PitId = m.pit_id,
                    PrdId = m.prd_id,
                    PtyId = m.pty_id,
                    PitRef = m.pit_ref,
                    PitDescription = m.pit_description,
                    PitPrice = m.pit_price,
                    PitPurchasePrice = m.pit_purchase_price,
                    PitPrdInfo = m.pit_prd_info,
                    PitInventoryThreshold = m.pit_inventory_threshold,
                    PitTmpRef = m.pit_tmp_ref,
                    PrdName = m.TM_PRD_Product.prd_name,
                    PrdRef = m.TM_PRD_Product.prd_ref,
                    ProductType = m.TM_PTY_Product_Type.pty_name
                })
                .OrderBy(m => m.PrdName)
                .ThenBy(m => m.PitRef)
                .ToList();

            instances.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId"); });
            return instances;
        }

        /// <summary>
        /// Get all product instances for a specific product
        /// </summary>
        /// <param name="prdId">Product ID</param>
        /// <param name="socId">Society ID</param>
        /// <returns>List of product instances</returns>
        public List<ProductInstance> GetProductInstancesByProductId(int prdId, int socId)
        {
            var product = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
            if (product == null)
            {
                return new List<ProductInstance>();
            }

            var instances = _db.TM_PIT_Product_Instance
                .Where(m => m.prd_id == prdId)
                .Select(m => new ProductInstance
                {
                    PitId = m.pit_id,
                    PrdId = m.prd_id,
                    PtyId = m.pty_id,
                    PitRef = m.pit_ref,
                    PitDescription = m.pit_description,
                    PitPrice = m.pit_price,
                    PitPurchasePrice = m.pit_purchase_price,
                    PitPrdInfo = m.pit_prd_info,
                    PitInventoryThreshold = m.pit_inventory_threshold,
                    PitTmpRef = m.pit_tmp_ref,
                    PrdName = m.TM_PRD_Product.prd_name,
                    PrdRef = m.TM_PRD_Product.prd_ref,
                    ProductType = m.TM_PTY_Product_Type.pty_name
                })
                .OrderBy(m => m.PitRef)
                .ToList();

            // Parse XML properties for each instance
            var ptyPropValues = GetPtyPropertyValues(product.pty_id, socId);
            foreach (var instance in instances)
            {
                instance.FId = StringCipher.EncoderSimple(instance.PitId.ToString(), "pitId");
                instance.PitAllInfo = GetPropertyValuesFromXml(instance.PitPrdInfo, ptyPropValues);
            }

            return instances;
        }

        /// <summary>
        /// Get a single product instance by ID
        /// </summary>
        /// <param name="pitId">Product Instance ID</param>
        /// <param name="socId">Society ID</param>
        /// <returns>ProductInstance entity or null</returns>
        public ProductInstance GetProductInstanceById(int pitId, int socId)
        {
            var instance = _db.TM_PIT_Product_Instance
                .Where(m => m.pit_id == pitId && m.TM_PRD_Product.soc_id == socId)
                .Select(m => new ProductInstance
                {
                    PitId = m.pit_id,
                    PrdId = m.prd_id,
                    PtyId = m.pty_id,
                    PitRef = m.pit_ref,
                    PitDescription = m.pit_description,
                    PitPrice = m.pit_price,
                    PitPurchasePrice = m.pit_purchase_price,
                    PitPrdInfo = m.pit_prd_info,
                    PitInventoryThreshold = m.pit_inventory_threshold,
                    PitTmpRef = m.pit_tmp_ref,
                    PrdName = m.TM_PRD_Product.prd_name,
                    PrdRef = m.TM_PRD_Product.prd_ref,
                    PrdSubName = m.TM_PRD_Product.prd_sub_name,
                    PrdDescription = m.TM_PRD_Product.prd_description,
                    PrdCode = m.TM_PRD_Product.prd_code,
                    ProductType = m.TM_PTY_Product_Type.pty_name,
                    PrdOutsideDiameter = m.TM_PRD_Product.prd_outside_diameter,
                    PrdLength = m.TM_PRD_Product.prd_length,
                    PrdWidth = m.TM_PRD_Product.prd_width,
                    PrdHeight = m.TM_PRD_Product.prd_height
                })
                .FirstOrDefault();

            if (instance != null)
            {
                instance.FId = StringCipher.EncoderSimple(instance.PitId.ToString(), "pitId");
                var ptyPropValues = GetPtyPropertyValues(instance.PtyId, socId);
                instance.PitAllInfo = GetPropertyValuesFromXml(instance.PitPrdInfo, ptyPropValues);

                // Get images
                instance.PitImages = _db.TI_PTI_Product_Instance_Image
                    .Where(m => m.pit_id == pitId)
                    .OrderBy(m => m.pti_order)
                    .Select(m => new KeyValue
                    {
                        Key = m.pti_id,
                        Value = m.pti_path,
                        Value2 = m.pti_description
                    })
                    .ToList();

                var defaultImage = instance.PitImages.FirstOrDefault();
                instance.PitDefaultImage = defaultImage != null ? defaultImage.Value : string.Empty;
            }

            return instance;
        }

        /// <summary>
        /// Search product instances by reference
        /// </summary>
        /// <param name="pitRef">Reference to search</param>
        /// <param name="socId">Society ID</param>
        /// <returns>List of matching product instances</returns>
        public List<ProductInstance> SearchProductInstancesByRef(string pitRef, int socId)
        {
            var instances = _db.TM_PIT_Product_Instance
                .Where(m => m.TM_PRD_Product.soc_id == socId &&
                    (string.IsNullOrEmpty(pitRef) ||
                     m.pit_ref.Contains(pitRef) ||
                     m.pit_tmp_ref.Contains(pitRef)))
                .Select(m => new ProductInstance
                {
                    PitId = m.pit_id,
                    PrdId = m.prd_id,
                    PtyId = m.pty_id,
                    PitRef = m.pit_ref,
                    PitDescription = m.pit_description,
                    PitPrice = m.pit_price,
                    PitPurchasePrice = m.pit_purchase_price,
                    PitInventoryThreshold = m.pit_inventory_threshold,
                    PitTmpRef = m.pit_tmp_ref,
                    PrdName = m.TM_PRD_Product.prd_name,
                    PrdRef = m.TM_PRD_Product.prd_ref,
                    ProductType = m.TM_PTY_Product_Type.pty_name
                })
                .OrderBy(m => m.PitRef)
                .ToList();

            instances.ForEach(m => { m.FId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId"); });
            return instances;
        }

        /// <summary>
        /// Get product instances as lookup for dropdowns
        /// </summary>
        /// <param name="prdId">Product ID</param>
        /// <param name="socId">Society ID</param>
        /// <returns>List of KeyValue for dropdown</returns>
        public List<KeyValue> GetProductInstancesLookup(int prdId, int socId)
        {
            var instances = _db.TM_PIT_Product_Instance
                .Where(m => m.prd_id == prdId && m.TM_PRD_Product.soc_id == socId)
                .Select(m => new KeyValue
                {
                    Key = m.pit_id,
                    Value = m.pit_ref,
                    Value2 = m.pit_description,
                    DcValue = m.pit_price
                })
                .OrderBy(m => m.Value)
                .ToList();
            return instances;
        }

        #endregion

        #region Create/Update Operations

        /// <summary>
        /// Create or update a product instance
        /// </summary>
        /// <param name="productInstance">ProductInstance entity</param>
        /// <param name="socId">Society ID</param>
        /// <returns>Product Instance ID</returns>
        public int CreateUpdateProductInstance(ProductInstance productInstance, int socId)
        {
            int pitId = 0;

            // Verify product belongs to society
            var product = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == productInstance.PrdId && m.soc_id == socId);
            if (product == null)
            {
                return 0;
            }

            if (productInstance.PitId != 0)
            {
                // Update existing instance
                var existingInstance = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == productInstance.PitId);
                if (existingInstance != null)
                {
                    existingInstance.pit_ref = productInstance.PitRef;
                    existingInstance.pit_description = productInstance.PitDescription;
                    existingInstance.pit_price = productInstance.PitPrice;
                    existingInstance.pit_purchase_price = productInstance.PitPurchasePrice;
                    existingInstance.pit_inventory_threshold = productInstance.PitInventoryThreshold;
                    existingInstance.pit_tmp_ref = productInstance.PitTmpRef;
                    existingInstance.pty_id = productInstance.PtyId != 0 ? productInstance.PtyId : product.pty_id;

                    // Generate XML for additional properties
                    if (productInstance.PitAllInfo != null && productInstance.PitAllInfo.Any())
                    {
                        existingInstance.pit_prd_info = GenerateXmlFieldForProductInstance(productInstance.PitAllInfo);
                    }

                    _db.TM_PIT_Product_Instance.ApplyCurrentValues(existingInstance);
                    _db.SaveChanges();
                    pitId = existingInstance.pit_id;
                }
            }
            else
            {
                // Create new instance
                var newInstance = new TM_PIT_Product_Instance
                {
                    prd_id = productInstance.PrdId,
                    pty_id = productInstance.PtyId != 0 ? productInstance.PtyId : product.pty_id,
                    pit_ref = productInstance.PitRef,
                    pit_description = productInstance.PitDescription,
                    pit_price = productInstance.PitPrice,
                    pit_purchase_price = productInstance.PitPurchasePrice,
                    pit_inventory_threshold = productInstance.PitInventoryThreshold,
                    pit_tmp_ref = productInstance.PitTmpRef
                };

                // Generate XML for additional properties
                if (productInstance.PitAllInfo != null && productInstance.PitAllInfo.Any())
                {
                    newInstance.pit_prd_info = GenerateXmlFieldForProductInstance(productInstance.PitAllInfo);
                }

                _db.TM_PIT_Product_Instance.AddObject(newInstance);
                _db.SaveChanges();
                pitId = newInstance.pit_id;
            }

            return pitId;
        }

        /// <summary>
        /// Update product instance prices
        /// </summary>
        /// <param name="pitId">Product Instance ID</param>
        /// <param name="price">Sale price</param>
        /// <param name="purchasePrice">Purchase price</param>
        /// <param name="socId">Society ID</param>
        /// <returns>True if updated</returns>
        public bool UpdateProductInstancePrices(int pitId, decimal? price, decimal? purchasePrice, int socId)
        {
            var instance = _db.TM_PIT_Product_Instance
                .FirstOrDefault(m => m.pit_id == pitId && m.TM_PRD_Product.soc_id == socId);

            if (instance != null)
            {
                instance.pit_price = price;
                instance.pit_purchase_price = purchasePrice;
                _db.TM_PIT_Product_Instance.ApplyCurrentValues(instance);
                _db.SaveChanges();
                return true;
            }

            return false;
        }

        /// <summary>
        /// Update product instance inventory threshold
        /// </summary>
        /// <param name="pitId">Product Instance ID</param>
        /// <param name="threshold">Inventory threshold</param>
        /// <param name="socId">Society ID</param>
        /// <returns>True if updated</returns>
        public bool UpdateInventoryThreshold(int pitId, int threshold, int socId)
        {
            var instance = _db.TM_PIT_Product_Instance
                .FirstOrDefault(m => m.pit_id == pitId && m.TM_PRD_Product.soc_id == socId);

            if (instance != null)
            {
                instance.pit_inventory_threshold = threshold;
                _db.TM_PIT_Product_Instance.ApplyCurrentValues(instance);
                _db.SaveChanges();
                return true;
            }

            return false;
        }

        #endregion

        #region Delete Operations

        /// <summary>
        /// Delete a product instance
        /// </summary>
        /// <param name="pitId">Product Instance ID</param>
        /// <param name="socId">Society ID</param>
        /// <returns>True if deleted, false otherwise</returns>
        public bool DeleteProductInstance(int pitId, int socId)
        {
            bool deleted = false;
            var instance = _db.TM_PIT_Product_Instance
                .FirstOrDefault(m => m.pit_id == pitId && m.TM_PRD_Product.soc_id == socId);

            if (instance != null)
            {
                // Check if instance is used in orders, invoices, etc.
                var inUseInInvoices = _db.TM_CII_ClientInvoice_Line.Any(m => m.pit_id == pitId);
                var inUseInOrders = _db.TM_COL_ClientOrder_Line.Any(m => m.pit_id == pitId);

                if (!inUseInInvoices && !inUseInOrders)
                {
                    // Delete associated images
                    var images = _db.TI_PTI_Product_Instance_Image.Where(m => m.pit_id == pitId).ToList();
                    foreach (var image in images)
                    {
                        _db.TI_PTI_Product_Instance_Image.DeleteObject(image);
                    }

                    // Delete the instance
                    _db.TM_PIT_Product_Instance.DeleteObject(instance);
                    _db.SaveChanges();
                    deleted = true;
                }
            }

            return deleted;
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// Get property type property values for a product type
        /// </summary>
        private List<PropertyValue> GetPtyPropertyValues(int ptyId, int socId)
        {
            var propNames = new List<PropertyValue>();
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId);

            if (pty != null && !string.IsNullOrEmpty(pty.pty_specifications_fields))
            {
                propNames = GetPropertyValueListFromXml(pty.pty_specifications_fields);
            }

            return propNames;
        }

        /// <summary>
        /// Get property values from XML field
        /// </summary>
        private List<PropertyValue> GetPropertyValuesFromXml(string xmlField, List<PropertyValue> ptyPropValues)
        {
            var result = new List<PropertyValue>();

            if (string.IsNullOrEmpty(xmlField))
            {
                return result;
            }

            try
            {
                var doc = new XmlDocument();
                doc.LoadXml(xmlField);
                var nodeList = doc.SelectNodes("PropertyList/Propety");

                if (nodeList != null)
                {
                    foreach (XmlNode node in nodeList)
                    {
                        var propGuid = node.Attributes["PropGuid"]?.Value;
                        var propValue = node.Attributes["PropValue"]?.Value;

                        // Find matching property definition
                        var ptyProp = ptyPropValues.FirstOrDefault(m => m.PropGuid == propGuid);

                        var oneProp = new PropertyValue
                        {
                            PropGuid = propGuid,
                            PropName = ptyProp?.PropName ?? node.Attributes["PropName"]?.Value,
                            PropValue = propValue,
                            PropType = ptyProp?.PropType ?? node.Attributes["PropType"]?.Value,
                            PropOrder = Convert.ToInt32(node.Attributes["PropOrder"]?.Value ?? "0")
                        };
                        result.Add(oneProp);
                    }
                }
            }
            catch (Exception)
            {
                // Log error if needed
            }

            return result.OrderBy(m => m.PropOrder).ToList();
        }

        /// <summary>
        /// Get property value list from XML string
        /// </summary>
        private static List<PropertyValue> GetPropertyValueListFromXml(string xmlField)
        {
            var propNames = new List<PropertyValue>();

            if (!string.IsNullOrEmpty(xmlField))
            {
                try
                {
                    var doc = new XmlDocument();
                    doc.LoadXml(xmlField);
                    var nodeList = doc.SelectNodes("PropertyList/Propety");

                    if (nodeList != null)
                    {
                        foreach (XmlNode node in nodeList)
                        {
                            var oneProp = new PropertyValue
                            {
                                PropGuid = node.Attributes["PropGuid"]?.Value,
                                PropName = node.Attributes["PropName"]?.Value,
                                PropValue = node.Attributes["PropValue"]?.Value,
                                PropType = node.Attributes["PropType"]?.Value,
                                PropOrder = Convert.ToInt32(node.Attributes["PropOrder"]?.Value ?? "0")
                            };
                            propNames.Add(oneProp);
                        }
                    }
                }
                catch (Exception)
                {
                    // Log error if needed
                }
            }

            return propNames;
        }

        /// <summary>
        /// Generate XML field for product instance properties
        /// </summary>
        private string GenerateXmlFieldForProductInstance(List<PropertyValue> properties)
        {
            if (properties == null || !properties.Any())
            {
                return string.Empty;
            }

            var sb = new StringBuilder();
            sb.Append("<PropertyList>");

            foreach (var prop in properties)
            {
                sb.AppendFormat(
                    "<Propety PropGuid=\"{0}\" PropName=\"{1}\" PropValue=\"{2}\" PropType=\"{3}\" PropOrder=\"{4}\" />",
                    prop.PropGuid ?? string.Empty,
                    System.Security.SecurityElement.Escape(prop.PropName ?? string.Empty),
                    System.Security.SecurityElement.Escape(prop.PropValue ?? string.Empty),
                    prop.PropType ?? string.Empty,
                    prop.PropOrder
                );
            }

            sb.Append("</PropertyList>");
            return sb.ToString();
        }

        #endregion
    }
}

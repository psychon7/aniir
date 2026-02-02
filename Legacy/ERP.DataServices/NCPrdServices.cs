using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Xml;
using System.Xml.Linq;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories;
using ERP.Repositories.Extensions;

namespace ERP.DataServices
{
    public class NCPrdServices : BaseSqlServerRepository
    {
        /// <summary>
        /// 获取每个类别的产品数量
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> LoadProductById()
        {
            List<KeyValue> reKeyValues = new List<KeyValue>();
            var key = _db.TR_PCA_Product_Category.Count();

            KeyValue result = new KeyValue();


            return reKeyValues;
        }


        /// <summary>
        /// 得到所有商品的明细信息，用于商品页左侧的查询  tanzixiong-作用NC2021网页
        /// </summary>
        /// <returns></returns>
        // public List<Product> LoadAllProduct()
        public List<KeyValue> GetAllKeyValues()
        {
            var prdS = _db.TM_PRD_Product.Select(prd => new Product

            {
                SocId = prd.soc_id,
                PtyId = prd.pty_id,
                PrdDescription = prd.prd_description,
                PrdId = prd.prd_id,
                PrdName = prd.prd_name,
                PrdSubName = prd.prd_sub_name,
                PrdPrice = prd.prd_price,
                PrdRef = prd.prd_ref,
                PrdPurchasePrice = prd.prd_purchase_price,
                PrdFileName = prd.prd_file_name,
                PrdCode = prd.prd_code,
                //PrdInsideDiameter = prd.prd_inside_diameter,
                PrdOutsideDiameter = prd.prd_outside_diameter,
                PrdLength = prd.prd_length,
                PrdWidth = prd.prd_width,
                PrdHeight = prd.prd_height,
                PrdHoleSize = prd.prd_hole_size,
                PrdDepth = prd.prd_depth,
                PrdWeight = prd.prd_weight,
                PrdUnitLength = prd.prd_unit_length,
                PrdUnitWidth = prd.prd_unit_width,
                PrdUnitHeight = prd.prd_unit_height,
                PrdUnitWeight = prd.prd_unit_weight,
                PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                PrdCartonLength = prd.prd_carton_length,
                PrdCartonWidth = prd.prd_carton_width,
                PrdCartonHeight = prd.prd_carton_height,
                PrdCartonWeight = prd.prd_carton_weight,
                PtyStandards = prd.TM_PTY_Product_Type.pty_standards,
                PrdSepcifications = prd.prd_specifications,
                PrdOutsideHeight = prd.prd_outside_height,
                PrdOutsideLength = prd.prd_outside_length,
                PrdOutsideWidth = prd.prd_outside_width,
                PrdHoleLength = prd.prd_hole_lenght,
                PrdHoleWidth = prd.prd_hole_width,
                ProductType = prd.TM_PTY_Product_Type.pty_name,
            }).ToList();

            //这里取出属性
            var strCouleur = "";
            var strPuissance = "";
            var strDriver = "";
            foreach (var oneprd in prdS)
            {

                oneprd.PrdGeneralInfoList = GetGeneralPropertyValuesFormXml(oneprd.PtyId, oneprd.SocId,
                    oneprd.PrdSepcifications,
                    true);
                oneprd.InstanceList = GetProductInstances(oneprd.PrdId, oneprd.PtyId, oneprd.SocId);


                //oneprd.EntityColor = (from pty in _db.TM_PTY_Product_Type
                //                      join cor in _db.TR_COR_Color on pty.cor_id equals cor.cor_id
                //                      where pty.pty_id == oneprd.PrdId
                //                      select cor).Select(m => new EntityColor
                //    {
                //        Id = m.cor_id,
                //        SocId = m.soc_id,
                //        CorRed = m.cor_red,
                //        CorBlue = m.cor_blue,
                //        CorGreen = m.cor_green,
                //        CorName = m.cor_name,
                //        CorDescription = m.cor_description
                //    }).FirstOrDefault();
                oneprd.FId = StringCipher.EncoderSimple(oneprd.PrdId.ToString(), "prdId");

                //COULEUR
                foreach (var oneInfo in oneprd.PrdGeneralInfoList)
                {
                    if (oneInfo.PropName == "Couleur" && oneInfo.PropValue != "") strCouleur += oneInfo.PropValue + "/";
                    if (oneInfo.PropName == "Puissance" && oneInfo.PropValue != "") strPuissance += oneInfo.PropValue + "/";
                }
                //Driver
                foreach (var oneIns in oneprd.InstanceList)
                {
                    foreach (var onePit in oneIns.PitAllInfo)
                    {
                        if (onePit.PropName == "Opération" && onePit.PropValue != "") strDriver += onePit.PropValue + "/";
                    }
                }
            }
            //处理属性，得出Name与Count
            var newstrCouleur = strCouleur.Split('/');
            var newstrPuissance = strPuissance.Split('/');
            var newstrDriver = strDriver.Split('/');
            var resultList = new List<KeyValue>();
            List<KeyValue> couleurkeyList = new List<KeyValue>();
            //Couleur
            foreach (var onecou in newstrCouleur)
            {
                var onekey = new KeyValue();
                onekey.Value = onecou;
                couleurkeyList.Add(onekey);

            }
            var newCouleurList = couleurkeyList.GroupBy(l => l.Value);
            foreach (var onekey in newCouleurList)
            {
                var couleurkey = new KeyValue();
                couleurkey.Value = onekey.Key;
                couleurkey.Key = onekey.Count();
                couleurkey.Value2 = "Couleur";
                resultList.Add(couleurkey);
            }
            //Puissance
            var puissanceKeyList = new List<KeyValue>();
            foreach (var onepui in newstrPuissance)
            {
                var puiKey = new KeyValue();
                puiKey.Value = onepui;
                puissanceKeyList.Add(puiKey);
            }
            var newpuissanceKeyList = puissanceKeyList.GroupBy(l => l.Value);
            foreach (var onepuiKey in newpuissanceKeyList)
            {
                var puikey = new KeyValue();
                puikey.Value = onepuiKey.Key;
                puikey.Key = onepuiKey.Count();
                puikey.Value2 = "Puissance";
                resultList.Add(puikey);
            }
            //Driver
            var driverKeyList = new List<KeyValue>();
            foreach (var oneDriver in newstrDriver)
            {
                var driverKey = new KeyValue();
                driverKey.Value = oneDriver;
                driverKeyList.Add(driverKey);
            }
            var newdriverKeyList = driverKeyList.GroupBy(l => l.Value);
            foreach (var onedriverKey in newdriverKeyList)
            {
                var driverkey = new KeyValue();
                driverkey.Value = onedriverKey.Key;
                driverkey.Key = onedriverKey.Count();
                driverkey.Value2 = "Driver";
                resultList.Add(driverkey);
            }

            //汇总
            var newResult = resultList.GroupBy(l => l.Value);
            var result = new List<KeyValue>();
            foreach (var newRe in newResult)
            {
                var key = new KeyValue();
                key.Value = newRe.Key;
                key.Key = newRe.Sum(l => l.Key);
                key.Value2 = newRe.Max(l => l.Value2);
                result.Add(key);
            }

            return result;

        }


        public Product LoadProductById(int prdId, int socId)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
            if (prd != null)
            {
                var onePrd = new Product
                {
                    SocId = prd.soc_id,
                    PtyId = prd.pty_id,
                    PrdDescription = prd.prd_description,
                    PrdId = prd.prd_id,
                    PrdName = prd.prd_name,
                    PrdSubName = prd.prd_sub_name,
                    PrdPrice = prd.prd_price,
                    PrdRef = prd.prd_ref,
                    PrdPurchasePrice = prd.prd_purchase_price,
                    PrdFileName = prd.prd_file_name,
                    PrdCode = prd.prd_code,
                    //PrdInsideDiameter = prd.prd_inside_diameter,
                    PrdOutsideDiameter = prd.prd_outside_diameter,
                    PrdLength = prd.prd_length,
                    PrdWidth = prd.prd_width,
                    PrdHeight = prd.prd_height,
                    PrdHoleSize = prd.prd_hole_size,
                    PrdDepth = prd.prd_depth,
                    PrdWeight = prd.prd_weight,
                    PrdUnitLength = prd.prd_unit_length,
                    PrdUnitWidth = prd.prd_unit_width,
                    PrdUnitHeight = prd.prd_unit_height,
                    PrdUnitWeight = prd.prd_unit_weight,
                    PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                    PrdCartonLength = prd.prd_carton_length,
                    PrdCartonWidth = prd.prd_carton_width,
                    PrdCartonHeight = prd.prd_carton_height,
                    PrdCartonWeight = prd.prd_carton_weight,
                    PtyStandards = prd.TM_PTY_Product_Type.pty_standards,

                    PrdOutsideHeight = prd.prd_outside_height,
                    PrdOutsideLength = prd.prd_outside_length,
                    PrdOutsideWidth = prd.prd_outside_width,
                    PrdHoleLength = prd.prd_hole_lenght,
                    PrdHoleWidth = prd.prd_hole_width,
                    ProductType = prd.TM_PTY_Product_Type.pty_name
                };
                onePrd.PrdGeneralInfoList = GetGeneralPropertyValuesFormXml(prd.pty_id, socId, prd.prd_specifications,
                    true);
                onePrd.InstanceList = GetProductInstances(prd.prd_id, prd.pty_id, prd.soc_id);
                var prdImg = _db.TI_PIM_Product_Image.FirstOrDefault(m => m.prd_id == prdId);
                onePrd.PrdImg = prdImg != null ? prdImg.pim_path : string.Empty;
                var prdImgList = _db.TI_PIM_Product_Image.Where(m => m.prd_id == prdId).Select(m => new KeyValue
                {
                    Key = m.pim_order,
                    Value = m.pim_path
                }).ToList();
                onePrd.PrdImgList = prdImgList;
                onePrd.EntityColor = (from pty in _db.TM_PTY_Product_Type
                                      join cor in _db.TR_COR_Color on pty.cor_id equals cor.cor_id
                                      where pty.pty_id == onePrd.PtyId
                                      select cor).Select(m => new EntityColor
                                      {
                                          Id = m.cor_id,
                                          SocId = m.soc_id,
                                          CorRed = m.cor_red,
                                          CorBlue = m.cor_blue,
                                          CorGreen = m.cor_green,
                                          CorName = m.cor_name,
                                          CorDescription = m.cor_description
                                      }).FirstOrDefault();
                onePrd.FId = StringCipher.EncoderSimple(onePrd.PrdId.ToString(), "prdId");
                return onePrd;
            }
            else
            {
                return null;
            }
        }
        public List<ProductInstance> GetProductInstances(int prdId, int ptyId, int socId)
        {
            var prds = _db.TM_PIT_Product_Instance.Where(m => m.prd_id == prdId).Select(m => new ProductInstance
            {
                PitId = m.pit_id,
                PitDescription = m.pit_description,
                PitPrice = m.pit_price,
                PitRef = m.pit_ref,
                PitPurchasePrice = m.pit_purchase_price,
                PrdId = m.prd_id,
                PitPrdInfo = m.pit_prd_info,
                PitInventoryThreshold = m.pit_inventory_threshold,
                PitInventory = m.TM_INV_Inventory.Any() ? m.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0
            }).ToList();
            var ptyPropValues = GetPtyProppertyValues(ptyId, socId);
            foreach (var productInstance in prds)
            {
                productInstance.PitAllInfo = GetPitKeyValues(productInstance.PitPrdInfo, ptyPropValues);
                productInstance.PitImages =
                    _db.TI_PTI_Product_Instance_Image.Where(m => m.pit_id == productInstance.PitId).Distinct()
                        .Select(m => new KeyValue
                        {
                            Key = m.pti_id,
                            Value = m.pal_id.HasValue ? m.TR_PAL_Photo_Album.pal_path : m.pti_path,
                            Value2 = m.pti_description,
                            Key3 = m.pit_id,
                            Key2 = m.pti_order
                        }).OrderBy(m => m.Key2).ToList();
            }
            return prds;
        }
        /// <summary>
        /// 获取全部 每页12条
        /// </summary>
        public ProductAndCount GetAllProducts(int pageNum, int ptyId, string other)
        {
            var productAndCount = new ProductAndCount();
            var prds = _db.TM_PRD_Product.Select(prd => new Product
            {
                SocId = prd.soc_id,
                PtyId = prd.pty_id,
                PrdDescription = prd.prd_description,
                PrdId = prd.prd_id,
                PrdName = prd.prd_name,
                PrdSubName = prd.prd_sub_name,
                PrdPrice = prd.prd_price,
                PrdRef = prd.prd_ref,
                PrdPurchasePrice = prd.prd_purchase_price,
                PrdFileName = prd.prd_file_name,
                PrdCode = prd.prd_code,
                PrdOutsideDiameter = prd.prd_outside_diameter,
                PrdLength = prd.prd_length,
                PrdWidth = prd.prd_width,
                PrdHeight = prd.prd_height,
                PrdHoleSize = prd.prd_hole_size,
                PrdDepth = prd.prd_depth,
                PrdWeight = prd.prd_weight,
                PrdUnitLength = prd.prd_unit_length,
                PrdUnitWidth = prd.prd_unit_width,
                PrdUnitHeight = prd.prd_unit_height,
                PrdUnitWeight = prd.prd_unit_weight,
                PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                PrdCartonLength = prd.prd_carton_length,
                PrdCartonWidth = prd.prd_carton_width,
                PrdCartonHeight = prd.prd_carton_height,
                PrdCartonWeight = prd.prd_carton_weight,
                PtyStandards = prd.TM_PTY_Product_Type.pty_standards,
                PrdOutsideHeight = prd.prd_outside_height,
                PrdOutsideLength = prd.prd_outside_length,
                PrdOutsideWidth = prd.prd_outside_width,
                PrdHoleLength = prd.prd_hole_lenght,
                PrdHoleWidth = prd.prd_hole_width,
                ProductType = prd.TM_PTY_Product_Type.pty_name,
                PrdImg = prd.TI_PIM_Product_Image.FirstOrDefault().pim_path
            }).ToList();
            if (other != "empty")
            {
                //prds = _db.TM_PRD_Product.Where(l => l.prd_specifications.Contains(other)).Select(prd => new Product
                //{
                //    SocId = prd.soc_id,
                //    PtyId = prd.pty_id,
                //    PrdDescription = prd.prd_description,
                //    PrdId = prd.prd_id,
                //    PrdName = prd.prd_name,
                //    PrdSubName = prd.prd_sub_name,
                //    PrdPrice = prd.prd_price,
                //    PrdRef = prd.prd_ref,
                //    PrdPurchasePrice = prd.prd_purchase_price,
                //    PrdFileName = prd.prd_file_name,
                //    PrdCode = prd.prd_code,
                //    PrdOutsideDiameter = prd.prd_outside_diameter,
                //    PrdLength = prd.prd_length,
                //    PrdWidth = prd.prd_width,
                //    PrdHeight = prd.prd_height,
                //    PrdHoleSize = prd.prd_hole_size,
                //    PrdDepth = prd.prd_depth,
                //    PrdWeight = prd.prd_weight,
                //    PrdUnitLength = prd.prd_unit_length,
                //    PrdUnitWidth = prd.prd_unit_width,
                //    PrdUnitHeight = prd.prd_unit_height,
                //    PrdUnitWeight = prd.prd_unit_weight,
                //    PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                //    PrdCartonLength = prd.prd_carton_length,
                //    PrdCartonWidth = prd.prd_carton_width,
                //    PrdCartonHeight = prd.prd_carton_height,
                //    PrdCartonWeight = prd.prd_carton_weight,
                //    PtyStandards = prd.TM_PTY_Product_Type.pty_standards,
                //    PrdOutsideHeight = prd.prd_outside_height,
                //    PrdOutsideLength = prd.prd_outside_length,
                //    PrdOutsideWidth = prd.prd_outside_width,
                //    PrdHoleLength = prd.prd_hole_lenght,
                //    PrdHoleWidth = prd.prd_hole_width,
                //    ProductType = prd.TM_PTY_Product_Type.pty_name,
                //    PrdImg = prd.TI_PIM_Product_Image.FirstOrDefault().pim_path
                //}).ToList();
            }
            if (ptyId != 0)
            {

                prds = _db.TM_PRD_Product.Where(l => l.pty_id == ptyId).Select(prd => new Product
                {
                    SocId = prd.soc_id,
                    PtyId = prd.pty_id,
                    PrdDescription = prd.prd_description,
                    PrdId = prd.prd_id,
                    PrdName = prd.prd_name,
                    PrdSubName = prd.prd_sub_name,
                    PrdPrice = prd.prd_price,
                    PrdRef = prd.prd_ref,
                    PrdPurchasePrice = prd.prd_purchase_price,
                    PrdFileName = prd.prd_file_name,
                    PrdCode = prd.prd_code,
                    PrdOutsideDiameter = prd.prd_outside_diameter,
                    PrdLength = prd.prd_length,
                    PrdWidth = prd.prd_width,
                    PrdHeight = prd.prd_height,
                    PrdHoleSize = prd.prd_hole_size,
                    PrdDepth = prd.prd_depth,
                    PrdWeight = prd.prd_weight,
                    PrdUnitLength = prd.prd_unit_length,
                    PrdUnitWidth = prd.prd_unit_width,
                    PrdUnitHeight = prd.prd_unit_height,
                    PrdUnitWeight = prd.prd_unit_weight,
                    PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                    PrdCartonLength = prd.prd_carton_length,
                    PrdCartonWidth = prd.prd_carton_width,
                    PrdCartonHeight = prd.prd_carton_height,
                    PrdCartonWeight = prd.prd_carton_weight,
                    PtyStandards = prd.TM_PTY_Product_Type.pty_standards,
                    PrdOutsideHeight = prd.prd_outside_height,
                    PrdOutsideLength = prd.prd_outside_length,
                    PrdOutsideWidth = prd.prd_outside_width,
                    PrdHoleLength = prd.prd_hole_lenght,
                    PrdHoleWidth = prd.prd_hole_width,
                    ProductType = prd.TM_PTY_Product_Type.pty_name,
                    PrdImg = prd.TI_PIM_Product_Image.FirstOrDefault().pim_path
                }).ToList();
            }


            productAndCount.Count = prds.Count;
            productAndCount.Product = prds.OrderBy(l => l.PrdId).Skip((pageNum - 1) * 12).Take(12).ToList();
            return productAndCount;
        }


        /// <summary>
        /// 根据类型ID来获取产品
        /// </summary>
        /// <param name="ptyid"></param>
        /// <returns></returns>
        public List<Product> GetAllProductsByPtyid(int ptyid)
        {
            var prds = _db.TM_PRD_Product.Where(l => l.pty_id == ptyid).Select(prd => new Product
            {
                SocId = prd.soc_id,
                PtyId = prd.pty_id,
                PrdDescription = prd.prd_description,
                PrdId = prd.prd_id,
                PrdName = prd.prd_name,
                PrdSubName = prd.prd_sub_name,
                PrdPrice = prd.prd_price,
                PrdRef = prd.prd_ref,
                PrdPurchasePrice = prd.prd_purchase_price,
                PrdFileName = prd.prd_file_name,
                PrdCode = prd.prd_code,
                PrdOutsideDiameter = prd.prd_outside_diameter,
                PrdLength = prd.prd_length,
                PrdWidth = prd.prd_width,
                PrdHeight = prd.prd_height,
                PrdHoleSize = prd.prd_hole_size,
                PrdDepth = prd.prd_depth,
                PrdWeight = prd.prd_weight,
                PrdUnitLength = prd.prd_unit_length,
                PrdUnitWidth = prd.prd_unit_width,
                PrdUnitHeight = prd.prd_unit_height,
                PrdUnitWeight = prd.prd_unit_weight,
                PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                PrdCartonLength = prd.prd_carton_length,
                PrdCartonWidth = prd.prd_carton_width,
                PrdCartonHeight = prd.prd_carton_height,
                PrdCartonWeight = prd.prd_carton_weight,
                PtyStandards = prd.TM_PTY_Product_Type.pty_standards,
                PrdOutsideHeight = prd.prd_outside_height,
                PrdOutsideLength = prd.prd_outside_length,
                PrdOutsideWidth = prd.prd_outside_width,
                PrdHoleLength = prd.prd_hole_lenght,
                PrdHoleWidth = prd.prd_hole_width,
                ProductType = prd.TM_PTY_Product_Type.pty_name,
                PrdImg = prd.TI_PIM_Product_Image.FirstOrDefault().pim_path
            }).ToList();
            return prds;
        }
        public List<Product> GetProByName(string ProName)
        {
            var prds = _db.TM_PRD_Product.Where(l => l.prd_name.Contains(ProName) || l.prd_ref.Contains(ProName)).Select(prd => new Product
            {
                SocId = prd.soc_id,
                PtyId = prd.pty_id,
                PrdDescription = prd.prd_description,
                PrdId = prd.prd_id,
                PrdName = prd.prd_name,
                PrdSubName = prd.prd_sub_name,
                PrdPrice = prd.prd_price,
                PrdRef = prd.prd_ref,
                PrdPurchasePrice = prd.prd_purchase_price,
                PrdFileName = prd.prd_file_name,
                PrdCode = prd.prd_code,
                PrdOutsideDiameter = prd.prd_outside_diameter,
                PrdLength = prd.prd_length,
                PrdWidth = prd.prd_width,
                PrdHeight = prd.prd_height,
                PrdHoleSize = prd.prd_hole_size,
                PrdDepth = prd.prd_depth,
                PrdWeight = prd.prd_weight,
                PrdUnitLength = prd.prd_unit_length,
                PrdUnitWidth = prd.prd_unit_width,
                PrdUnitHeight = prd.prd_unit_height,
                PrdUnitWeight = prd.prd_unit_weight,
                PrdQuantityEachCarton = prd.prd_quantity_each_carton,
                PrdCartonLength = prd.prd_carton_length,
                PrdCartonWidth = prd.prd_carton_width,
                PrdCartonHeight = prd.prd_carton_height,
                PrdCartonWeight = prd.prd_carton_weight,
                PtyStandards = prd.TM_PTY_Product_Type.pty_standards,
                PrdOutsideHeight = prd.prd_outside_height,
                PrdOutsideLength = prd.prd_outside_length,
                PrdOutsideWidth = prd.prd_outside_width,
                PrdHoleLength = prd.prd_hole_lenght,
                PrdHoleWidth = prd.prd_hole_width,
                ProductType = prd.TM_PTY_Product_Type.pty_name,
                PrdImg = prd.TI_PIM_Product_Image.FirstOrDefault().pim_path
            }).ToList();
            return prds;
        }



        public Product LoadProductByRef(string prdRef, int socId)
        {
            var oneprd = _db.TM_PRD_Product.FirstOrDefault(m => (m.prd_ref.Contains(prdRef) || m.prd_tmp_ref.Contains(prdRef)) && m.soc_id == socId) ??
                         _db.TM_PIT_Product_Instance.Where(m => (m.pit_ref.Contains(prdRef) || m.pit_tmp_ref.Contains(prdRef)) && m.TM_PRD_Product.soc_id == socId).Select(m => m.TM_PRD_Product).FirstOrDefault();

            if (oneprd != null)
            {
                return LoadProductById(oneprd.prd_id, socId);
            }
            else
            {
                return null;
            }
        }


        /// <summary>
        /// 从 XML 得到general property list
        /// </summary>
        /// <param name="ptyId"></param>
        /// <param name="socId"></param>
        /// <param name="xmlFields"></param>
        /// <returns></returns>
        public List<PropertyValue> GetGeneralPropertyValuesFormXml(int ptyId, int socId, string xmlFields, bool getEmptyValue = false)
        {
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId && m.soc_id == socId);
            var propNames = new List<PropertyValue>();
            if (pty != null)
            {
                var xmlPtyField = pty.pty_specifications_fields;
                var listProps = GetPtyPropertyValues(xmlPtyField);
                var prdProps = GetPrdPropertyValues(xmlFields);
                foreach (var prdProp in prdProps)
                {
                    var ptyProp = listProps.FirstOrDefault(m => m.PropGuid == prdProp.PropGuid);
                    if (ptyProp != null)
                    {
                        prdProp.PropName = ptyProp.PropName;
                        prdProp.PropDescription = ptyProp.PropDescription;
                        prdProp.PropType = ptyProp.PropType;
                        prdProp.PropUnit = ptyProp.PropUnit;
                        prdProp.PropIsTitle = ptyProp.PropIsTitle;
                        prdProp.PropIsInTechReport = ptyProp.PropIsInTechReport;
                        prdProp.PropIsImage = ptyProp.PropIsImage;
                        prdProp.PropIsUnitRightSide = ptyProp.PropIsUnitRightSide;
                        prdProp.PropOrder = ptyProp.PropOrder;
                        prdProp.PropParentOrder = ptyProp.PropParentOrder;
                        prdProp.PropSubOrder = ptyProp.PropSubOrder;
                        prdProp.PropIsSameValue = ptyProp.PropIsSameValue;
                        prdProp.PropIsNullable = ptyProp.PropIsNullable;
                        prdProp.PropIsSearchField = ptyProp.PropIsSearchField;
                        prdProp.PropIsForPrice = ptyProp.PropIsForPrice;
                    }
                    propNames.Add(prdProp);
                }

                if (getEmptyValue)
                {
                    var emptyProps = listProps.Where(m => !prdProps.Any(l => l.PropGuid == m.PropGuid)).ToList();
                    propNames.AddRange(emptyProps);
                }
            }
            return propNames;
        }

        /// <summary>
        /// 得到product的XML的信息
        /// </summary>
        /// <param name="xmlfield"></param>
        /// <returns></returns>
        public static List<PropertyValue> GetPrdPropertyValues(string xmlfield)
        {
            var propNames = new List<PropertyValue>();
            if (!string.IsNullOrEmpty(xmlfield))
            {
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
                                oneProp.PropGuid = node.Attributes["PropGuid"] != null
                                    ? node.Attributes["PropGuid"].Value
                                    : string.Empty;
                                oneProp.PropValue = node.Attributes["PropValue"] != null
                                    ? node.Attributes["PropValue"].Value
                                    : string.Empty;
                            }
                            propNames.Add(oneProp);
                        }
                    }
                }
            }
            return propNames;
        }

        /// <summary>
        /// 得到PtyXML的信息
        /// </summary>
        /// <param name="xmlfield"></param>
        /// <returns></returns>
        public static List<PropertyValue> GetPtyPropertyValues(string xmlfield)
        {
            var propNames = new List<PropertyValue>();
            if (!string.IsNullOrEmpty(xmlfield))
            {
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
                                oneProp.PropGuid = node.Attributes["PropGuid"] != null
                                    ? node.Attributes["PropGuid"].Value
                                    : string.Empty;
                                oneProp.PropName = node.Attributes["PropName"] != null
                                    ? node.Attributes["PropName"].Value
                                    : string.Empty;
                                oneProp.PropValue = node.Attributes["PropValue"] != null
                                    ? node.Attributes["PropValue"].Value
                                    : string.Empty;
                                oneProp.PropDescription = node.Attributes["PropDescription"] != null
                                    ? node.Attributes["PropDescription"].Value
                                    : string.Empty;
                                oneProp.PropType = node.Attributes["PropType"] != null
                                    ? node.Attributes["PropType"].Value
                                    : string.Empty;
                                oneProp.PropUnit = node.Attributes["PropUnit"] != null
                                    ? node.Attributes["PropUnit"].Value
                                    : string.Empty;
                                oneProp.PropIsTitle = node.Attributes["PropIsTitle"] != null &&
                                                      Convert.ToBoolean(node.Attributes["PropIsTitle"].Value);
                                oneProp.PropIsInTechReport = node.Attributes["PropIsInTechReport"] != null &&
                                                             Convert.ToBoolean(
                                                                 node.Attributes["PropIsInTechReport"].Value);
                                oneProp.PropIsImage = node.Attributes["PropIsImage"] != null &&
                                                      Convert.ToBoolean(node.Attributes["PropIsImage"].Value);
                                oneProp.PropIsUnitRightSide = node.Attributes["PropIsUnitRightSide"] != null &&
                                                              Convert.ToBoolean(
                                                                  node.Attributes["PropIsUnitRightSide"].Value);
                                oneProp.PropOrder = node.Attributes["PropOrder"] != null
                                    ? Convert.ToInt32(node.Attributes["PropOrder"].Value)
                                    : 0;
                                oneProp.PropParentOrder = node.Attributes["PropParentOrder"] != null
                                    ? Convert.ToInt32(node.Attributes["PropParentOrder"].Value)
                                    : 0;
                                oneProp.PropSubOrder = node.Attributes["PropSubOrder"] != null
                                    ? Convert.ToDecimal(node.Attributes["PropSubOrder"].Value,
                                        CultureInfo.InvariantCulture)
                                    : 0;
                                oneProp.PropIsSameValue = node.Attributes["PropIsSameValue"] != null &&
                                                          Convert.ToBoolean(node.Attributes["PropIsSameValue"].Value);
                                oneProp.PropIsNullable = node.Attributes["PropIsNullable"] != null &&
                                                         Convert.ToBoolean(node.Attributes["PropIsNullable"].Value);
                                oneProp.PropIsSearchField = node.Attributes["PropIsSearchField"] != null &&
                                                            Convert.ToBoolean(node.Attributes["PropIsSearchField"].Value);
                                oneProp.PropIsForPrice = node.Attributes["PropIsForPrice"] != null &&
                                                            Convert.ToBoolean(node.Attributes["PropIsForPrice"].Value);
                            }
                            propNames.Add(oneProp);
                        }
                    }
                }
            }
            return propNames;
        }



        public List<PropertyValue> GetPtyProppertyValues(int ptyId, int socId)
        {
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId && m.soc_id == socId);
            var propNames = new List<PropertyValue>();
            if (pty != null)
            {
                var xmlPtyField = pty.pty_specifications_fields;
                propNames = GetPtyPropertyValues(xmlPtyField);
            }
            return propNames;
        }

        public static List<PropertyValue> GetPitKeyValuesFromXml(string xmlfield)
        {
            var propNames = new List<PropertyValue>();
            if (!string.IsNullOrEmpty(xmlfield))
            {
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
                                oneProp.PropGuid = node.Attributes["PropGuid"] != null
                                    ? node.Attributes["PropGuid"].Value
                                    : string.Empty;
                                oneProp.PropValue = node.Attributes["PropValue"] != null
                                    ? node.Attributes["PropValue"].Value
                                    : string.Empty;
                            }
                            propNames.Add(oneProp);
                        }
                    }
                }
            }
            return propNames;
        }

        public List<PropertyValue> GetPitKeyValues_Old(string xmlfield, List<PropertyValue> listPtyProps)
        {
            var resultList = new List<PropertyValue>();
            var prdProps = GetPitKeyValuesFromXml(xmlfield);
            foreach (var prdProp in prdProps)
            {
                var ptyProp = listPtyProps.FirstOrDefault(m => m.PropGuid == prdProp.PropGuid);
                if (ptyProp != null)
                {
                    prdProp.PropName = ptyProp.PropName;
                    prdProp.PropDescription = ptyProp.PropDescription;
                    prdProp.PropType = ptyProp.PropType;
                    prdProp.PropUnit = ptyProp.PropUnit;
                    prdProp.PropIsTitle = ptyProp.PropIsTitle;
                    prdProp.PropIsInTechReport = ptyProp.PropIsInTechReport;
                    prdProp.PropIsImage = ptyProp.PropIsImage;
                    prdProp.PropIsUnitRightSide = ptyProp.PropIsUnitRightSide;
                    prdProp.PropOrder = ptyProp.PropOrder;
                    prdProp.PropParentOrder = ptyProp.PropParentOrder;
                    prdProp.PropSubOrder = ptyProp.PropSubOrder;
                    prdProp.PropIsSameValue = ptyProp.PropIsSameValue;
                    prdProp.PropIsNullable = ptyProp.PropIsNullable;
                    prdProp.PropIsSearchField = ptyProp.PropIsSearchField;
                    prdProp.PropIsForPrice = ptyProp.PropIsForPrice;
                    resultList.Add(prdProp);
                }
            }
            return resultList;
        }

        public List<PropertyValue> GetPitKeyValues(string xmlfield, List<PropertyValue> listPtyProps, bool getEmptyValue = false)
        {
            var resultList = new List<PropertyValue>();
            var prdProps = GetPitKeyValuesFromXml(xmlfield);
            foreach (var prdProp in prdProps)
            {
                var ptyProp = listPtyProps.FirstOrDefault(m => m.PropGuid == prdProp.PropGuid);
                if (ptyProp != null)
                {
                    prdProp.PropName = ptyProp.PropName;
                    prdProp.PropDescription = ptyProp.PropDescription;
                    prdProp.PropType = ptyProp.PropType;
                    prdProp.PropUnit = ptyProp.PropUnit;
                    prdProp.PropIsTitle = ptyProp.PropIsTitle;
                    prdProp.PropIsInTechReport = ptyProp.PropIsInTechReport;
                    prdProp.PropIsImage = ptyProp.PropIsImage;
                    prdProp.PropIsUnitRightSide = ptyProp.PropIsUnitRightSide;
                    prdProp.PropOrder = ptyProp.PropOrder;
                    prdProp.PropParentOrder = ptyProp.PropParentOrder;
                    prdProp.PropSubOrder = ptyProp.PropSubOrder;
                    prdProp.PropIsSameValue = ptyProp.PropIsSameValue;
                    prdProp.PropIsNullable = ptyProp.PropIsNullable;
                    prdProp.PropIsSearchField = ptyProp.PropIsSearchField;
                    prdProp.PropIsForPrice = ptyProp.PropIsForPrice;
                    resultList.Add(prdProp);
                }
            }
            if (getEmptyValue)
            {
                var emptyProps = listPtyProps.Where(m => !prdProps.Any(l => l.PropGuid == m.PropGuid)).ToList();
                resultList.AddRange(emptyProps);
            }
            return resultList;
        }
    }
}

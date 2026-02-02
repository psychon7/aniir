using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Globalization;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Net.NetworkInformation;
using System.Security.Cryptography.Pkcs;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml;
using System.Xml.Linq;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;

//using Microsoft.Office.Interop.Excel;
//using Microsoft.Win32.SafeHandles;

namespace ERP.Repositories.SqlServer
{
    public class ProductRepository : BaseSqlServerRepository
    {
        /// <summary>
        /// 需要显示的prop
        /// </summary>
        List<string> propToadd = new List<string> {
            "Puissance"
            //, "Tension" 
        };
        private CommonRepository CommonRepository = new CommonRepository();
        private SupplierRepository SupplierRepository = new SupplierRepository();
        /// <summary>
        /// 
        /// </summary>
        /// <param name="oneProduct"></param>
        /// <returns></returns>
        public int CreateUpdateProduct(Product oneProduct)
        {
            int prdId = 0;
            bool create = false;
            if (oneProduct.PrdId != 0)
            {
                var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == oneProduct.PrdId);
                if (prd != null)
                {
                    string oldRef = prd.prd_ref;
                    string newRef = oneProduct.PrdRef;

                    // check protect IP
                    var oldSpec = GetGeneralPropertyValuesFormXml(prd.pty_id, prd.soc_id, prd.prd_specifications);
                    var newSepcifications = GenerateXmlFieldForGeneralInfo(oneProduct.PrdGeneralInfoList);
                    var newSpec = GetGeneralPropertyValuesFormXml(prd.pty_id, prd.soc_id, newSepcifications);

                    var oldIP = oldSpec.FirstOrDefault(m => m.PropName == "Protection IP");
                    var newIP = newSpec.FirstOrDefault(m => m.PropName == "Protection IP");



                    // update
                    prdId = prd.prd_id;

                    prd.prd_description = oneProduct.PrdDescription;
                    prd.pty_id = oneProduct.PtyId;
                    prd.prd_name = oneProduct.PrdName;
                    prd.prd_sub_name = oneProduct.PrdSubName;
                    prd.prd_price = oneProduct.PrdPrice;
                    prd.prd_purchase_price = oneProduct.PrdPurchasePrice;
                    prd.prd_ref = oneProduct.PrdRef;
                    //prd.soc_id = oneProduct.SocId;
                    prd.prd_specifications = newSepcifications;
                    prd.prd_file_name = oneProduct.PrdFileName;
                    prd.prd_d_update = DateTime.Now;

                    //prd.prd_inside_diameter = oneProduct.PrdInsideDiameter;
                    prd.prd_outside_diameter = oneProduct.PrdOutsideDiameter;
                    prd.prd_length = oneProduct.PrdLength;
                    prd.prd_width = oneProduct.PrdWidth;
                    prd.prd_height = oneProduct.PrdHeight;
                    prd.prd_hole_size = oneProduct.PrdHoleSize;
                    prd.prd_depth = oneProduct.PrdDepth;
                    prd.prd_weight = oneProduct.PrdWeight;
                    prd.prd_unit_length = oneProduct.PrdUnitLength;
                    prd.prd_unit_width = oneProduct.PrdUnitWidth;
                    prd.prd_unit_height = oneProduct.PrdUnitHeight;
                    prd.prd_unit_weight = oneProduct.PrdUnitWeight;
                    prd.prd_quantity_each_carton = oneProduct.PrdQuantityEachCarton;
                    prd.prd_carton_length = oneProduct.PrdCartonLength;
                    prd.prd_carton_width = oneProduct.PrdCartonWidth;
                    prd.prd_carton_height = oneProduct.PrdCartonHeight;
                    prd.prd_carton_weight = oneProduct.PrdCartonWeight;

                    prd.prd_outside_height = oneProduct.PrdOutsideHeight;
                    prd.prd_outside_length = oneProduct.PrdOutsideLength;
                    prd.prd_outside_width = oneProduct.PrdOutsideWidth;
                    prd.prd_hole_lenght = oneProduct.PrdHoleLength;
                    prd.prd_hole_width = oneProduct.PrdHoleWidth;

                    prd.prd_tmp_ref = oneProduct.PrdTmpRef;
                    prd.prd_sup_description = oneProduct.PrdSupDes;



                    _db.TM_PRD_Product.ApplyCurrentValues(prd);
                    _db.SaveChanges();

                    // update product instrance
                    foreach (var onePrdIns in oneProduct.InstanceList)
                    {
                        bool createIns = false;
                        if (onePrdIns.PitId > 0)
                        {
                            // update instance
                            var oneIns = _db.TM_PIT_Product_Instance.First(m => m.pit_id == onePrdIns.PitId);
                            if (oneIns != null)
                            {
                                var pitPrdInfo = GenerateXmlFieldForProductInstrance(onePrdIns.PitAllInfo);
                                oneIns.pit_price = onePrdIns.PitPrice;
                                oneIns.pit_ref = onePrdIns.PitRef;
                                oneIns.pit_purchase_price = onePrdIns.PitPurchasePrice;
                                oneIns.pit_description = onePrdIns.PitDescription;
                                oneIns.pit_prd_info = pitPrdInfo;
                                oneIns.pit_inventory_threshold = onePrdIns.PitInventoryThreshold;
                                oneIns.pty_id = prd.pty_id;
                                _db.TM_PIT_Product_Instance.ApplyCurrentValues(oneIns);
                            }
                            else
                            {
                                createIns = true;
                            }
                        }
                        else
                        {
                            // create instance
                            createIns = true;
                        }
                        if (createIns)
                        {
                            var oneIns = new TM_PIT_Product_Instance();
                            var pitPrdInfo = GenerateXmlFieldForProductInstrance(onePrdIns.PitAllInfo);
                            oneIns.prd_id = prdId;
                            oneIns.pty_id = onePrdIns.PtyId;
                            oneIns.pit_price = onePrdIns.PitPrice;
                            oneIns.pit_ref = onePrdIns.PitRef;
                            oneIns.pit_purchase_price = onePrdIns.PitPurchasePrice;
                            oneIns.pit_description = onePrdIns.PitDescription;
                            oneIns.pit_prd_info = pitPrdInfo;
                            oneIns.pit_inventory_threshold = onePrdIns.PitInventoryThreshold;
                            _db.TM_PIT_Product_Instance.AddObject(oneIns);
                        }
                    }
                    _db.SaveChanges();


                    // update product instance referece 
                    var ip2Update = string.Empty;
                    bool updateIp = false;
                    if (oldIP != null && newIP != null)
                    {
                        updateIp = oldIP.PropValue != newIP.PropValue;
                        ip2Update = newIP.PropValue;
                    }
                    if ((oldRef != newRef) || updateIp)
                    {
                        var pits = _db.TM_PIT_Product_Instance.Where(m => m.prd_id == prd.prd_id).ToList();
                        foreach (var onePit in pits)
                        {
                            var oldPitRef = onePit.pit_ref;
                            var newpitRef = oldPitRef.Replace(oldRef, newRef);
                            try
                            {
                                var color = oldPitRef.Substring(oldPitRef.Length - 2, 2);
                                var newRefWithoutIp = newpitRef.Substring(0, newpitRef.Length - 4);
                                newpitRef = newRefWithoutIp + ip2Update + color;
                                onePit.pit_ref = newpitRef;
                                _db.TM_PIT_Product_Instance.ApplyCurrentValues(onePit);
                                _db.SaveChanges();
                            }
                            catch (Exception)
                            {
                                break;
                            }

                        }
                    }
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
                // create
                var sepcifications = GenerateXmlFieldForGeneralInfo(oneProduct.PrdGeneralInfoList);
                var onePrd = new TM_PRD_Product
                {
                    prd_description = oneProduct.PrdDescription,
                    pty_id = oneProduct.PtyId,
                    prd_name = oneProduct.PrdName,
                    prd_sub_name = oneProduct.PrdSubName,
                    prd_price = oneProduct.PrdPrice,
                    prd_purchase_price = oneProduct.PrdPurchasePrice,
                    prd_ref = oneProduct.PrdRef,
                    soc_id = oneProduct.SocId,
                    prd_file_name = oneProduct.PrdFileName,
                    prd_specifications = sepcifications,
                    prd_d_creation = DateTime.Now,
                    prd_d_update = DateTime.Now,
                    prd_code = GetNewProductCode(oneProduct.SocId),

                    //prd_inside_diameter = oneProduct.PrdInsideDiameter,
                    prd_outside_diameter = oneProduct.PrdOutsideDiameter,
                    prd_length = oneProduct.PrdLength,
                    prd_width = oneProduct.PrdWidth,
                    prd_height = oneProduct.PrdHeight,
                    prd_hole_size = oneProduct.PrdHoleSize,
                    prd_depth = oneProduct.PrdDepth,
                    prd_weight = oneProduct.PrdWeight,
                    prd_unit_length = oneProduct.PrdUnitLength,
                    prd_unit_width = oneProduct.PrdUnitWidth,
                    prd_unit_height = oneProduct.PrdUnitHeight,
                    prd_unit_weight = oneProduct.PrdUnitWeight,
                    prd_quantity_each_carton = oneProduct.PrdQuantityEachCarton,
                    prd_carton_length = oneProduct.PrdCartonLength,
                    prd_carton_width = oneProduct.PrdCartonWidth,
                    prd_carton_height = oneProduct.PrdCartonHeight,
                    prd_carton_weight = oneProduct.PrdCartonWeight,

                    prd_outside_height = oneProduct.PrdOutsideHeight,
                    prd_outside_length = oneProduct.PrdOutsideLength,
                    prd_outside_width = oneProduct.PrdOutsideWidth,
                    prd_hole_lenght = oneProduct.PrdHoleLength,
                    prd_hole_width = oneProduct.PrdHoleWidth,
                };
                _db.TM_PRD_Product.AddObject(onePrd);
                _db.SaveChanges();
                prdId = onePrd.prd_id;
                // create product instance
                foreach (var prdIns in oneProduct.InstanceList)
                {
                    var pitPrdInfo = GenerateXmlFieldForProductInstrance(prdIns.PitAllInfo);
                    var onePin = new TM_PIT_Product_Instance
                    {
                        prd_id = prdId,
                        pty_id = oneProduct.PtyId,
                        pit_price = prdIns.PitPrice,
                        pit_purchase_price = prdIns.PitPurchasePrice,
                        pit_ref = prdIns.PitRef,
                        pit_description = prdIns.PitDescription,
                        pit_prd_info = pitPrdInfo,
                        pit_inventory_threshold = prdIns.PitInventoryThreshold
                    };
                    _db.TM_PIT_Product_Instance.AddObject(onePin);
                }
                _db.SaveChanges();
            }
            return prdId;
        }

        public string getTreeNumRandom()
        {
            Random ro = new Random();
            int iResult;
            int iUp = 999;
            int iDown = 100;
            iResult = ro.Next(iDown, iUp);
            //Response.Write(iResult.ToString());
            return iResult.ToString().Trim();
        }
        /// <summary>
        /// 逐条处理导入数据 202204
        /// </summary>
        /// <param name="dr"></param>
        /// <returns></returns>
        public int ImportProduct(DataRow dr, List<FileInfo> res)
        {
            var prdId = 0;
            var onePrd = new TM_PRD_Product();
            onePrd.prd_name = dr["GAMME"].ToString();
            //onePrd.prd_name = dr["REF ECOLED"].ToString();
            var ptyid = 0;
            var catname = dr["CAT"].ToString();
            //var onePty = _db.TM_PTY_Product_Type.FirstOrDefault(l => l.pty_name.Contains(dr["CAT"].ToString()));
            var onePty = _db.TM_PTY_Product_Type.FirstOrDefault(l => l.pty_name.Contains(catname));
            if (onePty != null)
            {
                ptyid = onePty.pty_id;
            }
            var propList = GetPtyProppertyValues(ptyid, 1);

            onePrd.pty_id = ptyid;
            onePrd.soc_id = 1;
            //onePrd.prd_ref = dr["REF ECOLED"].ToString();
            onePrd.prd_ref = dr["GAMME"].ToString();
            onePrd.prd_name = dr["GAMME"].ToString();
            onePrd.prd_sub_name = dr["THEME"].ToString();
            if (dr["SOUS THEME"].ToString() != "")
            {
                onePrd.prd_sub_name = dr["SOUS THEME"].ToString();
            }
            if (dr["SOUS THEME"].ToString() != "" && dr["THEME"].ToString() != "")
            {
                onePrd.prd_sub_name = dr["THEME"] + "-" + dr["SOUS THEME"];
            }

            var des1 = dr["Description 1"].ToString().Trim();
            var des2 = dr["Description 2"].ToString().Trim();
            des2 = !string.IsNullOrEmpty(des1) && !string.IsNullOrEmpty(des2) ? (des1 + "\r\n" + des2) : (des1 + des2);
            var des3 = dr["Description 3"].ToString().Trim();
            des3 = !string.IsNullOrEmpty(des2) && !string.IsNullOrEmpty(des3) ? (des2 + "\r\n" + des3) : (des2 + des3);

            //onePrd.prd_description = dr["Description 1"] + "\r\n" + dr["Description 2"] + "\r\n" + dr["Description 2"];
            onePrd.prd_description = des3;

            if (dr["sortie lumineux"].ToString() != "")
            {
                onePrd.prd_description = onePrd.prd_description + "\r\n" + "Sortie lumineux: " + dr["sortie lumineux"];
            }
            if (dr["Zone de montage"].ToString() != "")
            {
                onePrd.prd_description = onePrd.prd_description + "\r\n" + "Zone de montage: " + dr["Zone de montage"];
            }
            if (dr["Installer"].ToString() != "")
            {
                onePrd.prd_description = onePrd.prd_description + "\r\n" + "Installer: " + dr["Installer"];
            }
            if (dr["angle"].ToString() != "")
            {
                onePrd.prd_description = onePrd.prd_description + "\r\n" + "Angle: " + dr["angle"];
            }
            if (dr["VARIABLE"].ToString() != "")
            {
                onePrd.prd_description = onePrd.prd_description + "\r\n" + "Driver: " + dr["VARIABLE"];
            }



            if (dr["TAILLE LONGUEUR"].ToString() != "")
            {
                var length = dr["TAILLE LONGUEUR"].ToString().Replace(".", ",");
                length = Regex.Replace(length, "[a-zA-Z]", "");
                length = length.Trim();
                //onePrd.prd_length = Convert.ToDecimal(dr["TAILLE LONGUEUR"]);
                try
                {
                    onePrd.prd_length = Convert.ToDecimal(length);
                }
                catch (Exception)
                {

                }
            }
            if (dr["TAILLE LARGEUR"].ToString() != "")
            {
                var length = dr["TAILLE LARGEUR"].ToString().Replace(".", ",");
                length = Regex.Replace(length, "[a-zA-Z]", "");
                length = length.Trim();
                //onePrd.prd_width = Convert.ToDecimal(dr["TAILLE LARGEUR"]);
                try
                {
                    onePrd.prd_width = Convert.ToDecimal(length);
                }
                catch (Exception)
                {
                }

            }
            if (dr["TROU"].ToString() != "")
            {
                var length = dr["TROU"].ToString().Replace(".", ",");
                length = Regex.Replace(length, "[a-zA-Z]", "");
                length = length.Trim();
                //onePrd.prd_hole_lenght = Convert.ToDecimal(dr["TROU"]);
                try
                {
                    onePrd.prd_hole_lenght = Convert.ToDecimal(length);
                }
                catch (Exception)
                {
                }
            }
            if (dr["TROU 1"].ToString() != "")
            {
                var length = dr["TROU 1"].ToString().Replace(".", ",");
                length = Regex.Replace(length, "[a-zA-Z]", "");
                length = length.Trim();
                try
                {
                    onePrd.prd_depth = Convert.ToDecimal(length);
                }
                catch (Exception)
                {
                }
            }
            if (dr["Poids"].ToString() != "")
            {
                var weight = dr["Poids"].ToString().Replace(".", ",");
                weight = Regex.Replace(weight, "[a-zA-Z]", "");
                weight = weight.Trim();
                //onePrd.prd_hole_lenght = Convert.ToDecimal(dr["TROU"]);
                try
                {
                    onePrd.prd_weight = Convert.ToDecimal(weight);
                }
                catch (Exception)
                {
                }
            }

            _db.TM_PRD_Product.AddObject(onePrd);
            _db.SaveChanges();
            prdId = onePrd.prd_id;


            //这里处理XML的值
            List<PropertyValue> listpitInfo = new List<PropertyValue>();
            PropertyValue ip = new PropertyValue();
            ip.PropName = "Protection IP";
            ip.PropValue = dr["IP"].ToString();
            if (propList.Any(l => l.PropName == ip.PropName))
            {
                ip.PropGuid = propList.FirstOrDefault(l => l.PropName == ip.PropName).PropGuid;
                listpitInfo.Add(ip);
            }
            PropertyValue CLASSE = new PropertyValue();
            CLASSE.PropName = "Classe";
            CLASSE.PropValue = dr["CLASSE"].ToString();
            if (propList.Any(l => l.PropName == CLASSE.PropName))
            {
                CLASSE.PropGuid = propList.FirstOrDefault(l => l.PropName == CLASSE.PropName).PropGuid;
                listpitInfo.Add(CLASSE);
            }
            PropertyValue couleur = new PropertyValue();
            couleur.PropName = "Température de couleur";
            couleur.PropValue = dr["Température de couleur"].ToString();
            if (propList.Any(l => l.PropName == couleur.PropName))
            {
                couleur.PropGuid = propList.FirstOrDefault(l => l.PropName == couleur.PropName).PropGuid;
                listpitInfo.Add(couleur);
            }
            PropertyValue IK = new PropertyValue();
            IK.PropName = "Protection IK";
            IK.PropValue = dr["PROTECTION IK"].ToString();
            if (propList.Any(l => l.PropName == IK.PropName))
            {
                IK.PropGuid = propList.FirstOrDefault(l => l.PropName == IK.PropName).PropGuid;
                listpitInfo.Add(IK);
            }

            var ugr = dr["UGR"].ToString().Split('/');
            var minugr = ugr.Min();
            PropertyValue strUgr = new PropertyValue();
            strUgr.PropName = "UGR";
            strUgr.PropValue = minugr;
            listpitInfo.Add(strUgr);

            //处理PIT

            //var puilist = dr["PUISSANCE"].ToString().Split('/').Where(l => !string.IsNullOrEmpty(l));
            var tmpColor = dr["Température de couleur"].ToString().Split('/').Where(l => !string.IsNullOrEmpty(l)).Select(l => Regex.Replace(l, "[a-zA-Z]", "")).Distinct().ToList();
            var powerlist = dr["PUISSANCE"].ToString().Split('/').Where(l => !string.IsNullOrEmpty(l)).Select(l => Regex.Replace(l, "[a-zA-Z]", "")).Distinct().ToList();


            var suppliername = dr["Fournisseur"].ToString();
            var oneSup = SupplierRepository.GetAllSupplier(1).FirstOrDefault(l => l.CompanyName.ToLower().Contains(suppliername.ToLower()));

            //// 不同功率
            //if (powerlist.Any())
            //{
            if (onePrd.prd_name.Contains("SUN-SWAP-200"))
            {
                var test = "";
            }
            if (powerlist.Any())
            {
                foreach (var onepower in powerlist)
                {
                    // 不同色温
                    if (tmpColor.Any())
                    {
                        foreach (var onepui in tmpColor)
                        {
                            var onePit = new TM_PIT_Product_Instance();
                            onePit.prd_id = prdId;
                            onePit.pty_id = ptyid;
                            onePit.pit_ref = dr["GAMME"] + "-" + onepower + "-" + onepui;
                            var pitInfoCopy = ObjectCopier.DeepCopy(listpitInfo);

                            PropertyValue tmpcolprop = new PropertyValue();
                            tmpcolprop.PropName = "Température de couleur";
                            tmpcolprop.PropValue = onepui;
                            if (propList.Any(l => l.PropName == tmpcolprop.PropName))
                            {
                                tmpcolprop.PropGuid = propList.FirstOrDefault(l => l.PropName == tmpcolprop.PropName).PropGuid;
                                pitInfoCopy.Add(tmpcolprop);
                            }
                            PropertyValue proppower = new PropertyValue();
                            proppower.PropName = "Puissance";
                            proppower.PropValue = onepower;
                            if (propList.Any(l => l.PropName == proppower.PropName))
                            {
                                proppower.PropGuid = propList.FirstOrDefault(l => l.PropName == proppower.PropName).PropGuid;
                                pitInfoCopy.Add(proppower);
                            }

                            // todo: 处理XML
                            var pitPrdInfo = GenerateXmlFieldForProductInstrance(pitInfoCopy);
                            onePit.pit_prd_info = pitPrdInfo;
                            _db.TM_PIT_Product_Instance.AddObject(onePit);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // todo: 如果没有temp color ，还是需要建立PIT    
                        var onePit = new TM_PIT_Product_Instance();
                        onePit.prd_id = prdId;
                        onePit.pty_id = ptyid;
                        onePit.prd_id = prdId;
                        onePit.pty_id = ptyid;
                        onePit.pit_ref = dr["GAMME"].ToString();
                        var pitInfoCopy = ObjectCopier.DeepCopy(listpitInfo);
                        PropertyValue proppower = new PropertyValue();
                        proppower.PropName = "Puissance";
                        proppower.PropValue = onepower;
                        if (propList.Any(l => l.PropName == proppower.PropName))
                        {
                            proppower.PropGuid = propList.FirstOrDefault(l => l.PropName == proppower.PropName).PropGuid;
                            pitInfoCopy.Add(proppower);
                        }
                        // todo: 处理XML
                        var pitPrdInfo = GenerateXmlFieldForProductInstrance(pitInfoCopy);
                        onePit.pit_prd_info = pitPrdInfo;
                        _db.TM_PIT_Product_Instance.AddObject(onePit);
                        _db.SaveChanges();

                        //onePit.pit_ref = dr["GAMME"].ToString() + onepui.Substring(0, 1);
                    }
                }
            }
            else
            {
                // todo: 如果没有puissance ，还是需要建立PIT    
                var onePit = new TM_PIT_Product_Instance();
                onePit.prd_id = prdId;
                onePit.pty_id = ptyid;
                onePit.prd_id = prdId;
                onePit.pty_id = ptyid;
                onePit.pit_ref = dr["GAMME"].ToString();
                // todo: 处理XML
                var pitInfoCopy = ObjectCopier.DeepCopy(listpitInfo);
                var pitPrdInfo = GenerateXmlFieldForProductInstrance(pitInfoCopy);
                onePit.pit_prd_info = pitPrdInfo;
                _db.TM_PIT_Product_Instance.AddObject(onePit);
                _db.SaveChanges();
            }

            // 处理SPR
            var oneSpr = new TR_SPR_Supplier_Product();
            oneSpr.sup_id = oneSup.Id;
            oneSpr.prd_id = prdId;
            oneSpr.spr_prd_ref = dr["REF ECOLED"].ToString().Substring(5);
            oneSpr.soc_id = 1;
            oneSpr.cur_id = 3;
            _db.AddToTR_SPR_Supplier_Product(oneSpr);
            _db.SaveChanges();


            //if (tmpColor.Any())
            //{
            //    foreach (var onepui in tmpColor)
            //    {
            //        var onePit = new TM_PIT_Product_Instance();
            //        onePit.prd_id = prdId;
            //        onePit.pty_id = ptyid;
            //        onePit.pit_ref = dr["REF ECOLED"] + "-" + onepui;
            //        PropertyValue pit = new PropertyValue();
            //        pit.PropGuid = "Température de couleur";
            //        pit.PropValue = onepui;
            //        // todo: 处理XML
            //        var pitPrdInfo = GenerateXmlFieldForProductInstrance(listpit);
            //        onePit.pit_prd_info = pitPrdInfo;
            //        _db.TM_PIT_Product_Instance.AddObject(onePit);
            //        _db.SaveChanges();


            //        // todo: 处理SPR
            //        var oneSpr = new TR_SPR_Supplier_Product();
            //        oneSpr.sup_id = oneSup.Id;
            //        oneSpr.prd_id = prdId;
            //        oneSpr.spr_prd_ref = dr["REF ECOLED"].ToString().Substring(5);
            //        oneSpr.soc_id = 1;
            //        oneSpr.cur_id = 1;
            //        _db.AddToTR_SPR_Supplier_Product(oneSpr);
            //        _db.SaveChanges();
            //    }
            //}
            //else
            //{
            //    // todo: 如果没有puissance ，还是需要建立PIT    
            //    var onePit = new TM_PIT_Product_Instance();
            //    onePit.prd_id = prdId;
            //    onePit.pty_id = ptyid;
            //    onePit.prd_id = prdId;
            //    onePit.pty_id = ptyid;
            //    onePit.pit_ref = dr["REF ECOLED"].ToString();
            //    PropertyValue pit = new PropertyValue();
            //    pit.PropGuid = "Température de couleur";
            //    pit.PropValue = onepui;
            //    // todo: 处理XML
            //    var pitPrdInfo = GenerateXmlFieldForProductInstrance(listpit);
            //    onePit.pit_prd_info = pitPrdInfo;
            //    _db.TM_PIT_Product_Instance.AddObject(onePit);
            //    _db.SaveChanges();
            //    //onePit.pit_ref = dr["GAMME"].ToString() + onepui.Substring(0, 1);

            //}



            //这里处理图片
            var list = new List<string>();
            list.Add(dr["@image1"].ToString());
            list.Add(dr["@image2"].ToString());
            list.Add(dr["@image3"].ToString());
            list.Add(dr["@image4"].ToString());
            list.Add(dr["@image5"].ToString());
            list.Add(dr["@image6"].ToString());
            list.Add(dr["@image7"].ToString());
            list.Add(dr["@image8"].ToString());
            list.Add(dr["@image9"].ToString());
            list = list.Select(l => l.Trim()).Where(l => !string.IsNullOrEmpty(l)).ToList();
            foreach (var item in list)
            {
                //这里需要根据电脑实际图片路径拉更改
                //var basePath = @"F:\Image\";
                //var basePath = @"C:\Users\Chenglin\Dropbox\FICHES TECHNIQUES";
                //var allFolder = Directory.GetFiles(basePath);
                //var res = new List<FileInfo>();
                //ForeachFile(basePath, ref res);

                var folder2Treat = new List<FileInfo>();
                string ptyValue = item.Substring(8).ToString();

                //folder2Treat = allFolder.Where(m => m != null && Path.GetFileName(m).StartsWith(ptyValue)).ToList();
                folder2Treat = res.Where(m => m != null && Path.GetFileName(m.Name).StartsWith(ptyValue)).ToList();
                var listFiles2Treat = new List<string>();

                foreach (var folder in folder2Treat)
                {
                    //string nameFile = folder.Replace(basePath, ""); ;
                    string filename = @"D:\SiteFilesFolder\ERPs\ERP_ECOLED\Files\UpLoadFiles\Product\Photo\" + prdId; // 在该路径下打算创建一个叫做Photo的文件夹
                    if (!Directory.Exists(filename)) //如果该文件夹不存在就建立这个新文件夹
                    {
                        Directory.CreateDirectory(filename);
                    }
                    string dest = filename + "\\" + folder.Name;// 文件的完全路径
                    if (!File.Exists(dest))//判断文件是否存在
                    {
                        File.Copy(folder.FullName, dest);
                    }
                    var oneImage = new TI_PIM_Product_Image();
                    oneImage.prd_id = prdId;
                    oneImage.pim_path = dest;
                    oneImage.pim_order = 1;
                    _db.TI_PIM_Product_Image.AddObject(oneImage);
                    _db.SaveChanges();
                }


            }
            return 1;
        }

        /// <summary>
        /// 202201 谭
        /// </summary>
        /// <param name="dr"></param>
        /// <returns></returns>
        public int CreateProduct(DataRow dr)
        {
            int ptyid = 0;
            int prdId = 0;
            int supId = 0;
            var onePrd = new TM_PRD_Product();

            onePrd.prd_name = dr["Ref"].ToString();
            onePrd.soc_id = 1;
            if (dr["Type"].ToString() == "ACC")
            {
                onePrd.prd_ref = "AC" + DateTime.Now.ToString("hhmmss") + getTreeNumRandom();
                ptyid = 5;
            }
            if (dr["Type"].ToString() == "SUNLED")
            {
                onePrd.prd_ref = "SU" + DateTime.Now.ToString("hhmmss") + getTreeNumRandom();
                ptyid = 4;
            }
            if (dr["Type"].ToString() == "LUMILED")
            {
                onePrd.prd_ref = "LU" + DateTime.Now.ToString("hhmmss") + getTreeNumRandom();
                ptyid = 3;
            }
            if (dr["Type"].ToString() == "EXALED")
            {
                onePrd.prd_ref = "EX" + DateTime.Now.ToString("hhmmss") + getTreeNumRandom();
                ptyid = 2;
            }
            if (dr["Type"].ToString() == "EVOLED")
            {
                onePrd.prd_ref = "EV" + DateTime.Now.ToString("hhmmss") + getTreeNumRandom();
                ptyid = 1;
            }
            //if (dr["Type"].ToString() == "SUNLED") ptyid = 4;
            //if (dr["Type"].ToString() == "LUMILED") ptyid = 3;
            //if (dr["Type"].ToString() == "EXALED") ptyid = 2;
            //if (dr["Type"].ToString() == "EVOLED") ptyid = 1;
            onePrd.pty_id = ptyid;
            var sepcifications = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyid);
            if (sepcifications != null)
            {
                onePrd.prd_specifications = sepcifications.pty_specifications_fields;
            }
            onePrd.prd_code = GetNewProductCode(1);
            onePrd.prd_sub_name = dr["Ref"].ToString();
            _db.TM_PRD_Product.AddObject(onePrd);
            _db.SaveChanges();
            prdId = onePrd.prd_id;
            var supcode = dr["SupCode"].ToString();
            var sup = _db.TM_SUP_Supplier.FirstOrDefault(m => m.sup_ref == supcode);
            if (sup != null)
            {
                supId = sup.sup_id;
            }
            else
            {
                var supplier = new TM_SUP_Supplier()
                {
                    sup_ref = dr["SupCode"].ToString(),
                    soc_id = 1,
                    sup_company_name = dr["SupName"].ToString(),
                    vat_id = 1,
                    pco_id = 1,
                    pmo_id = 1,
                    usr_created_by = 15,
                    cur_id = 3,
                    sup_isactive = true,
                    sup_isblocked = false,
                    sup_d_creation = DateTime.Now,
                    sup_d_update = DateTime.Now,
                    sty_id = 1
                };
                _db.TM_SUP_Supplier.AddObject(supplier);
                _db.SaveChanges();
                supId = supplier.sup_id;
            }


            var spr = new TR_SPR_Supplier_Product()
            {
                sup_id = supId,
                prd_id = prdId,
                spr_prd_ref = onePrd.prd_ref,
                soc_id = 1,
                cur_id = 1


            };
            _db.TR_SPR_Supplier_Product.AddObject(spr);
            _db.SaveChanges();

            var basePath = @"F:\Image\";
            //var basePath = @"C:\Users\Chenglin\Dropbox\FICHES TECHNIQUES";
            var allFolder = Directory.GetFiles(basePath);
            List<string> folder2Treat = new List<string>();
            string ptyValue = dr["Ref"].ToString();
            folder2Treat = allFolder.Where(m => m != null && Path.GetFileName(m).StartsWith(ptyValue)).ToList();
            var listFiles2Treat = new List<string>();

            foreach (var folder in folder2Treat)
            {
                string nameFile = folder.Replace(basePath, ""); ;


                string filename = @"D:\SiteFilesFolder\ERPs\ERP_ECOLED\Files\UpLoadFiles\Product\Photo\" + prdId; // 在该路径下打算创建一个叫做picture的文件夹
                if (!Directory.Exists(filename)) //如果该文件夹不存在就建立这个新文件夹
                {
                    Directory.CreateDirectory(filename);
                }
                string dest = filename + "\\" + nameFile;// 文件的完全路径
                if (!File.Exists(dest))//判断文件是否存在
                {
                    File.Copy(folder, dest);
                }
                var oneImage = new TI_PIM_Product_Image();
                oneImage.prd_id = prdId;
                oneImage.pim_path = dest;
                oneImage.pim_order = 1;
                _db.TI_PIM_Product_Image.AddObject(oneImage);
                _db.SaveChanges();
            }
            //3000 4000 6000K
            for (int i = 0; i < 3; i++)
            {
                var sw = "";
                if (i == 0) sw = "3000";
                if (i == 1) sw = "4000";
                if (i == 2) sw = "6000";
                var onePit = new TM_PIT_Product_Instance();
                onePit.prd_id = prdId;
                onePit.pty_id = ptyid;
                onePit.pit_ref = dr["Ref"].ToString() + sw.Substring(0, 1);
                PropertyValue pit = new PropertyValue();
                pit.PropGuid = "Température de couleur";
                pit.PropValue = sw;
                List<PropertyValue> listpit = new List<PropertyValue>();
                var pitPrdInfo = GenerateXmlFieldForProductInstrance(listpit);
                onePit.pit_prd_info = pitPrdInfo;
                _db.TM_PIT_Product_Instance.AddObject(onePit);
                _db.SaveChanges();
            }






            //var LengthList = new String[]{};
            //var ColorList = new String[]{};
            //if (dr["Length"].ToString() !="")
            //{
            //    LengthList = dr["Length"].ToString().Split('/');
            //}

            //if (dr["Color"].ToString() != "")
            //{

            //    ColorList = dr["Color"].ToString().Split('/');
            //}

            return 1;
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

        /// <summary>
        /// with supplier i nfo, with product instances
        /// </summary>
        /// <param name="oneProduct"></param>
        /// <returns></returns>
        public int CreateProductExpress(Product oneProduct)
        {
            int prdId = 0;
            // create
            var sepcifications = GenerateXmlFieldForGeneralInfo(oneProduct.PrdGeneralInfoList);


            var onePrd = new TM_PRD_Product
            {
                prd_description = oneProduct.PrdDescription,
                pty_id = oneProduct.PtyId,
                prd_name = oneProduct.PrdName,
                prd_sub_name = oneProduct.PrdSubName,
                prd_price = oneProduct.PrdPrice,
                prd_purchase_price = oneProduct.PrdPurchasePrice,
                prd_ref = oneProduct.PrdRef,
                soc_id = oneProduct.SocId,
                prd_file_name = oneProduct.PrdFileName,
                prd_specifications = sepcifications,
                prd_d_creation = DateTime.Now,
                prd_d_update = DateTime.Now,
                prd_code = GetNewProductCode(oneProduct.SocId),

                //prd_inside_diameter = oneProduct.PrdInsideDiameter,
                prd_outside_diameter = oneProduct.PrdOutsideDiameter,
                prd_length = oneProduct.PrdLength,
                prd_width = oneProduct.PrdWidth,
                prd_height = oneProduct.PrdHeight,
                prd_hole_size = oneProduct.PrdHoleSize,
                prd_depth = oneProduct.PrdDepth,
                prd_weight = oneProduct.PrdWeight,
                prd_unit_length = oneProduct.PrdUnitLength,
                prd_unit_width = oneProduct.PrdUnitWidth,
                prd_unit_height = oneProduct.PrdUnitHeight,
                prd_unit_weight = oneProduct.PrdUnitWeight,
                prd_quantity_each_carton = oneProduct.PrdQuantityEachCarton,
                prd_carton_length = oneProduct.PrdCartonLength,
                prd_carton_width = oneProduct.PrdCartonWidth,
                prd_carton_height = oneProduct.PrdCartonHeight,
                prd_carton_weight = oneProduct.PrdCartonWeight,

                prd_outside_height = oneProduct.PrdOutsideHeight,
                prd_outside_length = oneProduct.PrdOutsideLength,
                prd_outside_width = oneProduct.PrdOutsideWidth,
                prd_hole_lenght = oneProduct.PrdHoleLength,
                prd_hole_width = oneProduct.PrdHoleWidth,
            };
            _db.TM_PRD_Product.AddObject(onePrd);
            _db.SaveChanges();
            prdId = onePrd.prd_id;

            // create product instance
            //foreach (var prdIns in oneProduct.InstanceList)
            //{
            //    var pitPrdInfo = GenerateXmlFieldForProductInstrance(prdIns.PitAllInfo);
            //    var onePin = new TM_PIT_Product_Instance
            //    {
            //        prd_id = prdId,
            //        pty_id = oneProduct.PtyId,
            //        pit_price = prdIns.PitPrice,
            //        pit_purchase_price = prdIns.PitPurchasePrice,
            //        pit_ref = prdIns.PitRef,
            //        pit_description = prdIns.PitDescription,
            //        pit_prd_info = pitPrdInfo,
            //        pit_inventory_threshold = prdIns.PitInventoryThreshold
            //    };
            //    _db.TM_PIT_Product_Instance.AddObject(onePin);
            //}
            var thisprd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId);
            if (oneProduct.ExpressProps.Any() && thisprd != null)
            {
                var PrdGeneralInfoList = GetGeneralPropertyValuesFormXml(thisprd.pty_id, oneProduct.SocId, thisprd.prd_specifications);

                //var protectionIP = oneProduct.PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Protection IP");
                var protectionIP = PrdGeneralInfoList.FirstOrDefault(m => m.PropName == "Protection IP");

                var tempcolwithLumieux = oneProduct.ExpressProps.Where(m => m.Key == 1).ToList();
                var productColor = oneProduct.ExpressProps.Where(m => m.Key == 2).ToList();
                var operations = oneProduct.ExpressProps.Where(m => m.Key == 3).ToList();
                var pitPrdInfo = GetPtyProppertyValues(oneProduct.PtyId, oneProduct.SocId).Where(m => !m.PropIsSameValue).ToList();


                foreach (var oneOpe in operations)
                {
                    foreach (var oneprdCol in productColor)
                    {
                        foreach (var tcl in tempcolwithLumieux)
                        {
                            var pitRef = string.Format("{0}{1}{2}{3}{4}", oneProduct.PrdRef,
                                tcl.Value.Substring(0, 2).ToUpper(), oneOpe.Value2,
                                (protectionIP != null ? protectionIP.PropValue : "20"), oneprdCol.Value2);

                            var onepitInfo = ObjectCopier.DeepCopy(pitPrdInfo);
                            var temp = onepitInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                            if (temp != null)
                            {
                                temp.PropValue = tcl.Value.ToUpper();
                            }
                            var flux = onepitInfo.FirstOrDefault(m => m.PropName == "Flux lumineux");
                            if (flux != null)
                            {
                                flux.PropValue = tcl.Value2.ToUpper();
                            }
                            var operation = onepitInfo.FirstOrDefault(m => m.PropName == "Opération");
                            if (operation != null)
                            {
                                operation.PropValue = oneOpe.Value.ToUpper();
                            }
                            var productcolor = onepitInfo.FirstOrDefault(m => m.PropName == "Couleur de produit");
                            if (productcolor != null)
                            {
                                productcolor.PropValue = oneprdCol.Value.ToUpper();
                            }

                            var pitInfo = GenerateXmlFieldForProductInstrance(onepitInfo);

                            var onePin = new TM_PIT_Product_Instance
                            {
                                prd_id = prdId,
                                pty_id = oneProduct.PtyId,
                                pit_price = oneProduct.PrdPrice,
                                pit_purchase_price = oneProduct.PrdPurchasePrice,
                                pit_ref = pitRef,
                                //pit_description = prdIns.PitDescription,
                                pit_prd_info = pitInfo,
                                pit_inventory_threshold = 0
                            };
                            _db.TM_PIT_Product_Instance.AddObject(onePin);
                        }
                    }
                }
                _db.SaveChanges();

                if (oneProduct.SupId.HasValue && oneProduct.SupId != 0)
                {
                    // create supplier product
                    var onespr = new TR_SPR_Supplier_Product
                    {
                        sup_id = oneProduct.SupId.Value,
                        prd_id = prdId,
                        spr_price_1_100 = oneProduct.PrdPurchasePrice,
                        soc_id = oneProduct.SocId,
                        cur_id = 3, // usd
                    };
                    _db.TR_SPR_Supplier_Product.AddObject(onespr);
                    _db.SaveChanges();

                }
            }



            return prdId;
        }

        public int DuplicateProduct(Product oneProduct)
        {
            int prdId = 0;
            var oldPrd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == oneProduct.PrdId && m.soc_id == oneProduct.SocId);

            var specifications = oldPrd.prd_specifications;
            var newSpes = GetGeneralPropertyValuesFormXml(oldPrd.pty_id, oldPrd.soc_id, specifications);

            //  puissance
            var variablename = "Puissance";
            var puissance = newSpes.FirstOrDefault(m => m.PropName == variablename);
            if (puissance != null)
            {
                if (oneProduct.ExpressProps != null)
                {
                    var newValue = oneProduct.ExpressProps.FirstOrDefault(m => m.Value == variablename);
                    if (newValue != null)
                    {
                        puissance.PropValue = newValue.Value2.ToUpper();
                    }
                }
            }
            string protectIP = "20";
            variablename = "Protection IP";
            var protectionIP = newSpes.FirstOrDefault(m => m.PropName == variablename);
            if (protectionIP != null)
            {
                if (oneProduct.ExpressProps != null)
                {
                    var newValue = oneProduct.ExpressProps.FirstOrDefault(m => m.Value == variablename);
                    if (newValue != null)
                    {
                        protectionIP.PropValue = newValue.Value2.ToUpper();
                        protectIP = newValue.Value2.ToUpper();
                    }
                }
            }

            var specWithFiles = newSpes.Where(m => m.PropIsImage).ToList();
            foreach (var oneprop in specWithFiles)
            {
                oneprop.PropValue = string.Empty;
            }

            specifications = GenerateXmlFieldForGeneralInfo(newSpes);

            var onePrd = new TM_PRD_Product
            {
                prd_description = oneProduct.PrdDescription,
                pty_id = oldPrd.pty_id,
                prd_name = oneProduct.PrdName,
                prd_sub_name = oneProduct.PrdSubName,
                prd_price = oneProduct.PrdPrice,
                prd_purchase_price = oneProduct.PrdPurchasePrice,
                prd_ref = oneProduct.PrdRef,
                soc_id = oneProduct.SocId,
                //prd_file_name = oneProduct.PrdFileName,
                prd_specifications = specifications,
                prd_d_creation = DateTime.Now,
                prd_d_update = DateTime.Now,
                prd_code = GetNewProductCode(oneProduct.SocId),

                //prd_inside_diameter = oneProduct.PrdInsideDiameter,
                prd_outside_diameter = oneProduct.PrdOutsideDiameter,
                prd_length = oneProduct.PrdLength,
                prd_width = oneProduct.PrdWidth,
                prd_height = oneProduct.PrdHeight,
                prd_hole_size = oneProduct.PrdHoleSize,
                prd_depth = oneProduct.PrdDepth,
                prd_weight = oneProduct.PrdWeight,
                prd_unit_length = oneProduct.PrdUnitLength,
                prd_unit_width = oneProduct.PrdUnitWidth,
                prd_unit_height = oneProduct.PrdUnitHeight,
                prd_unit_weight = oneProduct.PrdUnitWeight,
                prd_quantity_each_carton = oneProduct.PrdQuantityEachCarton,
                prd_carton_length = oneProduct.PrdCartonLength,
                prd_carton_width = oneProduct.PrdCartonWidth,
                prd_carton_height = oneProduct.PrdCartonHeight,
                prd_carton_weight = oneProduct.PrdCartonWeight,

                prd_outside_height = oneProduct.PrdOutsideHeight,
                prd_outside_length = oneProduct.PrdOutsideLength,
                prd_outside_width = oneProduct.PrdOutsideWidth,
                prd_hole_lenght = oneProduct.PrdHoleLength,
                prd_hole_width = oneProduct.PrdHoleWidth,
            };
            _db.TM_PRD_Product.AddObject(onePrd);
            _db.SaveChanges();
            prdId = onePrd.prd_id;

            // create product instance
            var oldPits = _db.TM_PIT_Product_Instance.Where(m => m.prd_id == oneProduct.PrdId).ToList();

            var ptyPropValues = GetPtyProppertyValues(oldPrd.pty_id, oneProduct.SocId);

            foreach (var onepit in oldPits)
            {
                var pitAllInfo = GetPitKeyValues(onepit.pit_prd_info, ptyPropValues);
                var tempColor = pitAllInfo.FirstOrDefault(m => m.PropName == "Température de couleur");
                var newRef = string.Format("{0}", oneProduct.PrdRef);
                if (tempColor != null && tempColor.PropValue.Length > 2)
                {
                    newRef += tempColor.PropValue.Substring(0, 2).ToUpper();
                }
                else
                {
                    newRef += "00";
                }
                var operation = pitAllInfo.FirstOrDefault(m => m.PropName == "Opération");
                if (operation != null)
                {
                    switch (operation.PropValue)
                    {
                        case "DALI":
                            {
                                newRef += "L";
                            }
                            break;
                        case "DIMMABLE":
                            {
                                newRef += "D";
                            }
                            break;
                        case "NORMAL":
                            {
                                newRef += "N";
                            }
                            break;
                        case "DIMMABLE GRADABLE":
                            {
                                newRef += "G";
                            }
                            break;
                        default: newRef += "N"; break;
                    }
                }
                else
                {
                    newRef += "N";
                }
                newRef += protectIP;

                var oldRef = onepit.pit_ref;
                if (oldRef.Length > 2)
                {
                    try
                    {
                        newRef += oldRef.Substring(oldRef.Length - 2, 2);
                    }
                    catch (Exception)
                    {
                    }
                }

                var pitPrdInfo = GenerateXmlFieldForProductInstrance(pitAllInfo);
                var newPit = new TM_PIT_Product_Instance
                {
                    prd_id = prdId,
                    pty_id = onePrd.pty_id,
                    pit_price = onePrd.prd_price,
                    pit_purchase_price = onePrd.prd_purchase_price,
                    pit_ref = newRef,
                    pit_description = onepit.pit_description,
                    pit_prd_info = pitPrdInfo,
                    pit_inventory_threshold = onepit.pit_inventory_threshold
                };
                _db.TM_PIT_Product_Instance.AddObject(newPit);
            }
            _db.SaveChanges();
            return prdId;
        }

        public bool CheckProductRefExisted(int socId, string prdRef)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.soc_id == socId && m.prd_ref == prdRef);
            return prd != null;
        }


        public List<Product> GetSixpro()
        {
            var prds = (from prd in _db.TM_PRD_Product
                        join rmp in _db.TR_RMP_Recommended_Product on prd.prd_id equals rmp.prd_id
                        where rmp.rmp_actived
                        select new Product
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
                            ProductType = prd.TM_PTY_Product_Type.pty_name
                        }).ToList();
            return prds;
        }


        /// <summary>
        /// 
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="socId"></param>
        /// <returns></returns>
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



        /// <summary>
        /// ONLY USE FOR DATABASE OPERATION
        /// </summary>
        /// <returns></returns>
        public List<Product> GetAllProducts(int socId)
        {
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
                ProductType = prd.TM_PTY_Product_Type.pty_name
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
                            Key2 = m.pti_order,
                            Key3 = m.pal_id ?? 0,
                            Key4 = m.pit_id,
                            Value = m.pal_id.HasValue ? m.TR_PAL_Photo_Album.pal_path : m.pti_path,
                            Value2 = m.pti_description
                        }).OrderBy(m => m.Key2).ToList();
            }
            return prds;
        }

        /// <summary>
        /// 用于Product specifiactions
        /// </summary>
        /// <param name="propValues"></param>
        /// <returns></returns>
        public string GenerateXmlFieldForGeneralInfo(List<PropertyValue> propValues)
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
                    if (propValues != null)
                    {
                        foreach (var propertyValue in propValues)
                        {
                            XmlElement propName = xmlDoc.CreateElement("Propety");
                            propName.SetAttribute("PropGuid", CheckAndParseGuid(propertyValue.PropGuid).ToString());
                            propName.SetAttribute("PropValue", propertyValue.PropValue);
                            root.AppendChild(propName);
                        }
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
            }
        }

        /// <summary>
        /// 用于建立新的product
        /// </summary>
        /// <returns></returns>
        public string GenerateXmlFieldForProductInstrance(List<PropertyValue> pitAllInfo)
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
                    if (pitAllInfo != null)
                    {
                        foreach (var propertyValue in pitAllInfo)
                        {
                            XmlElement propName = xmlDoc.CreateElement("Propety");
                            propName.SetAttribute("PropGuid", CheckAndParseGuid(propertyValue.PropGuid).ToString());
                            propName.SetAttribute("PropValue", propertyValue.PropValue);
                            root.AppendChild(propName);
                        }
                    }
                    xmlDoc.AppendChild(root);
                    xmlDoc.WriteTo(xmlTextWriter);
                    xmlTextWriter.Flush();
                    return stringWriter.GetStringBuilder().ToString();
                }
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

        public bool DeleteProductInstance(int prdId, int pitId, int socId)
        {
            bool deleted = false;
            var pit =
                _db.TM_PIT_Product_Instance.FirstOrDefault(
                    m => m.pit_id == pitId && m.prd_id == prdId && m.TM_PRD_Product.soc_id == socId);
            if (pit != null)
            {
                try
                {
                    var ptyPropValues = GetPtyProppertyValues(pit.pty_id, socId).Where(m => m.PropIsImage).ToList();
                    var pitProps = GetPitKeyValues(pit.pit_prd_info, ptyPropValues);
                    foreach (var files in pitProps)
                    {
                        CommonRepository.DeleteFile(files.PropValue);
                    }
                    _db.TM_PIT_Product_Instance.DeleteObject(pit);
                    _db.SaveChanges();
                    deleted = true;
                }
                catch (Exception)
                {

                }
            }
            return deleted;
        }

        public ProductInstance GetProductInstance(int prdId, int pitId, int ptyId, int socId)
        {
            var ptyPropValues = GetPtyProppertyValues(ptyId, socId).Where(m => !m.PropIsSameValue).ToList();
            var pit =
                _db.TM_PIT_Product_Instance.Where(m => m.prd_id == prdId && m.pit_id == pitId)
                    .Select(m => new ProductInstance
                    {
                        PitId = m.pit_id,
                        PitDescription = m.pit_description,
                        PitPrice = m.pit_price,
                        PitRef = m.pit_ref,
                        PitPurchasePrice = m.pit_purchase_price,
                        PrdId = m.prd_id,
                        PitPrdInfo = m.pit_prd_info,
                        PitInventoryThreshold = m.pit_inventory_threshold,


                        // for inventory 2017-11-09
                        PrdRef = m.TM_PRD_Product.prd_ref,
                        PrdName = m.TM_PRD_Product.prd_name,
                        PrdSubName = m.TM_PRD_Product.prd_sub_name,
                        PrdCode = m.TM_PRD_Product.prd_code,
                        PrdOutsideDiameter = m.TM_PRD_Product.prd_outside_diameter,
                        PrdLength = m.TM_PRD_Product.prd_length,
                        PrdWidth = m.TM_PRD_Product.prd_width,
                        PrdHeight = m.TM_PRD_Product.prd_height,
                        ProductType = m.TM_PRD_Product.TM_PTY_Product_Type.pty_name,
                        PtyId = m.pty_id,
                    }).FirstOrDefault();
            if (pit != null)
            {
                pit.PitAllInfo = GetPitKeyValues(pit.PitPrdInfo, ptyPropValues, true);
            }
            return pit;
        }

        public List<ProductInstance> UpdateProductInstance(ProductInstance prdInstance, int socId)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdInstance.PrdId && m.soc_id == socId);
            if (prd != null)
            {
                //var allPits = GetProductInstances(prd.prd_id, prd.pty_id, socId);
                var onePit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == prdInstance.PitId);
                if (onePit != null)
                {
                    onePit.pit_description = prdInstance.PitDescription;
                    onePit.pit_price = prdInstance.PitPrice;
                    onePit.pit_purchase_price = prdInstance.PitPurchasePrice;
                    onePit.pit_ref = prdInstance.PitRef;
                    onePit.pit_prd_info = GenerateXmlFieldForProductInstrance(prdInstance.PitAllInfo);
                    onePit.pit_inventory_threshold = prdInstance.PitInventoryThreshold;
                    _db.TM_PIT_Product_Instance.ApplyCurrentValues(onePit);
                    _db.SaveChanges();
                }
                return GetProductInstances(prd.prd_id, prd.pty_id, prd.soc_id);
            }
            else
            {
                return new List<ProductInstance>();
            }
        }

        public List<ProductInstance> CreateUpdateProductInstance(ProductInstance prdInstance, int socId)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdInstance.PrdId && m.soc_id == socId);
            if (prd != null)
            {
                var onePit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == prdInstance.PitId);
                if (onePit != null)
                {
                    onePit.pit_description = prdInstance.PitDescription;
                    onePit.pit_price = prdInstance.PitPrice;
                    onePit.pit_purchase_price = prdInstance.PitPurchasePrice;
                    onePit.pit_ref = prdInstance.PitRef;
                    onePit.pit_prd_info = GenerateXmlFieldForProductInstrance(prdInstance.PitAllInfo);
                    onePit.pit_inventory_threshold = prdInstance.PitInventoryThreshold;
                    _db.TM_PIT_Product_Instance.ApplyCurrentValues(onePit);
                    _db.SaveChanges();
                }
                else
                {
                    var oneIns = new TM_PIT_Product_Instance();
                    var pitPrdInfo = GenerateXmlFieldForProductInstrance(prdInstance.PitAllInfo);
                    oneIns.prd_id = prdInstance.PrdId;
                    oneIns.pty_id = prdInstance.PtyId;
                    oneIns.pit_price = prdInstance.PitPrice;
                    oneIns.pit_ref = prdInstance.PitRef;
                    oneIns.pit_purchase_price = prdInstance.PitPurchasePrice;
                    oneIns.pit_description = prdInstance.PitDescription;
                    oneIns.pit_prd_info = pitPrdInfo;
                    oneIns.pit_inventory_threshold = prdInstance.PitInventoryThreshold;
                    _db.TM_PIT_Product_Instance.AddObject(oneIns);
                    _db.SaveChanges();
                }
                return GetProductInstances(prd.prd_id, prd.pty_id, prd.soc_id);
            }
            else
            {
                return new List<ProductInstance>();
            }
        }

        public bool DeleteProduct(int prdId, int socId)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
            bool deleted = false;
            bool withExp = false;
            if (prd != null)
            {
                var pits = _db.TM_PIT_Product_Instance.Where(m => m.prd_id == prd.prd_id).ToList();
                var ptyPropValues = GetPtyProppertyValues(prd.pty_id, socId).Where(m => m.PropIsImage).ToList();
                foreach (var tmPitProductInstance in pits)
                {
                    try
                    {
                        var pitProps = GetPitKeyValues(tmPitProductInstance.pit_prd_info, ptyPropValues);
                        foreach (var files in pitProps)
                        {
                            CommonRepository.DeleteFile(files.PropValue);
                        }
                        _db.TM_PIT_Product_Instance.DeleteObject(tmPitProductInstance);
                        _db.SaveChanges();
                    }
                    catch (Exception)
                    {
                        withExp = true;
                        break;
                    }
                }
                var pcas = _db.TR_PCA_Product_Category.Where(m => m.prd_id == prd.prd_id).ToList();
                foreach (var onepca in pcas)
                {
                    _db.TR_PCA_Product_Category.DeleteObject(onepca);
                    _db.SaveChanges();
                }
                try
                {
                    _db.TM_PRD_Product.DeleteObject(prd);
                    _db.SaveChanges();
                }
                catch (Exception)
                {
                    withExp = true;
                }
                deleted = !withExp;
            }
            return deleted;
        }

        public string GetNewProductCode(int socId, int deep = 1)
        {
            var prdCount = _db.TM_PRD_Product.Count(m => m.soc_id == socId);
            var basecount = 10000000;
            var code = basecount + prdCount + deep;
            var code2check = code.ToString();
            var checkCode = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_code == code2check);
            if (checkCode == null)
            {
                return code2check;
            }
            else
            {
                deep++;
                return GetNewProductCode(socId, deep);
            }
        }

        public void ResetPrdCode()
        {
            var prds = _db.TM_PRD_Product.ToList();
            int socId = prds.FirstOrDefault().soc_id;
            foreach (var tmPrdProduct in prds)
            {
                tmPrdProduct.prd_code = (10000000 + tmPrdProduct.prd_id).ToString();
                _db.TM_PRD_Product.ApplyCurrentValues(tmPrdProduct);
                _db.SaveChanges();
            }
        }

        /// <summary>
        /// 2024-07-29 Batch insert products
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="prdId"></param>
        /// <param name="lines"></param>
        /// <returns></returns>
        public List<ProductInstance> CreateProductFromExcel(int socId, int prdId, List<ProductInstance> lines)
        {
            var result = new List<ProductInstance>();
            var oneProduct = _db.TM_PRD_Product.FirstOrDefault(l => l.prd_id == prdId && l.soc_id == socId);
            if (lines != null && lines.Any() && oneProduct != null)
            {
                var prdGeneralInfoList = GetPtyProppertyValues(oneProduct.pty_id, oneProduct.soc_id);
                foreach (var onePitLine in lines)
                {
                    var propListExisted = (from pitinfo in onePitLine.PitAllInfo
                                           join infolst in prdGeneralInfoList on pitinfo.PropGuid equals infolst.PropGuid
                                           select pitinfo).ToList();
                    var oneIns = new TM_PIT_Product_Instance();
                    var pitPrdInfo = GenerateXmlFieldForProductInstrance(propListExisted);
                    oneIns.prd_id = prdId;
                    oneIns.pty_id = oneProduct.pty_id;
                    oneIns.pit_price = onePitLine.PitPrice;
                    oneIns.pit_ref = string.Format("{0}{1}", oneProduct.prd_ref, onePitLine.PitRef);
                    oneIns.pit_purchase_price = onePitLine.PitPurchasePrice;
                    oneIns.pit_price = onePitLine.PitPrice;
                    oneIns.pit_prd_info = pitPrdInfo;
                    oneIns.pit_inventory_threshold = 0;
                    _db.TM_PIT_Product_Instance.AddObject(oneIns);
                    _db.SaveChanges();
                }
                result = GetProductInstances(prdId, oneProduct.pty_id, socId);
            }
            return result;
        }


        /// <summary>
        /// 2024-07-29 Batch insert products
        /// </summary>
        /// <param name="socId"></param>
        /// <param name="ptyId"></param>
        /// <param name="lines"></param>
        /// <returns></returns>
        public string CreateProductFromExcelFromSearchPrd(int socId, int ptyId, List<ProductInstance> lines)
        {
            var result = string.Empty;
            if (lines != null && lines.Any())
            {
                var prdGeneralInfoList = GetPtyProppertyValues(ptyId, socId);
                // Differentiate how many products there are based on the product reference.
                var listPrd = new List<Product>();
                var pitRefs = lines.Select(l => l.PitRef.Split('-')[0].Trim()).Distinct().ToList();
                foreach (var oneRef in pitRefs)
                {
                    var onePrdList = lines.Where(l => l.PitRef.StartsWith(oneRef + '-')).ToList();
                    // create product
                    var aPrd = new Product();
                    aPrd.PtyId = ptyId;
                    aPrd.SocId = socId;
                    aPrd.PrdName = onePrdList.FirstOrDefault().PitDescription;
                    aPrd.PrdSubName = onePrdList.FirstOrDefault().PitDefaultImage;
                    aPrd.PrdRef = oneRef;

                    var InstanceList = new List<ProductInstance>();
                    foreach (var aPit in onePrdList)
                    {
                        var onePit = new ProductInstance();
                        onePit.PtyId = ptyId;
                        onePit.PitPurchasePrice = aPit.PitPurchasePrice;
                        onePit.PitRef = aPit.PitRef;
                        onePit.PitPrice = aPit.PitPrice;
                        onePit.PitDescription = string.Empty;
                        onePit.PitAllInfo = aPit.PitAllInfo;
                        InstanceList.Add(onePit);
                    }
                    aPrd.InstanceList = InstanceList;
                    var prdId = CreateUpdateProduct(aPrd);
                    result += string.Format("{0}\r\n{1}", aPrd.PrdName, result);
                }
                if (!string.IsNullOrEmpty(result))
                {
                    result += string.Format("{0}\r\nLES PRODUITS SONT BIEN IMPORTÉS", result);
                }
            }
            return result;
        }

        #region SearchProduct

        private CultureInfo ci = new CultureInfo("fr-FR");

        public List<ProductInstance> SearchProduct_Old(int ptyId, int socId, string prdCode, string prdName,
            string prdRef, List<PropertyValue> searchValues)
        {
            //var pitprds = (from prd in _db.TM_PRD_Product
            //               join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
            //               where (ptyId == 0 || prd.pty_id == ptyId)
            //                     && prd.soc_id == socId
            //                     && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
            //                     && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
            //                     && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
            //               select new { prd, pit }
            //    );

            var pitprds = (from prd in _db.TM_PRD_Product
                           from pit in _db.TM_PIT_Product_Instance
                               .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                           where (ptyId == 0 || prd.pty_id == ptyId)
                                 && prd.soc_id == socId
                                 && (string.IsNullOrEmpty(prdName.Trim()) || prd.prd_name.StartsWith(prdName.Trim()))
                                 && (string.IsNullOrEmpty(prdRef.Trim()) || prd.prd_ref.StartsWith(prdRef.Trim()))
                                 && (string.IsNullOrEmpty(prdCode.Trim()) || prd.prd_code.Contains(prdCode.Trim()))
                           select new { prd, pit }).ToList();


            //var listPits = new List<TM_PIT_Product_Instance>();
            var pitList = new List<ProductInstance>();
            int searchCount = searchValues.Count;
            var ptySearchProps = GetPtyProppertyValues(ptyId, socId).Where(m => m.PropIsSearchField).ToList();


            ProductTypeRepository ProductTypeRepository = new ProductTypeRepository();

            var prdSearchProps = pitprds.Where(m => m.pit == null).Select(m => m.prd).Select(pty => new ProductType
            {
                PtyId = pty.pty_id,
                PropertyNames =
                    ProductTypeRepository.GetPropertyValueListFromXml(pty.TM_PTY_Product_Type.pty_specifications_fields)
            }).ToList();

            foreach (var prdPit in pitprds)
            {
                var tmPit = prdPit.pit;
                if (tmPit != null)
                {
                    var allProValues = XElement.Parse(tmPit.pit_prd_info).DescendantNodes();
                    var result = (from dbProp in allProValues
                                  from searchProp in searchValues
                                      .Where(m => ((XElement)dbProp).Attribute("PropGuid").Value == m.PropGuid &&
                                                  ((XElement)dbProp).Attribute("PropValue")
                                                      .Value.StartsWith(m.PropValue, true, ci))
                                  select dbProp).ToList();
                    if (result.Count == searchCount)
                    {
                        //listPits.Add(tmPitProductInstance);
                        var onePit = new ProductInstance
                        {
                            PitId = tmPit.pit_id,
                            FId = StringCipher.EncoderSimple(tmPit.prd_id.ToString(), "prdId"),
                            PtyId = tmPit.pty_id,
                            PitDescription = tmPit.pit_description,
                            PitPrice = tmPit.pit_price,
                            PitRef = tmPit.pit_ref,
                            PitPurchasePrice = tmPit.pit_purchase_price,
                            PrdId = tmPit.prd_id,
                            //PitPrdInfo = tmPit.pit_prd_info,
                            // product fields
                            PrdName = tmPit.TM_PRD_Product.prd_name,
                            PrdRef = tmPit.TM_PRD_Product.prd_ref,
                            PrdDescription = tmPit.TM_PRD_Product.prd_description,
                            PrdCode = tmPit.TM_PRD_Product.prd_code,
                        };
                        onePit.PitAllInfo = GetPitKeyValues(tmPit.pit_prd_info, ptySearchProps);
                        pitList.Add(onePit);
                    }
                }
                else
                {
                    var prd = prdPit.prd;
                    if (prd != null)
                    {
                        //var allProValues = XElement.Parse(prd.prd_specifications).DescendantNodes();
                        //var result = new List<XNode>();
                        var result1 =
                            prdSearchProps.Where(
                                m => prd.pty_id == m.PtyId && m.PropertyNames.Any(l => l.PropIsSearchField))
                                .Select(l => l.PropertyNames.Where(m => m.PropIsSearchField))
                                .ToList();
                        var listPros = new List<PropertyValue>();
                        foreach (var proplist in result1)
                        {
                            foreach (var propV in proplist)
                            {
                                if (!listPros.Any(l => l.PropGuid == propV.PropGuid))
                                {
                                    listPros.Add(propV);
                                }
                            }
                        }
                        var onePit = new ProductInstance
                        {
                            PitId = prd.prd_id,
                            FId = StringCipher.EncoderSimple(prd.prd_id.ToString(), "prdId"),
                            PtyId = prd.pty_id,
                            PrdId = prd.prd_id,
                            // product fields
                            PrdName = prd.prd_name,
                            PrdRef = prd.prd_ref,
                            PrdDescription = prd.prd_description,
                            PrdCode = prd.prd_code
                        };
                        onePit.PitAllInfo = GetProductPropValueForSearch(listPros, prd.prd_specifications);
                        pitList.Add(onePit);
                    }
                }
            }
            return pitList;
        }

        public List<ProductInstance> SearchProduct_NoUse(int ptyId, int socId, string prdCode, string prdName, string prdRef,
            List<PropertyValue> searchValues)
        {
            var searchResult = new List<ProductInstance>();

            //var pitprds = (from prd in _db.TM_PRD_Product
            //               join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
            //               where (ptyId == 0 || prd.pty_id == ptyId)
            //                     && prd.soc_id == socId
            //                     && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
            //                     && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
            //                     && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
            //               select new { prd, pit }
            //    );

            if (ptyId == 0)
            {
                #region don't remove
                // 搜索结果只显示产品标准内容，即名称，ref和code，该项不要删除
                //var searchPrd = (from prd in _db.TM_PRD_Product
                //                 where prd.soc_id == socId
                //                       && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
                //                       && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
                //                       && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
                //                 select prd).Distinct().ToList();

                //searchResult = searchPrd.Select(prd => new ProductInstance
                //{
                //    FId = StringCipher.EncoderSimple(prd.prd_id.ToString(), "prdId"),
                //    PtyId = prd.pty_id,
                //    PrdId = prd.prd_id,
                //    PrdName = prd.prd_name,
                //    PrdRef = prd.prd_ref,
                //    PrdDescription = prd.prd_description,
                //    PrdCode = prd.prd_code
                //}).ToList();
                #endregion don't remove

                var pitprds = (from prd in _db.TM_PRD_Product
                               from pit in _db.TM_PIT_Product_Instance
                                   .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                               where (ptyId == 0 || prd.pty_id == ptyId)
                                     && prd.soc_id == socId
                                     && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
                                     && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
                                     && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
                               select new { prd, pit }).ToList();


                foreach (var prdPit in pitprds)
                {
                    var tmPit = prdPit.pit;
                    if (tmPit != null)
                    {
                        var onePit = new ProductInstance
                        {
                            PitId = tmPit.pit_id,
                            FId = StringCipher.EncoderSimple(tmPit.prd_id.ToString(), "prdId"),
                            PtyId = tmPit.pty_id,
                            PitDescription = tmPit.pit_description,
                            PitPrice = tmPit.pit_price,
                            PitRef = tmPit.pit_ref,
                            PitPurchasePrice = tmPit.pit_purchase_price,
                            PrdId = tmPit.prd_id,
                            PrdName = tmPit.TM_PRD_Product.prd_name,
                            PrdRef = tmPit.TM_PRD_Product.prd_ref,
                            PrdDescription = tmPit.TM_PRD_Product.prd_description,
                            PrdCode = tmPit.TM_PRD_Product.prd_code,
                            ProductSuppliers = tmPit.TM_PRD_Product.TR_SPR_Supplier_Product.Select(l => l.TM_SUP_Supplier.sup_company_name),
                            PitInventory = tmPit.TM_INV_Inventory.Any() ? tmPit.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0
                        };
                        searchResult.Add(onePit);
                    }
                }
            }
            else
            {
                var pitprds = (from prd in _db.TM_PRD_Product
                               from pit in _db.TM_PIT_Product_Instance
                                   .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                               where (ptyId == 0 || prd.pty_id == ptyId)
                                     && prd.soc_id == socId
                                     && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
                                     && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
                                     && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
                               select new { prd, pit }).ToList();

                int searchCount = searchValues.Count;
                var ptySearchProps = GetPtyProppertyValues(ptyId, socId).Where(m => m.PropIsSearchField).ToList();

                foreach (var prdPit in pitprds)
                {
                    var tmPit = prdPit.pit;
                    if (tmPit != null)
                    {
                        var allProValues = XElement.Parse(tmPit.pit_prd_info).DescendantNodes();
                        var result = (from dbProp in allProValues
                                      from searchProp in searchValues
                                          .Where(m => ((XElement)dbProp).Attribute("PropGuid").Value == m.PropGuid &&
                                                      ((XElement)dbProp).Attribute("PropValue")
                                                          .Value.StartsWith(m.PropValue, true, ci))
                                      select dbProp).ToList();
                        if (result.Count == searchCount)
                        {
                            var onePit = new ProductInstance
                            {
                                PitId = tmPit.pit_id,
                                FId = StringCipher.EncoderSimple(tmPit.prd_id.ToString(), "prdId"),
                                PtyId = tmPit.pty_id,
                                PitDescription = tmPit.pit_description,
                                PitPrice = tmPit.pit_price,
                                PitRef = tmPit.pit_ref,
                                PitPurchasePrice = tmPit.pit_purchase_price,
                                PrdId = tmPit.prd_id,
                                //PitPrdInfo = tmPit.pit_prd_info,
                                // product fields
                                PrdName = tmPit.TM_PRD_Product.prd_name,
                                PrdRef = tmPit.TM_PRD_Product.prd_ref,
                                //PrdRef = tmPit.pit_ref,
                                PrdDescription = tmPit.TM_PRD_Product.prd_description,
                                PrdCode = tmPit.TM_PRD_Product.prd_code,
                                ProductSuppliers = tmPit.TM_PRD_Product.TR_SPR_Supplier_Product.Select(l => l.TM_SUP_Supplier.sup_company_name),
                                PitInventoryThreshold = tmPit.pit_inventory_threshold,
                                PitInventory = tmPit.TM_INV_Inventory.Any() ? tmPit.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0
                            };
                            onePit.PitAllInfo = GetPitKeyValues(tmPit.pit_prd_info, ptySearchProps);
                            searchResult.Add(onePit);
                        }
                    }
                }
            }
            return searchResult;
        }

        public List<ProductInstance> SearchProduct_old2(int ptyId, int socId, string prdInfo, List<PropertyValue> searchValues)
        {
            var searchResult = new List<ProductInstance>();

            //var pitprds = (from prd in _db.TM_PRD_Product
            //               join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
            //               where (ptyId == 0 || prd.pty_id == ptyId)
            //                     && prd.soc_id == socId
            //                     && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
            //                     && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
            //                     && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
            //               select new { prd, pit }
            //    );

            if (ptyId == 0)
            {
                #region don't remove
                // 搜索结果只显示产品标准内容，即名称，ref和code，该项不要删除
                //var searchPrd = (from prd in _db.TM_PRD_Product
                //                 where prd.soc_id == socId
                //                       && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
                //                       && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
                //                       && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
                //                 select prd).Distinct().ToList();

                //searchResult = searchPrd.Select(prd => new ProductInstance
                //{
                //    FId = StringCipher.EncoderSimple(prd.prd_id.ToString(), "prdId"),
                //    PtyId = prd.pty_id,
                //    PrdId = prd.prd_id,
                //    PrdName = prd.prd_name,
                //    PrdRef = prd.prd_ref,
                //    PrdDescription = prd.prd_description,
                //    PrdCode = prd.prd_code
                //}).ToList();
                #endregion don't remove

                var pitprds = (from prd in _db.TM_PRD_Product
                               from pit in _db.TM_PIT_Product_Instance
                                   .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                               where (ptyId == 0 || prd.pty_id == ptyId)
                                     && prd.soc_id == socId
                                     && (
                                     string.IsNullOrEmpty(prdInfo)
                                     || prd.prd_name.Contains(prdInfo)
                                     || prd.prd_code.Contains(prdInfo)
                                     || prd.prd_sub_name.Contains(prdInfo)
                                     || pit.pit_ref.Contains(prdInfo))
                               select new { prd, pit }).ToList();


                foreach (var prdPit in pitprds)
                {
                    var tmPit = prdPit.pit;
                    if (tmPit != null)
                    {
                        var onePit = new ProductInstance
                        {
                            PitId = tmPit.pit_id,
                            FId = StringCipher.EncoderSimple(tmPit.prd_id.ToString(), "prdId"),
                            PtyId = tmPit.pty_id,
                            PitDescription = tmPit.pit_description,
                            PitPrice = tmPit.pit_price,
                            PitRef = tmPit.pit_ref,
                            PitPurchasePrice = tmPit.pit_purchase_price,
                            PrdId = tmPit.prd_id,
                            PrdName = tmPit.TM_PRD_Product.prd_name,
                            PrdRef = tmPit.TM_PRD_Product.prd_ref,
                            PrdDescription = tmPit.TM_PRD_Product.prd_description,
                            PrdCode = tmPit.TM_PRD_Product.prd_code,
                            ProductSuppliers = tmPit.TM_PRD_Product.TR_SPR_Supplier_Product.Select(l => l.TM_SUP_Supplier.sup_company_name),
                            PitInventoryThreshold = tmPit.pit_inventory_threshold
                        };
                        searchResult.Add(onePit);
                    }
                }
            }
            else
            {
                var pitprds = (from prd in _db.TM_PRD_Product
                               from pit in _db.TM_PIT_Product_Instance
                                   .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                               where (ptyId == 0 || prd.pty_id == ptyId)
                                     && prd.soc_id == socId
                                     && (string.IsNullOrEmpty(prdInfo)
                                     || prd.prd_name.Contains(prdInfo)
                                     || prd.prd_ref.Contains(prdInfo)
                                     || prd.prd_code.Contains(prdInfo)
                                     || prd.prd_sub_name.Contains(prdInfo))
                               select new { prd, pit }).ToList();

                int searchCount = searchValues.Count;
                var ptySearchProps = GetPtyProppertyValues(ptyId, socId).Where(m => m.PropIsSearchField).ToList();

                foreach (var prdPit in pitprds)
                {
                    var tmPit = prdPit.pit;
                    if (tmPit != null)
                    {
                        var allProValues = XElement.Parse(tmPit.pit_prd_info).DescendantNodes();
                        var result = (from dbProp in allProValues
                                      from searchProp in searchValues
                                          .Where(m => ((XElement)dbProp).Attribute("PropGuid").Value == m.PropGuid &&
                                                      ((XElement)dbProp).Attribute("PropValue")
                                                          .Value.StartsWith(m.PropValue, true, ci))
                                      select dbProp).ToList();
                        if (result.Count == searchCount)
                        {
                            var onePit = new ProductInstance
                            {
                                PitId = tmPit.pit_id,
                                FId = StringCipher.EncoderSimple(tmPit.prd_id.ToString(), "prdId"),
                                PtyId = tmPit.pty_id,
                                PitDescription = tmPit.pit_description,
                                PitPrice = tmPit.pit_price,
                                PitRef = tmPit.pit_ref,
                                PitPurchasePrice = tmPit.pit_purchase_price,
                                PrdId = tmPit.prd_id,
                                //PitPrdInfo = tmPit.pit_prd_info,
                                // product fields
                                PrdName = tmPit.TM_PRD_Product.prd_name,
                                PrdRef = tmPit.TM_PRD_Product.prd_ref,
                                //PrdRef = tmPit.pit_ref,
                                PrdDescription = tmPit.TM_PRD_Product.prd_description,
                                PrdCode = tmPit.TM_PRD_Product.prd_code,
                                ProductSuppliers = tmPit.TM_PRD_Product.TR_SPR_Supplier_Product.Select(l => l.TM_SUP_Supplier.sup_company_name),
                                PitInventoryThreshold = tmPit.pit_inventory_threshold,
                            };
                            onePit.PitAllInfo = GetPitKeyValues(tmPit.pit_prd_info, ptySearchProps);
                            searchResult.Add(onePit);
                        }
                    }
                }
            }
            return searchResult;
        }

        public List<ProductInstance> SearchProduct_OldBefore202311(int ptyId, int socId, string prdInfo, List<PropertyValue> searchValues)
        {
            var searchResult = new List<ProductInstance>();

            //var pitprds = (from prd in _db.TM_PRD_Product
            //               join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
            //               where (ptyId == 0 || prd.pty_id == ptyId)
            //                     && prd.soc_id == socId
            //                     && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
            //                     && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
            //                     && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
            //               select new { prd, pit }
            //    );

            if (ptyId == 0)
            {
                #region don't remove
                // 搜索结果只显示产品标准内容，即名称，ref和code，该项不要删除
                //var searchPrd = (from prd in _db.TM_PRD_Product
                //                 where prd.soc_id == socId
                //                       && (string.IsNullOrEmpty(prdName) || prd.prd_name.StartsWith(prdName))
                //                       && (string.IsNullOrEmpty(prdRef) || prd.prd_ref.StartsWith(prdRef))
                //                       && (string.IsNullOrEmpty(prdCode) || prd.prd_code.Contains(prdCode))
                //                 select prd).Distinct().ToList();

                //searchResult = searchPrd.Select(prd => new ProductInstance
                //{
                //    FId = StringCipher.EncoderSimple(prd.prd_id.ToString(), "prdId"),
                //    PtyId = prd.pty_id,
                //    PrdId = prd.prd_id,
                //    PrdName = prd.prd_name,
                //    PrdRef = prd.prd_ref,
                //    PrdDescription = prd.prd_description,
                //    PrdCode = prd.prd_code
                //}).ToList();
                #endregion don't remove

                var pitprds = (from prd in _db.TM_PRD_Product
                               from pit in _db.TM_PIT_Product_Instance
                                   .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                               where (ptyId == 0 || prd.pty_id == ptyId)
                                     && prd.soc_id == socId
                                     && (
                                     string.IsNullOrEmpty(prdInfo)
                                     || prd.prd_name.Contains(prdInfo)
                                     || prd.prd_ref.Contains(prdInfo)
                                     || prd.prd_code.Contains(prdInfo)
                                     || prd.prd_sub_name.Contains(prdInfo)
                                     || pit.pit_ref.Contains(prdInfo))
                               select prd).DistinctBy(m => m.prd_id).ToList();


                foreach (var prdPit in pitprds)
                {
                    var tmPit = prdPit;
                    if (tmPit != null)
                    {
                        var onePit = new ProductInstance
                        {
                            FId = StringCipher.EncoderSimple(tmPit.prd_id.ToString(), "prdId"),
                            PtyId = tmPit.pty_id,
                            PrdId = tmPit.prd_id,
                            PrdName = tmPit.prd_name,
                            PrdRef = tmPit.prd_ref,
                            PrdDescription = tmPit.prd_description,
                            PrdCode = tmPit.prd_code,
                            PrdSepcifications = tmPit.prd_specifications,
                            ProductSuppliers = tmPit.TR_SPR_Supplier_Product.Select(l => l.TM_SUP_Supplier.sup_company_name),
                            PrdOutsideDiameter = tmPit.prd_outside_diameter,
                            PrdLength = tmPit.prd_length,
                            PrdWidth = tmPit.prd_width,
                            PrdHeight = tmPit.prd_height,
                            //PitInventoryThreshold = tmPit.pit_inventory_threshold
                        };
                        searchResult.Add(onePit);
                    }
                }

                var ptyIds = searchResult.Select(m => m.PtyId).Distinct().ToList();
                var ptyDict = new Dictionary<int, List<PropertyValue>>();

                foreach (var aptyId in ptyIds)
                {
                    if (!ptyDict.Any(l => l.Key == aptyId))
                    {
                        var proplist = GetPtyProppertyValues(aptyId, 1);
                        ptyDict.Add(aptyId, proplist);
                    }
                }

                searchResult.ForEach(m =>
                {
                    m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                    var oneprops = ptyDict.FirstOrDefault(l => l.Key == m.PtyId);
                    PropertyValue power = null;
                    if (oneprops.Key != 0)
                    {
                        var powerGuid = oneprops.Value.FirstOrDefault(l => l.PropName == "Puissance");
                        power = GetPrdPropertyValues(m.PrdSepcifications).FirstOrDefault(l => powerGuid != null && l.PropGuid == powerGuid.PropGuid);
                        if (power != null && powerGuid != null)
                        {
                            power.PropUnit = powerGuid.PropUnit;
                        }
                    }
                    var diameter = string.Format("{0:0}", (m.PrdOutsideDiameter.HasValue && m.PrdOutsideDiameter > 0) ? m.PrdOutsideDiameter : null);
                    diameter = !string.IsNullOrEmpty(diameter) ? (string.Format("Ø{0:0}", diameter)) : (string.Format("{0:0}x{1:0}", m.PrdLength, m.PrdWidth));
                    diameter += "mm";


                    var PrdRef = string.Format("{0} {1} {2} {3}",
                        m.PrdRef,
                        m.PrdSubName,
                        (power != null ? (power.PropValue + power.PropUnit) : string.Empty),
                        diameter
                        );
                    m.PrdRef = PrdRef.Trim();
                });

            }
            else
            {
                var pitprds = (from prd in _db.TM_PRD_Product
                               from pit in _db.TM_PIT_Product_Instance
                                   .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                               where (ptyId == 0 || prd.pty_id == ptyId)
                                     && prd.soc_id == socId
                                     && (
                                     string.IsNullOrEmpty(prdInfo)
                                     || prd.prd_name.Contains(prdInfo)
                                     || prd.prd_ref.Contains(prdInfo)
                                     || prd.prd_code.Contains(prdInfo)
                                     || prd.prd_sub_name.Contains(prdInfo)
                                     || pit.pit_ref.Contains(prdInfo))
                               select new { prd, pit }).ToList();

                int searchCount = searchValues.Count;
                var ptySearchProps = GetPtyProppertyValues(ptyId, socId).Where(m => m.PropIsSearchField || m.PropName == "Puissance").ToList();

                foreach (var prdPit in pitprds)
                {
                    var tmPit = prdPit.pit;
                    if (tmPit != null)
                    {
                        var allProValues = XElement.Parse(tmPit.pit_prd_info).DescendantNodes();
                        var result = (from dbProp in allProValues
                                      from searchProp in searchValues
                                          .Where(m => ((XElement)dbProp).Attribute("PropGuid").Value == m.PropGuid &&
                                                      ((XElement)dbProp).Attribute("PropValue")
                                                          .Value.StartsWith(m.PropValue, true, ci))
                                      select dbProp).ToList();
                        if (result.Count == searchCount)
                        {
                            var onePit = new ProductInstance
                            {
                                PitId = tmPit.pit_id,
                                FId = StringCipher.EncoderSimple(tmPit.prd_id.ToString(), "prdId"),
                                PtyId = tmPit.pty_id,
                                PitDescription = tmPit.pit_description,
                                PitPrice = tmPit.pit_price,
                                PitRef = tmPit.pit_ref,
                                PitPurchasePrice = tmPit.pit_purchase_price,
                                PrdId = tmPit.prd_id,
                                //PitPrdInfo = tmPit.pit_prd_info,
                                // product fields
                                PrdName = tmPit.TM_PRD_Product.prd_name,
                                PrdRef = tmPit.TM_PRD_Product.prd_ref,
                                //PrdRef = tmPit.pit_ref,
                                PrdDescription = tmPit.TM_PRD_Product.prd_description,
                                PrdCode = tmPit.TM_PRD_Product.prd_code,
                                ProductSuppliers = tmPit.TM_PRD_Product.TR_SPR_Supplier_Product.Select(l => l.TM_SUP_Supplier.sup_company_name),
                                PitInventoryThreshold = tmPit.pit_inventory_threshold,
                                PrdSepcifications = tmPit.TM_PRD_Product.prd_specifications,
                                PrdOutsideDiameter = tmPit.TM_PRD_Product.prd_outside_diameter,
                                PrdLength = tmPit.TM_PRD_Product.prd_length,
                                PrdWidth = tmPit.TM_PRD_Product.prd_width,
                                PrdHeight = tmPit.TM_PRD_Product.prd_height,
                            };
                            onePit.PitAllInfo = GetPitKeyValues(tmPit.pit_prd_info, ptySearchProps);
                            searchResult.Add(onePit);
                        }
                    }
                }
                searchResult.ForEach(m =>
                {
                    m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                    var oneprops = ptySearchProps;
                    PropertyValue power = null;

                    var powerGuid = oneprops.FirstOrDefault(l => l.PropName == "Puissance");
                    power = GetPrdPropertyValues(m.PrdSepcifications).FirstOrDefault(l => powerGuid != null && l.PropGuid == powerGuid.PropGuid);
                    if (power != null && powerGuid != null)
                    {
                        power.PropUnit = powerGuid.PropUnit;
                    }

                    var diameter = string.Format("{0:0}", (m.PrdOutsideDiameter.HasValue && m.PrdOutsideDiameter > 0) ? m.PrdOutsideDiameter : null);
                    diameter = !string.IsNullOrEmpty(diameter) ? (string.Format("Ø{0:0}", diameter)) : (string.Format("{0:0}x{1:0}", m.PrdLength, m.PrdWidth));
                    diameter += "mm";


                    var PrdRef = string.Format("{0} {1} {2} {3}",
                        m.PrdRef,
                        m.PrdSubName,
                        (power != null ? (power.PropValue + power.PropUnit) : string.Empty),
                        diameter
                        );
                    m.PrdRef = PrdRef.Trim();
                });
            }
            return searchResult;
        }

        public List<Product> SearchProduct(int ptyId, int socId, string prdInfo, List<PropertyValue> searchValues)
        {
            //var test = (from prd in _db.TM_PRD_Product
            //            join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
            //             into leftJ
            //            from lj in leftJ.DefaultIfEmpty()
            //            where
            //            (ptyId == 0 || prd.pty_id == ptyId) &&
            //            prd.soc_id == socId
            //                  && ((string.IsNullOrEmpty(prdInfo) || prd.prd_name.Contains(prdInfo))
            //                  || (string.IsNullOrEmpty(prdInfo) || prd.prd_ref.Contains(prdInfo))
            //                  || (string.IsNullOrEmpty(prdInfo) || prd.prd_code.Contains(prdInfo))
            //                  || (string.IsNullOrEmpty(prdInfo) || prd.prd_sub_name.Contains(prdInfo))
            //                  || (string.IsNullOrEmpty(prdInfo) || lj.pit_ref.Contains(prdInfo)))
            //            select prd).DistinctBy(m => m.prd_id).ToList();
            var resultlist = (from prd in _db.TM_PRD_Product
                              from pit in _db.TM_PIT_Product_Instance
                                  .Where(m => m.prd_id == prd.prd_id).DefaultIfEmpty()
                              where (ptyId == 0 || prd.pty_id == ptyId)
                                    && prd.soc_id == socId
                                    && ((string.IsNullOrEmpty(prdInfo) || prd.prd_name.Contains(prdInfo))
                                    || (string.IsNullOrEmpty(prdInfo) || prd.prd_ref.Contains(prdInfo))
                                    || (string.IsNullOrEmpty(prdInfo) || prd.prd_code.Contains(prdInfo))
                                    || (string.IsNullOrEmpty(prdInfo) || prd.prd_sub_name.Contains(prdInfo))
                                    || (string.IsNullOrEmpty(prdInfo) || pit.pit_ref.Contains(prdInfo)))
                              select prd).DistinctBy(m => m.prd_id).ToList().Select(prd => new Product()
                              {
                                  SocId = prd.soc_id,
                                  PtyId = prd.pty_id,
                                  PrdDescription = prd.prd_description,
                                  PrdId = prd.prd_id,
                                  PrdName = prd.prd_name,
                                  PrdPrice = prd.prd_price,
                                  PrdRef = prd.prd_ref,
                                  PrdPurchasePrice = prd.prd_purchase_price,
                                  PrdFileName = prd.prd_file_name,
                                  PrdSubName = prd.prd_sub_name,
                                  PrdCode = prd.prd_code,
                                  // 设置默认图片
                                  PrdImg =
                            prd.TI_PIM_Product_Image.Any()
                                ? (prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                                    ? prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order)
                                        .FirstOrDefault()
                                        .TR_PAL_Photo_Album.pal_path
                                    : prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                                : string.Empty,
                                  PrdSepcifications = prd.prd_specifications,
                                  ProductSuppliers = prd.TR_SPR_Supplier_Product.Any() ? prd.TR_SPR_Supplier_Product.Select(l => l.TM_SUP_Supplier.sup_company_name) : new List<string>(),
                                  FId = StringCipher.EncoderSimple(prd.prd_id.ToString(), "prdId"),
                                  InstanceList = prd.TM_PIT_Product_Instance.Select(tmPit => new ProductInstance()
                                  {
                                      PitId = tmPit.pit_id,
                                      PtyId = tmPit.pty_id,
                                      PitDescription = tmPit.pit_description,
                                      PitPrice = tmPit.pit_price,
                                      PitRef = tmPit.pit_ref,
                                      // todo : 需要得到库存中的平均进价，或者通过计算得到进价
                                      PitPurchasePrice = tmPit.pit_purchase_price,
                                      PrdId = tmPit.prd_id,
                                      PitPrdInfo = tmPit.pit_prd_info,
                                      PrdName = tmPit.TM_PRD_Product.prd_name,
                                      PrdSubName = tmPit.TM_PRD_Product.prd_sub_name,
                                      //PrdOutsideDiameter = tmPit.TM_PRD_Product.prd_outside_diameter,
                                      //PrdLength = tmPit.TM_PRD_Product.prd_length,
                                      //PrdWidth = tmPit.TM_PRD_Product.prd_width,
                                      //PrdHeight = tmPit.TM_PRD_Product.prd_height,
                                      PrdSepcifications = tmPit.TM_PRD_Product.prd_specifications,
                                      //PitInventoryThreshold = tmPit.pit_inventory_threshold,
                                      //PitInventory = tmPit.TM_INV_Inventory.Any() ? tmPit.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0
                                  }).ToList()
                              }).ToList();
            return resultlist;
        }

        public List<ProductInCategory> SearchProductForSite(int socId, string prdInfo)
        {
            var pitprds = (from prd in _db.TM_PRD_Product
                           where prd.soc_id == socId
                                 && (
                                     string.IsNullOrEmpty(prdInfo)
                                     || prd.prd_name.Contains(prdInfo)
                                     || prd.prd_ref.Contains(prdInfo)
                                     || prd.prd_code.Contains(prdInfo)
                                     || prd.prd_sub_name.Contains(prdInfo))
                           select prd).Distinct().ToList();


            return pitprds.Select(prdPit => new ProductInCategory
            {
                Product = new Product
                {
                    PrdDescription = prdPit.prd_description,
                    PrdId = prdPit.prd_id,
                    PrdName = prdPit.prd_name,
                    PrdSubName = prdPit.prd_sub_name,
                    PrdPrice = prdPit.prd_price,
                    PrdRef = prdPit.prd_ref,
                    PrdPurchasePrice = prdPit.prd_purchase_price,
                    PrdFileName = prdPit.prd_file_name,
                    PrdCode = prdPit.prd_code,
                    //PrdInsideDiameter = prdPit.prd_inside_diameter,
                    PrdOutsideDiameter = prdPit.prd_outside_diameter,
                    PrdLength = prdPit.prd_length,
                    PrdWidth = prdPit.prd_width,
                    PrdHeight = prdPit.prd_height,
                    PrdHoleSize = prdPit.prd_hole_size,
                    PrdDepth = prdPit.prd_depth,
                    PrdWeight = prdPit.prd_weight,
                    PrdUnitLength = prdPit.prd_unit_length,
                    PrdUnitWidth = prdPit.prd_unit_width,
                    PrdUnitHeight = prdPit.prd_unit_height,
                    PrdUnitWeight = prdPit.prd_unit_weight,
                    PrdQuantityEachCarton = prdPit.prd_quantity_each_carton,
                    PrdCartonLength = prdPit.prd_carton_length,
                    PrdCartonWidth = prdPit.prd_carton_width,
                    PrdCartonHeight = prdPit.prd_carton_height,
                    PrdCartonWeight = prdPit.prd_carton_weight,
                    ProductType = prdPit.TM_PTY_Product_Type.pty_name,
                    PrdImg = prdPit.TI_PIM_Product_Image.Any() ? prdPit.TI_PIM_Product_Image.FirstOrDefault().pim_path : string.Empty,
                    PtyId = prdPit.pty_id,
                    FId = StringCipher.EncoderSimple(prdPit.prd_id.ToString(), "prdId"),
                    SubPrdCount = prdPit.TM_PIT_Product_Instance.Count,
                    PrdGeneralInfoList = GetGeneralPropertyValuesFormXml(prdPit.pty_id, socId, prdPit.prd_specifications,
                    true).Where(m => m.PropName == "Puissance").ToList()
                }
            }).ToList();
        }


        public List<PropertyValue> GetProductPropValueForSearch(List<PropertyValue> searchValues, string prdProps)
        {
            var listPrdProps = GetPrdPropertyValues(prdProps);
            var resultList = (from prop in searchValues
                              join aprdprop in listPrdProps on prop.PropGuid equals aprdprop.PropGuid
                              select prop).ToList();
            return resultList;
        }

        /// <summary>
        /// 为搜索而建立
        /// </summary>
        /// <param name="listNodes"></param>
        /// <param name="listPtyProps"></param>
        /// <returns></returns>
        public List<PropertyValue> GetProductInstancePropsForSearch(List<XNode> listNodes,
            List<PropertyValue> listPtyProps)
        {
            var result = new List<PropertyValue>();
            if (listNodes != null && listNodes.Any())
            {
                string xml = listNodes.Aggregate("<PropertyList>", (current, oneNode) => current + oneNode.ToString());
                xml += "</PropertyList>";
                result = GetPitKeyValues(xml, listPtyProps);
            }
            return result;
        }

        #endregion SearchProduct

        #region Product Photo

        /// <summary>
        /// 给商品添加图片
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="socId"></param>
        /// <param name="path"></param>
        /// <param name="des"></param>
        /// <param name="order"></param>
        /// <param name="pimId"></param>
        /// <param name="palId"></param>
        public void AddUpdateProductPhoto(int prdId, int socId, string path, string des, int order = 1, int pimId = 0, int palId = 0)
        {
            int pim_id = 0;
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
            var pal = _db.TR_PAL_Photo_Album.FirstOrDefault(m => m.pal_id == palId && m.TR_ALB_Album.soc_id == socId);
            if (prd != null)
            {
                bool iscreate = false;
                if (pimId != 0)
                {
                    // update
                    var pim = _db.TI_PIM_Product_Image.FirstOrDefault(m => m.prd_id == prdId && m.pim_id == pimId);
                    if (pim != null)
                    {
                        if (pal == null)
                        {
                            pim.pal_id = null;
                            pim.pim_path = path;
                        }
                        else
                        {
                            pim.pal_id = pal.pal_id;
                            pim.pim_path = null;
                        }
                        pim.pim_description = des;
                        pim.pim_order = order;
                        _db.TI_PIM_Product_Image.ApplyCurrentValues(pim);
                        _db.SaveChanges();
                        pim_id = pim.pim_id;
                    }
                    else
                    {
                        iscreate = true;
                    }
                }
                else
                {
                    iscreate = true;
                }
                if (iscreate)
                {
                    var newPim = new TI_PIM_Product_Image
                    {
                        prd_id = prdId,
                        pal_id = pal != null ? pal.pal_id : (int?)null,
                        pim_path = path,
                        pim_description = des,
                        pim_order = order,
                    };
                    _db.TI_PIM_Product_Image.AddObject(newPim);
                    _db.SaveChanges();
                    pim_id = newPim.pim_id;
                }
                //ReSortProductPhoto(prdId, pim_id);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="pimId">整体排序</param>
        private void ReSortProductPhoto(int prdId, int pimId = 0)
        {
            var allPims = _db.TI_PIM_Product_Image.Where(m => m.prd_id == prdId).ToList();
            if (pimId != 0)
            {
                var onePim = allPims.FirstOrDefault(m => m.pim_id == pimId);
                if (onePim != null)
                {
                    var smaller = allPims.Where(m => m.pim_order < onePim.pim_order).OrderBy(m => m.pim_order);
                    var bigger =
                        allPims.Where(m => m.pim_order >= onePim.pim_order && m.pim_id != onePim.pim_id)
                            .OrderBy(m => m.pim_order);
                    int order = 1;
                    foreach (var pim in smaller)
                    {
                        pim.pim_order = order;
                        order++;
                        _db.TI_PIM_Product_Image.ApplyCurrentValues(pim);
                    }
                    onePim.pim_order = order;
                    _db.TI_PIM_Product_Image.ApplyCurrentValues(onePim);
                    order++;
                    foreach (var pim in bigger)
                    {
                        pim.pim_order = order;
                        order++;
                        _db.TI_PIM_Product_Image.ApplyCurrentValues(pim);
                    }
                    _db.SaveChanges();
                }
            }
            else
            {
                int order = 1;
                allPims = allPims.OrderBy(m => m.pim_order).ToList();
                foreach (var pim in allPims)
                {
                    pim.pim_order = order;
                    order++;
                    _db.TI_PIM_Product_Image.ApplyCurrentValues(pim);
                }
                _db.SaveChanges();
            }
        }

        public List<KeyValue> LoadProductImages(int prdId, int socId)
        {
            var pims = (from prd in _db.TM_PRD_Product
                        join pim in _db.TI_PIM_Product_Image on prd.prd_id equals pim.prd_id
                        where prd.prd_id == prdId && prd.soc_id == socId
                        select pim).Distinct().Select(m => new KeyValue
                        {
                            Key = m.pim_id,
                            Key2 = m.pim_order,
                            Value = m.pal_id.HasValue ? m.TR_PAL_Photo_Album.pal_path : m.pim_path,
                            Value2 = m.pim_description,
                            Key3 = m.pal_id ?? 0
                        }).OrderBy(m => m.Key2).ToList();
            return pims;
        }

        public void DeleteProductImages(int prdId, int socId, int pimId)
        {
            var onepim = (from prd in _db.TM_PRD_Product
                          join pim in _db.TI_PIM_Product_Image on prd.prd_id equals pim.prd_id
                          where prd.prd_id == prdId && prd.soc_id == socId && pim.pim_id == pimId
                          select pim).FirstOrDefault();
            if (onepim != null)
            {
                if (!onepim.pal_id.HasValue)
                {
                    CommonRepository.DeleteFile(onepim.pim_path);
                }
                _db.TI_PIM_Product_Image.DeleteObject(onepim);
                _db.SaveChanges();
                //ReSortProductPhoto(prdId);
            }
        }

        #endregion Product Photo

        #region Product Instance Photo

        public void AddUpdatePitPhoto(int prdId, int socId, string path, string des, int pitId, int order = 1, int palId = 0, int ptiId = 0)
        {
            var onepit = (from prd in _db.TM_PRD_Product
                          join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
                          where prd.prd_id == prdId && prd.soc_id == socId && pit.pit_id == pitId
                          select pit).FirstOrDefault();
            var pal = _db.TR_PAL_Photo_Album.FirstOrDefault(m => m.pal_id == palId && m.TR_ALB_Album.soc_id == socId);
            if (onepit != null)
            {
                if (ptiId == 0)
                {
                    // only creation, no update
                    var pti = new TI_PTI_Product_Instance_Image
                    {
                        pit_id = pitId,
                        pal_id = pal != null ? pal.pal_id : (int?)null,
                        pti_path = path,
                        pti_description = des,
                        pti_order = order
                    };
                    _db.TI_PTI_Product_Instance_Image.AddObject(pti);
                    _db.SaveChanges();
                    ptiId = pti.pti_id;
                }
                else
                {
                    var onePti = _db.TI_PTI_Product_Instance_Image.FirstOrDefault(m => m.pit_id == pitId && m.pti_id == ptiId);
                    if (onePti != null)
                    {
                        onePti.pal_id = pal != null ? pal.pal_id : (int?)null;
                        onePti.pti_path = path;
                        onePti.pti_description = des;
                        onePti.pti_order = order;
                        _db.TI_PTI_Product_Instance_Image.ApplyCurrentValues(onePti);
                        _db.SaveChanges();
                    }
                }
                ReSortProductInstancePhoto(pitId, ptiId);
            }
        }

        public void DeletePitImages(int prdId, int socId, int ptiId)
        {
            var onepti = (from prd in _db.TM_PRD_Product
                          join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
                          join pti in _db.TI_PTI_Product_Instance_Image on pit.pit_id equals pti.pit_id
                          where prd.prd_id == prdId && prd.soc_id == socId && pti.pti_id == ptiId
                          select pti).FirstOrDefault();
            if (onepti != null)
            {
                if (!onepti.pal_id.HasValue)
                {
                    CommonRepository.DeleteFile(onepti.pti_path);
                }
                _db.TI_PTI_Product_Instance_Image.DeleteObject(onepti);
                _db.SaveChanges();
                ReSortProductInstancePhoto(onepti.pit_id);
            }
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="pitId"></param>
        /// <param name="ptiId">整体排序</param>
        private void ReSortProductInstancePhoto(int pitId, int ptiId = 0)
        {
            var allPtis = _db.TI_PTI_Product_Instance_Image.Where(m => m.pit_id == pitId).ToList();
            if (ptiId != 0)
            {
                var onepti = allPtis.FirstOrDefault(m => m.pti_id == ptiId);
                if (onepti != null)
                {
                    var smaller = allPtis.Where(m => m.pti_order < onepti.pti_order).OrderBy(m => m.pti_order);
                    var bigger =
                        allPtis.Where(m => m.pti_order >= onepti.pti_order && m.pti_id != onepti.pti_id)
                        .OrderBy(m => m.pti_order);
                    int order = 1;
                    foreach (var pim in smaller)
                    {
                        pim.pti_order = order;
                        order++;
                        _db.TI_PTI_Product_Instance_Image.ApplyCurrentValues(pim);
                    }
                    onepti.pti_order = order;
                    _db.TI_PTI_Product_Instance_Image.ApplyCurrentValues(onepti);
                    order++;
                    foreach (var pim in bigger)
                    {
                        pim.pti_order = order;
                        order++;
                        _db.TI_PTI_Product_Instance_Image.ApplyCurrentValues(pim);
                    }
                    _db.SaveChanges();
                }
            }
            else
            {
                int order = 1;
                allPtis = allPtis.OrderBy(m => m.pti_order).ToList();
                foreach (var pim in allPtis)
                {
                    pim.pti_order = order;
                    order++;
                    _db.TI_PTI_Product_Instance_Image.ApplyCurrentValues(pim);
                }
                _db.SaveChanges();
            }
        }

        #endregion Product Instance Photo

        #region Product, Product Instance File
        /// <summary>
        /// 上传文件到product 和 product instance
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="socId"></param>
        /// <param name="pitId"></param>
        /// <param name="propGuid"></param>
        public void UploadFileForProductAndPit(int prdId, int socId, int pitId, string propGuid, string path)
        {
            if (pitId == 0)
            {
                var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
                if (prd != null)
                {
                    var PrdGeneralInfoList = GetGeneralPropertyValuesFormXml(prd.pty_id, socId, prd.prd_specifications);
                    var prop = PrdGeneralInfoList.FirstOrDefault(m => m.PropGuid == propGuid);
                    if (prop != null)
                    {
                        string oldPath = prop.PropValue;
                        CommonRepository.DeleteFile(oldPath);
                        prop.PropValue = path;
                        var sepcifications = GenerateXmlFieldForGeneralInfo(PrdGeneralInfoList);
                        prd.prd_specifications = sepcifications;
                        _db.TM_PRD_Product.ApplyCurrentValues(prd);
                        _db.SaveChanges();
                    }
                }
            }
            else
            {
                var pit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == pitId && m.prd_id == prdId && m.TM_PRD_Product.soc_id == socId);
                if (pit != null)
                {
                    var ptyPropValues = GetPtyProppertyValues(pit.pty_id, socId);
                    var PitAllInfo = GetPitKeyValues(pit.pit_prd_info, ptyPropValues);
                    var oneInfo = PitAllInfo.FirstOrDefault(m => m.PropGuid == propGuid);
                    if (oneInfo != null)
                    {
                        string oldPath = oneInfo.PropValue;
                        CommonRepository.DeleteFile(oldPath);
                        oneInfo.PropValue = path;
                        pit.pit_prd_info = GenerateXmlFieldForProductInstrance(PitAllInfo);
                        _db.TM_PIT_Product_Instance.ApplyCurrentValues(pit);
                        _db.SaveChanges();
                    }
                }
            }
        }

        public string GetFilePathForDownLoad(int prdId, int pitId, int socId, string propGuid)
        {
            string filePath = string.Empty;
            if (pitId != 0)
            {
                var pit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == pitId && m.prd_id == prdId && m.TM_PRD_Product.soc_id == socId);
                if (pit != null)
                {
                    var ptyPropValues = GetPtyProppertyValues(pit.pty_id, socId);
                    var pitAllInfo = GetPitKeyValues(pit.pit_prd_info, ptyPropValues);
                    var oneInfo = pitAllInfo.FirstOrDefault(m => m.PropGuid == propGuid);
                    if (oneInfo != null)
                    {
                        filePath = oneInfo.PropValue;
                    }
                }
            }
            else
            {
                var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
                if (prd != null)
                {
                    var oneInfo = GetGeneralPropertyValuesFormXml(prd.pty_id, socId, prd.prd_specifications).FirstOrDefault(m => m.PropGuid == propGuid);
                    if (oneInfo != null)
                    {
                        filePath = oneInfo.PropValue;
                    }
                }
            }
            return filePath;
        }

        public void DeletePrdPitFile(int prdId, int pitId, int socId, string propGuid)
        {
            UploadFileForProductAndPit(prdId, socId, pitId, propGuid, null);
        }
        #endregion Product, Product Instance File

        #region AutoComplete for product and product instance

        public List<Product> GetProductsByRef(string prdRef, int socId, bool easySearch)
        {
            var prdIds = _db.PS_GetPrdByRef(prdRef, easySearch).Select(m => m.prd_id).ToList();

            //var prds = _db.TM_PRD_Product.Where(m => m.soc_id == socId && (m.prd_ref.StartsWith(prdRef) || m.prd_tmp_ref.StartsWith(prdRef)))
            var prds = (from prd in _db.TM_PRD_Product
                        join res in prdIds
                            on prd.prd_id equals res
                        select prd
                              ).Select(prd => new Product
                              {
                                  SocId = prd.soc_id,
                                  PtyId = prd.pty_id,
                                  PrdDescription = prd.prd_description,
                                  PrdId = prd.prd_id,
                                  PrdName = prd.prd_name,
                                  PrdPrice = prd.prd_price,
                                  PrdRef = prd.prd_ref,
                                  PrdPurchasePrice = prd.prd_purchase_price,
                                  PrdFileName = prd.prd_file_name,
                                  PrdSubName = prd.prd_sub_name,
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
                                  ProductType = prd.TM_PTY_Product_Type.pty_name,
                                  PrdOutsideHeight = prd.prd_outside_height,
                                  PrdOutsideLength = prd.prd_outside_length,
                                  PrdOutsideWidth = prd.prd_outside_width,
                                  PrdHoleLength = prd.prd_hole_lenght,
                                  PrdHoleWidth = prd.prd_hole_width,
                                  // 设置默认图片
                                  PrdImg =
                        prd.TI_PIM_Product_Image.Any()
                            ? (prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                                ? prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order)
                                    .FirstOrDefault()
                                    .TR_PAL_Photo_Album.pal_path
                                : prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                            : string.Empty,
                                  PrdSepcifications = prd.prd_specifications
                              }).ToList();

            //var prds = _db.TM_PRD_Product.Where(m => m.soc_id == socId
            //                                         && ((!easySearch &&
            //                                              (
            //                                                  m.prd_ref.Contains(prdRef)
            //                                                  || m.prd_tmp_ref.Contains(prdRef)
            //                                                  || m.prd_name.Contains(prdRef)
            //                                                  || m.prd_code.Contains(prdRef)
            //                                                  || m.prd_sub_name.Contains(prdRef)
            //                                                  )
            //                                             )
            //                                             || (easySearch && m.prd_ref.Contains(prdRef))
            //                                             )
            //    )
            //    .Select(prd => new Product
            //    {
            //        SocId = prd.soc_id,
            //        PtyId = prd.pty_id,
            //        PrdDescription = prd.prd_description,
            //        PrdId = prd.prd_id,
            //        PrdName = prd.prd_name,
            //        PrdPrice = prd.prd_price,
            //        PrdRef = prd.prd_ref,
            //        PrdPurchasePrice = prd.prd_purchase_price,
            //        PrdFileName = prd.prd_file_name,
            //        PrdSubName = prd.prd_sub_name,
            //        PrdCode = prd.prd_code,
            //        //PrdInsideDiameter = prd.prd_inside_diameter,
            //        PrdOutsideDiameter = prd.prd_outside_diameter,
            //        PrdLength = prd.prd_length,
            //        PrdWidth = prd.prd_width,
            //        PrdHeight = prd.prd_height,
            //        PrdHoleSize = prd.prd_hole_size,
            //        PrdDepth = prd.prd_depth,
            //        PrdWeight = prd.prd_weight,
            //        PrdUnitLength = prd.prd_unit_length,
            //        PrdUnitWidth = prd.prd_unit_width,
            //        PrdUnitHeight = prd.prd_unit_height,
            //        PrdUnitWeight = prd.prd_unit_weight,
            //        PrdQuantityEachCarton = prd.prd_quantity_each_carton,
            //        PrdCartonLength = prd.prd_carton_length,
            //        PrdCartonWidth = prd.prd_carton_width,
            //        PrdCartonHeight = prd.prd_carton_height,
            //        PrdCartonWeight = prd.prd_carton_weight,
            //        ProductType = prd.TM_PTY_Product_Type.pty_name,
            //        PrdOutsideHeight = prd.prd_outside_height,
            //        PrdOutsideLength = prd.prd_outside_length,
            //        PrdOutsideWidth = prd.prd_outside_width,
            //        PrdHoleLength = prd.prd_hole_lenght,
            //        PrdHoleWidth = prd.prd_hole_width,
            //        // 设置默认图片
            //        PrdImg =
            //            prd.TI_PIM_Product_Image.Any()
            //                ? (prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
            //                    ? prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order)
            //                        .FirstOrDefault()
            //                        .TR_PAL_Photo_Album.pal_path
            //                    : prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
            //                : string.Empty,
            //        PrdSepcifications = prd.prd_specifications
            //    }).Take(50).ToList();

            var ptyIds = prds.Select(m => m.PtyId).Distinct().ToList();
            var ptyDict = new Dictionary<int, List<PropertyValue>>();

            foreach (var ptyId in ptyIds)
            {
                if (!ptyDict.Any(l => l.Key == ptyId))
                {
                    var proplist = GetPtyProppertyValues(ptyId, 1);
                    ptyDict.Add(ptyId, proplist);
                }
            }

            prds.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                var oneprops = ptyDict.FirstOrDefault(l => l.Key == m.PtyId);
                PropertyValue power = null;
                if (oneprops.Key != 0)
                {
                    var powerGuid = oneprops.Value.FirstOrDefault(l => l.PropName == "Puissance");
                    power = GetPrdPropertyValues(m.PrdSepcifications).FirstOrDefault(l => powerGuid != null && l.PropGuid == powerGuid.PropGuid);
                    if (power != null && powerGuid != null)
                    {
                        power.PropUnit = powerGuid.PropUnit;
                    }
                }
                var diameter = string.Format("{0:0}", (m.PrdOutsideDiameter.HasValue && m.PrdOutsideDiameter > 0) ? m.PrdOutsideDiameter : null);
                diameter = !string.IsNullOrEmpty(diameter) ? (string.Format("Ø{0:0}", diameter)) : (string.Format("{0:0}x{1:0}", m.PrdLength, m.PrdWidth));
                diameter += "mm";


                var PrdRef = string.Format("{0} {1} {2} {3} {4}", m.PrdName,
                    m.PrdRef,
                    m.PrdSubName,
                    (power != null ? (power.PropValue + power.PropUnit) : string.Empty),
                    diameter
                    );
                m.PrdRef = PrdRef.Trim();
            });
            return prds;
        }

        public List<Product> GetProductsByRefWithSupplierId(string prdRef, int supId, int socId)
        {
            var prds = (from prd in _db.TM_PRD_Product
                            //join spr in _db.TR_SPR_Supplier_Product on prd.prd_id equals spr.prd_id 不强制规定必须供货商和产品对应
                        where prd.soc_id == socId
                        //&& spr.sup_id == supId
                        && (prd.prd_ref.Contains(prdRef)
                                                         || prd.prd_tmp_ref.Contains(prdRef)
                                                         || prd.prd_name.Contains(prdRef)
                                                         || prd.prd_code.Contains(prdRef)
                                                         || prd.prd_sub_name.Contains(prdRef)
                                                         )
                        select prd
                            )
                    .Select(prd => new Product
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
                        PitId = 0,
                        // 设置默认图片
                        PrdImg = prd.TI_PIM_Product_Image.Any() ? (prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue ?
                        prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path : prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path) : string.Empty
                    }).Take(10).ToList();

            //20230608 在ref长度大于5且prd没有结果的情况下，搜索pit表
            if (!string.IsNullOrEmpty(prdRef) && prdRef.Length >= 5 & !prds.Any())
            {
                var prdpits = (from
                            pit in _db.TM_PIT_Product_Instance
                               join prd in _db.TM_PRD_Product
                               on pit.prd_id equals prd.prd_id
                               //join spr in _db.TR_SPR_Supplier_Product on prd.prd_id equals spr.prd_id 不强制规定必须供货商和产品对应
                               where prd.soc_id == socId
                               //&& spr.sup_id == supId
                               && (pit.pit_ref.Contains(prdRef)
                               || pit.pit_tmp_ref.Contains(prdRef))
                               select new { prd, pit }
                            ).Take(10).ToList();
                prds = prdpits.Select(aprd => new Product
                {
                    SocId = aprd.prd.soc_id,
                    PtyId = aprd.prd.pty_id,
                    PrdDescription = aprd.prd.prd_description,
                    PrdId = aprd.prd.prd_id,
                    PrdName = aprd.prd.prd_name,
                    PrdSubName = aprd.prd.prd_sub_name,
                    PrdPrice = aprd.prd.prd_price,
                    PrdRef = aprd.pit.pit_ref,
                    PrdPurchasePrice = aprd.prd.prd_purchase_price,
                    PrdFileName = aprd.prd.prd_file_name,
                    PrdCode = aprd.prd.prd_code,
                    PitId = aprd.pit.pit_id,
                    // 设置默认图片
                    PrdImg = aprd.prd.TI_PIM_Product_Image.Any() ? (aprd.prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue ?
                    aprd.prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path : aprd.prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path) : string.Empty
                }).Take(10).ToList();
            }

            var ptyIds = prds.Select(m => m.PtyId).Distinct().ToList();
            var ptyDict = new Dictionary<int, List<PropertyValue>>();

            foreach (var ptyId in ptyIds)
            {
                if (!ptyDict.Any(l => l.Key == ptyId))
                {
                    var proplist = GetPtyProppertyValues(ptyId, 1);
                    ptyDict.Add(ptyId, proplist);
                }
            }
            prds.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                var oneprops = ptyDict.FirstOrDefault(l => l.Key == m.PtyId);
                PropertyValue power = null;
                if (oneprops.Key != 0)
                {
                    var powerGuid = oneprops.Value.FirstOrDefault(l => l.PropName == "Puissance");
                    power = GetPrdPropertyValues(m.PrdSepcifications).FirstOrDefault(l => powerGuid != null && l.PropGuid == powerGuid.PropGuid);
                    if (power != null && powerGuid != null)
                    {
                        power.PropUnit = powerGuid.PropUnit;
                    }
                }
                var PrdRef = string.Format("{0} {1} {2}", m.PrdName, m.PrdRef, (power != null ? (power.PropValue + power.PropUnit) : string.Empty));
                m.PrdRef = PrdRef.Trim();
            });


            return prds;
        }

        //public List<Product> GetProductsBySupplierId(int supId, int socId)
        //{
        //    var prds = (from prd in _db.TM_PRD_Product
        //                join spr in _db.TR_SPR_Supplier_Product on prd.prd_id equals spr.prd_id
        //                where prd.soc_id == socId &&
        //                spr.sup_id == supId
        //                select prd
        //                    )
        //            .Select(prd => new Product
        //            {
        //                SocId = prd.soc_id,
        //                PtyId = prd.pty_id,
        //                PrdDescription = prd.prd_description,
        //                PrdId = prd.prd_id,
        //                PrdName = prd.prd_name,
        //                PrdSubName = prd.prd_sub_name,
        //                PrdPrice = prd.prd_price,
        //                PrdRef = prd.prd_ref,
        //                PrdPurchasePrice = prd.prd_purchase_price,
        //                PrdFileName = prd.prd_file_name,
        //                PrdCode = prd.prd_code,
        //                // 设置默认图片
        //                PrdImg = prd.TI_PIM_Product_Image.Any() ? (prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue ?
        //                prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path : prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path) : string.Empty
        //            }).Take(10).ToList();
        //    prds.ForEach(m => m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId"));
        //    return prds;
        //}

        public List<Product> GetProductsByRef(string prdRef, int socId, int ptyId)
        {
            var prds = _db.TM_PRD_Product.Where(m => m.soc_id == socId
                && (ptyId == 0 || m.pty_id == ptyId)
                && m.prd_ref.StartsWith(prdRef))
                    .Select(prd => new Product
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
                        // 设置默认图片
                        PrdImg = prd.TI_PIM_Product_Image.Any() ? (prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue ?
                        prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path : prd.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path) : string.Empty
                    }).Take(10).ToList();
            prds.ForEach(m => m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId"));
            return prds;
        }

        public List<ProductInstance> GetPitByRef(string pitRef, int prdId, int socId)
        {
            var pits = _db.TM_PIT_Product_Instance.Where(m => m.prd_id == prdId && m.TM_PRD_Product.soc_id == socId &&
                (string.IsNullOrEmpty(pitRef)
                || m.pit_ref.Contains(pitRef)
                ))
                    .Select(tmPit => new ProductInstance
                    {
                        PitId = tmPit.pit_id,
                        PtyId = tmPit.pty_id,
                        PitDescription = tmPit.pit_description,
                        PitPrice = tmPit.pit_price,
                        PitRef = tmPit.pit_ref,
                        // todo : 需要得到库存中的平均进价，或者通过计算得到进价
                        PitPurchasePrice = tmPit.pit_purchase_price,
                        PrdId = tmPit.prd_id,
                        PitPrdInfo = tmPit.pit_prd_info,
                        PrdName = tmPit.TM_PRD_Product.prd_name,
                        PrdSubName = tmPit.TM_PRD_Product.prd_sub_name,
                        PrdOutsideDiameter = tmPit.TM_PRD_Product.prd_outside_diameter,
                        PrdLength = tmPit.TM_PRD_Product.prd_length,
                        PrdWidth = tmPit.TM_PRD_Product.prd_width,
                        PrdHeight = tmPit.TM_PRD_Product.prd_height,
                        PrdSepcifications = tmPit.TM_PRD_Product.prd_specifications,
                        PitInventoryThreshold = tmPit.pit_inventory_threshold,
                        PitInventory = tmPit.TM_INV_Inventory.Any() ? tmPit.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0
                    }).ToList();
            if (pits.Any())
            {

                var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                var ptyDict = new Dictionary<int, List<PropertyValue>>();

                foreach (var ptyId in ptyIds)
                {
                    if (!ptyDict.Any(l => l.Key == ptyId))
                    {
                        var proplist = GetPtyProppertyValues(ptyId, 1);
                        ptyDict.Add(ptyId, proplist);
                    }
                }

                //var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                foreach (var ptyId in ptyIds)
                {
                    var ptyPropValues = GetPtyProppertyValues(ptyId, socId);
                    var pitforThisPty = pits.Where(m => m.PtyId == ptyId).ToList();

                    pitforThisPty.ForEach(
                        onepit =>
                        {
                            onepit.PitAllInfo = GetPitKeyValues(onepit.PitPrdInfo, ptyPropValues).Where(
                                l => l.PropIsInTechReport
                                     && !l.PropIsImage
                                     && !l.PropIsSameValue).ToList();

                            var oneprops = ptyDict.FirstOrDefault(l => l.Key == onepit.PtyId);
                            if (oneprops.Key != 0)
                            {
                                var props = oneprops.Value.Where(l => propToadd.Any(k => k == l.PropName));
                                foreach (var propertyValue in props)
                                {
                                    var oneprop = GetPrdPropertyValues(onepit.PrdSepcifications).FirstOrDefault(l => l.PropGuid == propertyValue.PropGuid);
                                    if (oneprop != null)
                                    {
                                        oneprop.PropName = propertyValue.PropName;
                                        oneprop.PropUnit = propertyValue.PropUnit;
                                    }
                                    onepit.PitAllInfo.Add(oneprop);
                                }
                            }
                        }
                        );
                }

                var prdIds = pits.Select(m => m.PrdId).Distinct().ToList();
                foreach (var aPrdId in prdIds)
                {
                    var pitOfPrd = pits.Where(m => m.PrdId == aPrdId).ToList();
                    var supIds = _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId && m.prd_id == aPrdId).Select(m => m.sup_id).ToList().Select(m => StringCipher.EncoderSimple(m.ToString(), "supId")).ToList();
                    pitOfPrd.ForEach(m => m.ProductSuppliers = supIds);
                }

            }
            pits.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                m.PitRef = string.Format("{0} [{1}]", m.PitRef, m.PitInventory);
            });
            return pits;
        }


        public List<ProductInstance> GetPitByRef(string pitRef, int prdId, int socId, int pitId)
        {
            var pits = _db.TM_PIT_Product_Instance.Where(m => m.prd_id == prdId && m.TM_PRD_Product.soc_id == socId &&
                (string.IsNullOrEmpty(pitRef)
                || m.pit_ref.Contains(pitRef)
                )
                && (pitId == 0 || m.pit_id == pitId)
                )
                    .Select(tmPit => new ProductInstance
                    {
                        PitId = tmPit.pit_id,
                        PtyId = tmPit.pty_id,
                        PitDescription = tmPit.pit_description,
                        PitPrice = tmPit.pit_price,
                        PitRef = tmPit.pit_ref,
                        // todo : 需要得到库存中的平均进价，或者通过计算得到进价
                        PitPurchasePrice = tmPit.pit_purchase_price,
                        PrdId = tmPit.prd_id,
                        PitPrdInfo = tmPit.pit_prd_info,
                        PrdName = tmPit.TM_PRD_Product.prd_name,
                        PrdSubName = tmPit.TM_PRD_Product.prd_sub_name,
                        PrdOutsideDiameter = tmPit.TM_PRD_Product.prd_outside_diameter,
                        PrdLength = tmPit.TM_PRD_Product.prd_length,
                        PrdWidth = tmPit.TM_PRD_Product.prd_width,
                        PrdHeight = tmPit.TM_PRD_Product.prd_height,
                        PrdSepcifications = tmPit.TM_PRD_Product.prd_specifications,
                        PitInventoryThreshold = tmPit.pit_inventory_threshold,
                        PitInventory = tmPit.TM_INV_Inventory.Any() ? tmPit.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0,
                        PitDefaultImage = tmPit.TI_PTI_Product_Instance_Image.Any()
                    ? (tmPit.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().pal_id.HasValue
                        ? tmPit.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                        : tmPit.TI_PTI_Product_Instance_Image.OrderBy(m => m.pti_order).FirstOrDefault().pti_path)
                :
                    (tmPit.TM_PRD_Product.TI_PIM_Product_Image.Any()
                        ? (tmPit.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pal_id.HasValue
                            ? tmPit.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().TR_PAL_Photo_Album.pal_path
                            : tmPit.TM_PRD_Product.TI_PIM_Product_Image.OrderBy(m => m.pim_order).FirstOrDefault().pim_path)
                        : string.Empty),
                    }).ToList();
            if (pits.Any())
            {

                var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                var ptyDict = new Dictionary<int, List<PropertyValue>>();

                foreach (var ptyId in ptyIds)
                {
                    if (!ptyDict.Any(l => l.Key == ptyId))
                    {
                        var proplist = GetPtyProppertyValues(ptyId, 1);
                        ptyDict.Add(ptyId, proplist);
                    }
                }

                //var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                foreach (var ptyId in ptyIds)
                {
                    var ptyPropValues = GetPtyProppertyValues(ptyId, socId);
                    var pitforThisPty = pits.Where(m => m.PtyId == ptyId).ToList();

                    pitforThisPty.ForEach(
                        onepit =>
                        {
                            onepit.PitAllInfo = GetPitKeyValues(onepit.PitPrdInfo, ptyPropValues).Where(
                                l => l.PropIsInTechReport
                                     && !l.PropIsImage
                                     && !l.PropIsSameValue).ToList();

                            var oneprops = ptyDict.FirstOrDefault(l => l.Key == onepit.PtyId);
                            if (oneprops.Key != 0)
                            {
                                var props = oneprops.Value.Where(l => propToadd.Any(k => k == l.PropName));
                                foreach (var propertyValue in props)
                                {
                                    var oneprop = GetPrdPropertyValues(onepit.PrdSepcifications).FirstOrDefault(l => l.PropGuid == propertyValue.PropGuid);
                                    if (oneprop != null)
                                    {
                                        oneprop.PropName = propertyValue.PropName;
                                        oneprop.PropUnit = propertyValue.PropUnit;
                                    }
                                    onepit.PitAllInfo.Add(oneprop);
                                }
                            }
                        }
                        );
                }

                var prdIds = pits.Select(m => m.PrdId).Distinct().ToList();
                foreach (var aPrdId in prdIds)
                {
                    var pitOfPrd = pits.Where(m => m.PrdId == aPrdId).ToList();
                    var supIds = _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId && m.prd_id == aPrdId).Select(m => m.sup_id).ToList().Select(m => StringCipher.EncoderSimple(m.ToString(), "supId")).ToList();
                    pitOfPrd.ForEach(m => m.ProductSuppliers = supIds);
                }

            }
            pits.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                m.PitRef = string.Format("{0} [{1}]", m.PitRef, m.PitInventory);
            });
            return pits;
        }


        #endregion AutoComplete for product and product instance

        #region for Import

        /// <summary>
        /// 
        /// </summary>
        /// <param name="oneProduct"></param>
        /// <returns></returns>
        public int CreateUpdateProductForImport(Product oneProduct)
        {
            int prdId = 0;
            bool create = false;
            if (oneProduct.PrdId != 0)
            {
                var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == oneProduct.PrdId);
                if (prd != null)
                {
                    // update
                    prdId = prd.prd_id;
                    var sepcifications = GenerateXmlFieldForGeneralInfo(oneProduct.PrdGeneralInfoList);
                    prd.prd_description = oneProduct.PrdDescription;
                    prd.pty_id = oneProduct.PtyId;
                    prd.prd_name = oneProduct.PrdName;
                    prd.prd_sub_name = oneProduct.PrdSubName;
                    prd.prd_price = oneProduct.PrdPrice;
                    prd.prd_purchase_price = oneProduct.PrdPurchasePrice;

                    prd.prd_ref = oneProduct.PrdRef;
                    //prd.soc_id = oneProduct.SocId;
                    prd.prd_specifications = sepcifications;
                    prd.prd_file_name = oneProduct.PrdFileName;
                    prd.prd_d_update = DateTime.Now;

                    //prd.prd_inside_diameter = oneProduct.PrdInsideDiameter;
                    prd.prd_outside_diameter = oneProduct.PrdOutsideDiameter;
                    prd.prd_length = oneProduct.PrdLength;
                    prd.prd_width = oneProduct.PrdWidth;
                    prd.prd_height = oneProduct.PrdHeight;
                    prd.prd_hole_size = oneProduct.PrdHoleSize;
                    prd.prd_depth = oneProduct.PrdDepth;
                    prd.prd_weight = oneProduct.PrdWeight;
                    prd.prd_unit_length = oneProduct.PrdUnitLength;
                    prd.prd_unit_width = oneProduct.PrdUnitWidth;
                    prd.prd_unit_height = oneProduct.PrdUnitHeight;
                    prd.prd_unit_weight = oneProduct.PrdUnitWeight;
                    prd.prd_quantity_each_carton = oneProduct.PrdQuantityEachCarton;
                    prd.prd_carton_length = oneProduct.PrdCartonLength;
                    prd.prd_carton_width = oneProduct.PrdCartonWidth;
                    prd.prd_carton_height = oneProduct.PrdCartonHeight;
                    prd.prd_carton_weight = oneProduct.PrdCartonWeight;

                    prd.prd_outside_height = oneProduct.PrdOutsideHeight;
                    prd.prd_outside_length = oneProduct.PrdOutsideLength;
                    prd.prd_outside_width = oneProduct.PrdOutsideWidth;
                    prd.prd_hole_lenght = oneProduct.PrdHoleLength;
                    prd.prd_hole_width = oneProduct.PrdHoleWidth;

                    prd.prd_tmp_ref = oneProduct.PrdTmpRef;
                    prd.prd_sup_description = oneProduct.PrdSupDes;



                    _db.TM_PRD_Product.ApplyCurrentValues(prd);
                    _db.SaveChanges();

                    // update product instrance
                    foreach (var onePrdIns in oneProduct.InstanceList)
                    {
                        bool createIns = false;
                        if (onePrdIns.PitId > 0)
                        {
                            // update instance
                            var oneIns = _db.TM_PIT_Product_Instance.First(m => m.pit_id == onePrdIns.PitId);
                            if (oneIns != null)
                            {
                                var pitPrdInfo = GenerateXmlFieldForProductInstrance(onePrdIns.PitAllInfo);
                                oneIns.pit_price = onePrdIns.PitPrice;
                                oneIns.pit_ref = onePrdIns.PitRef;
                                oneIns.pit_purchase_price = onePrdIns.PitPurchasePrice;
                                oneIns.pit_description = onePrdIns.PitDescription;
                                oneIns.pit_prd_info = pitPrdInfo;
                                oneIns.pit_inventory_threshold = onePrdIns.PitInventoryThreshold;
                                _db.TM_PIT_Product_Instance.ApplyCurrentValues(oneIns);
                            }
                            else
                            {
                                createIns = true;
                            }
                        }
                        else
                        {
                            // create instance
                            createIns = true;
                        }
                        if (createIns)
                        {
                            var oneIns = new TM_PIT_Product_Instance();
                            var pitPrdInfo = GenerateXmlFieldForProductInstrance(onePrdIns.PitAllInfo);
                            oneIns.prd_id = prdId;
                            oneIns.pty_id = onePrdIns.PtyId;
                            oneIns.pit_price = onePrdIns.PitPrice;
                            oneIns.pit_ref = onePrdIns.PitRef;
                            oneIns.pit_purchase_price = onePrdIns.PitPurchasePrice;
                            oneIns.pit_description = onePrdIns.PitDescription;
                            oneIns.pit_prd_info = pitPrdInfo;
                            oneIns.pit_inventory_threshold = onePrdIns.PitInventoryThreshold;
                            _db.TM_PIT_Product_Instance.AddObject(oneIns);
                        }
                    }
                    _db.SaveChanges();
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
                // create
                var sepcifications = GenerateXmlFieldForGeneralInfo(oneProduct.PrdGeneralInfoList);
                var onePrd = new TM_PRD_Product
                {
                    prd_description = oneProduct.PrdDescription,
                    pty_id = oneProduct.PtyId,
                    prd_name = oneProduct.PrdName,
                    prd_price = oneProduct.PrdPrice,
                    prd_purchase_price = oneProduct.PrdPurchasePrice,
                    prd_ref = oneProduct.PrdRef,
                    soc_id = oneProduct.SocId,
                    prd_file_name = oneProduct.PrdFileName,
                    prd_specifications = sepcifications,
                    prd_d_creation = DateTime.Now,
                    prd_d_update = DateTime.Now,
                    prd_code = GetNewProductCode(oneProduct.SocId),

                    //prd_inside_diameter = oneProduct.PrdInsideDiameter,
                    prd_outside_diameter = oneProduct.PrdOutsideDiameter,
                    prd_length = oneProduct.PrdLength,
                    prd_width = oneProduct.PrdWidth,
                    prd_height = oneProduct.PrdHeight,
                    prd_hole_size = oneProduct.PrdHoleSize,
                    prd_depth = oneProduct.PrdDepth,
                    prd_weight = oneProduct.PrdWeight,
                    prd_unit_length = oneProduct.PrdUnitLength,
                    prd_unit_width = oneProduct.PrdUnitWidth,
                    prd_unit_height = oneProduct.PrdUnitHeight,
                    prd_unit_weight = oneProduct.PrdUnitWeight,
                    prd_quantity_each_carton = oneProduct.PrdQuantityEachCarton,
                    prd_carton_length = oneProduct.PrdCartonLength,
                    prd_carton_width = oneProduct.PrdCartonWidth,
                    prd_carton_height = oneProduct.PrdCartonHeight,
                    prd_carton_weight = oneProduct.PrdCartonWeight,

                    prd_outside_height = oneProduct.PrdOutsideHeight,
                    prd_outside_length = oneProduct.PrdOutsideLength,
                    prd_outside_width = oneProduct.PrdOutsideWidth,
                    prd_hole_lenght = oneProduct.PrdHoleLength,
                    prd_hole_width = oneProduct.PrdHoleWidth,


                    prd_tmp_ref = oneProduct.PrdTmpRef,
                    prd_sup_description = oneProduct.PrdSupDes

                };
                _db.TM_PRD_Product.AddObject(onePrd);
                _db.SaveChanges();
                prdId = onePrd.prd_id;
                // create product instance
                foreach (var prdIns in oneProduct.InstanceList)
                {
                    var pitPrdInfo = GenerateXmlFieldForProductInstrance(prdIns.PitAllInfo);
                    var onePin = new TM_PIT_Product_Instance
                    {
                        prd_id = prdId,
                        pty_id = oneProduct.PtyId,
                        pit_price = prdIns.PitPrice,
                        pit_purchase_price = prdIns.PitPurchasePrice,
                        pit_ref = prdIns.PitRef,
                        pit_description = prdIns.PitDescription,
                        pit_prd_info = pitPrdInfo,
                        pit_inventory_threshold = prdIns.PitInventoryThreshold,
                    };
                    _db.TM_PIT_Product_Instance.AddObject(onePin);
                }
                _db.SaveChanges();
            }
            return prdId;
        }

        public List<ProductInstance> GetPitByRef(string pitRef)
        {
            var pits = _db.TM_PIT_Product_Instance.Where(m => m.pit_ref.StartsWith(pitRef)).Select(m => new ProductInstance
            {
                PitId = m.pit_id,
                PitDescription = m.pit_description,
                PitPrice = m.pit_price,
                PitRef = m.pit_ref,
                PitPurchasePrice = m.pit_purchase_price,
                PrdId = m.prd_id,
            }).ToList();
            return pits;
        }

        public void UpdateSupplierProduct(int prdId, int supId, decimal? pricenormal, decimal? pricedim, decimal? pricedali)
        {
            var spr = _db.TR_SPR_Supplier_Product.FirstOrDefault(m => m.prd_id == prdId);
            if (spr != null)
            {
                _db.TR_SPR_Supplier_Product.DeleteObject(spr);
                _db.SaveChanges();
            }
            spr = new TR_SPR_Supplier_Product
            {
                prd_id = prdId,
                sup_id = supId,
                spr_price_1_100 = pricenormal == 0 ? null : pricenormal,
                spr_price_100_500 = pricedim == 0 ? null : pricedim,
                spr_price_500_plus = pricedali == 0 ? null : pricedali,
                spr_coef_500_plus = null,
                spr_coef_100_500 = null,
                cur_id = 3,
                soc_id = 1,
                spr_prd_ref = null
            };
            _db.TR_SPR_Supplier_Product.AddObject(spr);
            _db.SaveChanges();
        }

        public List<ProductInstance> GetAllPits()
        {
            var pits = _db.TM_PIT_Product_Instance.Select(m => new ProductInstance
            {
                PitId = m.pit_id,
                PtyId = m.pty_id,
                PitDescription = m.pit_description,
                PitPrice = m.pit_price,
                PitRef = m.pit_ref,
                PitPurchasePrice = m.pit_purchase_price,
                PrdId = m.prd_id,
                PitPrdInfo = m.pit_prd_info
            }).ToList();

            var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();

            var ptyPropValues = new Dictionary<int, List<PropertyValue>>();
            foreach (var ptyId in ptyIds)
            {
                if (!ptyPropValues.Any(m => m.Key == ptyId))
                {
                    ptyPropValues.Add(ptyId, GetPtyProppertyValues(ptyId, 1));
                }
            }
            //GetPtyProppertyValues(ptyId, 1);
            foreach (var productInstance in pits)
            {
                productInstance.PitAllInfo = GetPitKeyValues(productInstance.PitPrdInfo, ptyPropValues.FirstOrDefault(l => l.Key == productInstance.PtyId).Value);
            }
            return pits;
        }

        public void UpdateProdutInstanceProps(List<ProductInstance> pits)
        {
            foreach (var onepit in pits)
            {
                var pit = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == onepit.PitId);
                if (pit != null)
                {
                    var pitPrdInfo = GenerateXmlFieldForProductInstrance(onepit.PitAllInfo);
                    pit.pit_prd_info = pitPrdInfo;
                    _db.TM_PIT_Product_Instance.ApplyCurrentValues(pit);
                    _db.SaveChanges();
                }
            }
        }

        #endregion for Import

        #region For Inventory

        public List<ProductInstance> GetPitForInventory(int socId)
        {
            var pits =
                _db.TM_PIT_Product_Instance.Where(m => m.TM_PRD_Product.soc_id == socId && m.TM_INV_Inventory.Any())
                    .Select(m => new ProductInstance
                    {
                        PitId = m.pit_id,
                        PitDescription = m.pit_description,
                        PitPrice = m.pit_price,
                        PitRef = m.pit_ref,
                        PitPurchasePrice = m.pit_purchase_price,
                        PrdId = m.prd_id,
                        PitPrdInfo = m.pit_prd_info,
                        PitInventoryThreshold = m.pit_inventory_threshold,
                        PitInventory = m.TM_INV_Inventory.Any() ? m.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0,
                        PrdRef = m.TM_PRD_Product.prd_ref,
                        PrdName = m.TM_PRD_Product.prd_name,
                        PrdSubName = m.TM_PRD_Product.prd_sub_name,
                        PrdCode = m.TM_PRD_Product.prd_code,
                        PrdOutsideDiameter = m.TM_PRD_Product.prd_outside_diameter,
                        PrdLength = m.TM_PRD_Product.prd_length,
                        PrdWidth = m.TM_PRD_Product.prd_width,
                        PrdHeight = m.TM_PRD_Product.prd_height,
                        ProductType = m.TM_PRD_Product.TM_PTY_Product_Type.pty_name,
                        PtyId = m.pty_id,
                        PrdSepcifications = m.TM_PRD_Product.prd_specifications,
                        InvId = m.TM_INV_Inventory.Any() ? m.TM_INV_Inventory.FirstOrDefault().inv_id : 0
                    }).ToList();

            if (pits.Any())
            {
                var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                var ptyDict = new Dictionary<int, List<PropertyValue>>();
                foreach (var ptyId in ptyIds)
                {
                    if (!ptyDict.Any(l => l.Key == ptyId))
                    {
                        var proplist = GetPtyProppertyValues(ptyId, 1);
                        ptyDict.Add(ptyId, proplist);
                    }
                }

                //var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                foreach (var ptyId in ptyIds)
                {
                    var ptyPropValues = GetPtyProppertyValues(ptyId, socId);
                    var pitforThisPty = pits.Where(m => m.PtyId == ptyId).ToList();
                    pitforThisPty.ForEach(
                        onepit =>
                        {
                            onepit.PitAllInfo = GetPitKeyValues(onepit.PitPrdInfo, ptyPropValues).Where(
                                l => l.PropIsInTechReport
                                     && !l.PropIsImage
                                     && !l.PropIsSameValue).ToList();

                            var oneprops = ptyDict.FirstOrDefault(l => l.Key == onepit.PtyId);
                            if (oneprops.Key != 0)
                            {
                                var props = oneprops.Value.Where(l => propToadd.Any(k => k == l.PropName));
                                foreach (var propertyValue in props)
                                {
                                    var oneprop =
                                        GetPrdPropertyValues(onepit.PrdSepcifications)
                                            .FirstOrDefault(l => l.PropGuid == propertyValue.PropGuid);
                                    if (oneprop != null)
                                    {
                                        oneprop.PropName = propertyValue.PropName;
                                        oneprop.PropUnit = propertyValue.PropUnit;
                                    }
                                    onepit.PitAllInfo.Add(oneprop);
                                }
                            }
                        }
                        );
                }

                var prdIds = pits.Select(m => m.PrdId).Distinct().ToList();
                foreach (var aPrdId in prdIds)
                {
                    var pitOfPrd = pits.Where(m => m.PrdId == aPrdId).ToList();
                    var supIds =
                        _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId && m.prd_id == aPrdId)
                            .Select(m => m.sup_id)
                            .ToList()
                            .Select(m => StringCipher.EncoderSimple(m.ToString(), "supId"))
                            .ToList();
                    pitOfPrd.ForEach(m => m.ProductSuppliers = supIds);
                }
            }
            pits.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
            });
            // pits without pitId
            var pitsWithoutPitid =
                _db.TM_INV_Inventory.Where(m => !m.pit_id.HasValue).Select(m => new ProductInstance
                {
                    InvId = m.inv_id,
                    PrdName = m.prd_name,
                    PrdSubName = string.Empty,
                    PitInventory = m.inv_quantity,
                    PitId = 0,
                    ProductType = string.Empty,
                    PitRef = string.Empty,
                    PrdDescription = m.inv_description
                }).ToList();
            pits.AddRange(pitsWithoutPitid);

            return pits;
        }


        public List<ProductInstance> SearchPitForInventory(int socId, int ptyid, string prdinfo, bool notZero)
        {
            var pits =
                _db.TM_PIT_Product_Instance.Where(m => m.TM_PRD_Product.soc_id == socId && m.TM_INV_Inventory.Any()
                && (ptyid == 0 || m.pty_id == ptyid)
                &&
                (
                string.IsNullOrEmpty(prdinfo) || m.pit_ref.Contains(prdinfo) || m.pit_description.Contains(prdinfo)
                || m.TM_PRD_Product.prd_name.Contains(prdinfo) || m.TM_PRD_Product.prd_sub_name.Contains(prdinfo)
                || m.TM_PRD_Product.prd_description.Contains(prdinfo) || m.TM_PRD_Product.prd_ref.Contains(prdinfo)
                )
                && (!notZero || m.TM_INV_Inventory.Any(l => l.inv_quantity > 0))
                )
                    .Select(m => new ProductInstance
                    {
                        PitId = m.pit_id,
                        PitDescription = m.pit_description,
                        PitPrice = m.pit_price,
                        PitRef = m.pit_ref,
                        PitPurchasePrice = m.pit_purchase_price,
                        PrdId = m.prd_id,
                        PitPrdInfo = m.pit_prd_info,
                        PitInventoryThreshold = m.pit_inventory_threshold,
                        PitInventory = m.TM_INV_Inventory.Any() ? m.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0,
                        PrdRef = m.TM_PRD_Product.prd_ref,
                        PrdName = m.TM_PRD_Product.prd_name,
                        PrdSubName = m.TM_PRD_Product.prd_sub_name,
                        PrdCode = m.TM_PRD_Product.prd_code,
                        PrdOutsideDiameter = m.TM_PRD_Product.prd_outside_diameter,
                        PrdLength = m.TM_PRD_Product.prd_length,
                        PrdWidth = m.TM_PRD_Product.prd_width,
                        PrdHeight = m.TM_PRD_Product.prd_height,
                        ProductType = m.TM_PRD_Product.TM_PTY_Product_Type.pty_name,
                        PtyId = m.pty_id,
                        PrdSepcifications = m.TM_PRD_Product.prd_specifications,
                        InvId = m.TM_INV_Inventory.Any() ? m.TM_INV_Inventory.FirstOrDefault().inv_id : 0
                    }).ToList();

            if (pits.Any())
            {
                var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                var ptyDict = new Dictionary<int, List<PropertyValue>>();
                foreach (var ptyId in ptyIds)
                {
                    if (!ptyDict.Any(l => l.Key == ptyId))
                    {
                        var proplist = GetPtyProppertyValues(ptyId, 1);
                        ptyDict.Add(ptyId, proplist);
                    }
                }

                //var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                foreach (var ptyId in ptyIds)
                {
                    var ptyPropValues = GetPtyProppertyValues(ptyId, socId);
                    var pitforThisPty = pits.Where(m => m.PtyId == ptyId).ToList();
                    pitforThisPty.ForEach(
                        onepit =>
                        {
                            onepit.PitAllInfo = GetPitKeyValues(onepit.PitPrdInfo, ptyPropValues).Where(
                                l => l.PropIsInTechReport
                                     && !l.PropIsImage
                                     && !l.PropIsSameValue).ToList();

                            var oneprops = ptyDict.FirstOrDefault(l => l.Key == onepit.PtyId);
                            if (oneprops.Key != 0)
                            {
                                var props = oneprops.Value.Where(l => propToadd.Any(k => k == l.PropName));
                                foreach (var propertyValue in props)
                                {
                                    var oneprop =
                                        GetPrdPropertyValues(onepit.PrdSepcifications)
                                            .FirstOrDefault(l => l.PropGuid == propertyValue.PropGuid);
                                    if (oneprop != null)
                                    {
                                        oneprop.PropName = propertyValue.PropName;
                                        oneprop.PropUnit = propertyValue.PropUnit;
                                    }
                                    onepit.PitAllInfo.Add(oneprop);
                                }
                            }
                        }
                        );
                }

                var prdIds = pits.Select(m => m.PrdId).Distinct().ToList();
                foreach (var aPrdId in prdIds)
                {
                    var pitOfPrd = pits.Where(m => m.PrdId == aPrdId).ToList();
                    var supIds =
                        _db.TR_SPR_Supplier_Product.Where(m => m.soc_id == socId && m.prd_id == aPrdId)
                            .Select(m => m.sup_id)
                            .ToList()
                            .Select(m => StringCipher.EncoderSimple(m.ToString(), "supId"))
                            .ToList();
                    pitOfPrd.ForEach(m => m.ProductSuppliers = supIds);
                }
            }
            pits.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
            });
            // pits without pitId
            var pitsWithoutPitid =
                _db.TM_INV_Inventory.Where(m => !m.pit_id.HasValue
                && (string.IsNullOrEmpty(prdinfo) || m.prd_name.Contains(prdinfo))
                && (!notZero || m.inv_quantity > 0)
                ).Select(m => new ProductInstance
                {
                    InvId = m.inv_id,
                    PrdName = m.prd_name,
                    PrdSubName = string.Empty,
                    PitInventory = m.inv_quantity,
                    PitId = 0,
                    ProductType = string.Empty,
                    PitRef = string.Empty,
                    PrdDescription = m.inv_description
                }).ToList();
            pits.AddRange(pitsWithoutPitid);

            return pits;
        }

        #endregion For Inventory

        #region Recommanded Product

        public List<RecommandedProduct> GetRecommandedPrd(int socId, string catname = null, int catId = 0, bool? actived = null)
        {
            var result = new List<RecommandedProduct>();
            var onecat = _db.TM_CAT_Category.FirstOrDefault(m =>
                (!string.IsNullOrEmpty(catname) && m.cat_name == catname)
                ||
                (catId != 0 && m.cat_id == catId));
            if (onecat != null)
            {
                result = _db.TR_RMP_Recommended_Product.Where(m => m.cat_id == onecat.cat_id && m.soc_id == socId && (!actived.HasValue || m.rmp_actived == actived.Value)).Select(m => new RecommandedProduct
                {
                    PrdId = m.prd_id,
                    CatId = m.cat_id,
                    PrdRef = m.TM_PRD_Product.prd_ref,
                    RmpActived = m.rmp_actived,
                    RmpOrder = m.rmp_order,
                    PrdName = m.TM_PRD_Product.prd_name,
                    PrdSubName = m.TM_PRD_Product.prd_sub_name,
                    PrdImg = m.TM_PRD_Product.TI_PIM_Product_Image.Any() && m.TM_PRD_Product.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                                ? m.TM_PRD_Product.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                            : string.Empty,
                }).OrderBy(m => m.RmpOrder).ToList();
                result.ForEach(m => m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId"));
            }
            return result;
        }

        public Product LoadProductByIdForSite(int prdId, int socId)
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

                //var prdImg = _db.TI_PIM_Product_Image.FirstOrDefault(m => m.prd_id == prdId);
                //onePrd.PrdImg = prdImg != null ? prdImg.pim_path : string.Empty;

                onePrd.PrdImg = prd.TI_PIM_Product_Image.Any() && prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                    ? prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                    : string.Empty;

                var prdImgList = _db.TI_PIM_Product_Image.Where(m => m.prd_id == prdId && (m.pim_order >= 10 || m.pim_order == 2)).Select(m => new KeyValue
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
                return onePrd;
            }
            else
            {
                return null;
            }
        }


        public List<Product> GetAllProductsInCat(int socId, int catId)
        {
            var onecat = _db.TM_CAT_Category.FirstOrDefault(m => m.cat_id == catId);
            var prds = new List<Product>();
            if (onecat != null)
            {
                var catIds = new List<int>();
                catIds = GetSubCatId(onecat, catIds);
                catIds.Add(onecat.cat_id);
                catIds = catIds.Distinct().ToList();
                prds = (from pca in _db.TR_PCA_Product_Category
                        join catid in catIds on pca.cat_id equals catid
                        select pca.TM_PRD_Product)
                        //.DistinctBy(m => m.prd_id)
                        .Select(m => new Product
                        {
                            PrdId = m.prd_id,
                            PrdName = m.prd_name,
                            PrdRef = m.prd_ref,
                            PrdSubName = m.prd_sub_name,
                            PrdImg = m.TI_PIM_Product_Image.Any() && m.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                               ? m.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                                : string.Empty,
                        }).ToList();
                prds.ForEach(m => m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId"));
            }
            return prds;
        }

        public void DeleteUpdateProductInCat(int socId, int catId, int prdId, int order, bool actived, bool delete = false)
        {
            var rmp = _db.TR_RMP_Recommended_Product.FirstOrDefault(m => m.soc_id == socId && m.cat_id == catId && m.prd_id == prdId);
            if (rmp != null)
            {
                if (delete)
                {
                    _db.TR_RMP_Recommended_Product.DeleteObject(rmp);
                    _db.SaveChanges();
                }
                else
                {
                    rmp.rmp_order = order;
                    rmp.rmp_actived = actived;
                    _db.TR_RMP_Recommended_Product.ApplyCurrentValues(rmp);
                    _db.SaveChanges();
                }
            }
        }

        public void AddProductInCat(int socId, int catId, int prdId, int order, bool actived)
        {
            var rmp = _db.TR_RMP_Recommended_Product.FirstOrDefault(m => m.soc_id == socId && m.cat_id == catId && m.prd_id == prdId);
            if (rmp != null)
            {
                DeleteUpdateProductInCat(socId, catId, prdId, order, actived);
            }
            else
            {
                rmp = new TR_RMP_Recommended_Product
                {
                    soc_id = socId,
                    cat_id = catId,
                    prd_id = prdId,
                    rmp_order = order,
                    rmp_actived = true
                };
                _db.TR_RMP_Recommended_Product.AddObject(rmp);
                _db.SaveChanges();
            }
        }

        private List<int> GetSubCatId(TM_CAT_Category cat, List<int> catIds)
        {
            var subCats = _db.TM_CAT_Category.Where(m => m.cat_parent_cat_id == cat.cat_id && m.cat_parent_cat_id.HasValue && m.cat_parent_cat_id != m.cat_id);
            foreach (var onecat in subCats)
            {
                catIds.Add(onecat.cat_id);
                GetSubCatId(onecat, catIds);
            }
            return catIds;
        }

        #endregion Recommanded Product

        #region For Kartezzi

        public List<ProductInCategory> GetMainPageProduct(int socId, string catName, int take)
        {
            var prds = _db.TM_PRD_Product.Where(m => m.soc_id == socId).Select(prdPit => new ProductInCategory
            {
                Product = new Product
                {
                    PrdDescription = prdPit.prd_description,
                    PrdId = prdPit.prd_id,
                    PrdName = prdPit.prd_name,
                    PrdSubName = prdPit.prd_sub_name,
                    PrdPrice = prdPit.prd_price,
                    PrdRef = prdPit.prd_ref,
                    PrdPurchasePrice = prdPit.prd_purchase_price,
                    PrdFileName = prdPit.prd_file_name,
                    PrdCode = prdPit.prd_code,
                    PrdOutsideDiameter = prdPit.prd_outside_diameter,
                    PrdLength = prdPit.prd_length,
                    PrdWidth = prdPit.prd_width,
                    PrdHeight = prdPit.prd_height,
                    PrdHoleSize = prdPit.prd_hole_size,
                    PrdDepth = prdPit.prd_depth,
                    PrdWeight = prdPit.prd_weight,
                    PrdUnitLength = prdPit.prd_unit_length,
                    PrdUnitWidth = prdPit.prd_unit_width,
                    PrdUnitHeight = prdPit.prd_unit_height,
                    PrdUnitWeight = prdPit.prd_unit_weight,
                    PrdQuantityEachCarton = prdPit.prd_quantity_each_carton,
                    PrdCartonLength = prdPit.prd_carton_length,
                    PrdCartonWidth = prdPit.prd_carton_width,
                    PrdCartonHeight = prdPit.prd_carton_height,
                    PrdCartonWeight = prdPit.prd_carton_weight,
                    ProductType = prdPit.TM_PTY_Product_Type.pty_name,
                    //PrdImg = prdPit.TI_PIM_Product_Image.Any()
                    //        ? prdPit.TI_PIM_Product_Image.FirstOrDefault().pim_path
                    //        : string.Empty,
                    PrdImg = prdPit.TI_PIM_Product_Image.Any() && prdPit.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10) != null
                    ? prdPit.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 10).pim_path
                    : string.Empty,
                    PtyId = prdPit.pty_id,
                    SubPrdCount = prdPit.TM_PIT_Product_Instance.Count,
                    SocId = prdPit.soc_id,
                    PrdSepcifications = prdPit.prd_specifications,
                    //FId = StringCipher.EncoderSimple(prdPit.prd_id.ToString(), "prdId"),
                    //PrdGeneralInfoList = GetGeneralPropertyValuesFormXml(prdPit.pty_id, socId, prdPit.prd_specifications,true).Where(m => m.PropName == "Puissance").ToList()
                }
            }).Take(take).ToList();
            return prds;
        }

        #endregion For Kartezzi

        #region FOR ECOEM

        public void UpdateProductPriceAndSupPrice(List<KeyValue> pitWithPirce)
        {
            //var pits = (from pit in _db.TM_PIT_Product_Instance
            //            join pitp in pitWithPirce on pit.pit_id equals pitp.Key
            //            select pit).ToList();
            foreach (var onepit in pitWithPirce)
            {
                var pitprice = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == onepit.Key);
                if (pitprice != null)
                {
                    var price = onepit.DcValue;
                    var purchaseprice = (onepit.Value.StartsWith("GOL") || onepit.Value.StartsWith("SEA") || onepit.Value.StartsWith("FAR"))
                        ? (price * (decimal)(0.45))
                        : ((onepit.Value.StartsWith("HAG") || onepit.Value.StartsWith("LEG") || onepit.Value.StartsWith("SCH"))
                            ? (price * (decimal)(0.32))
                            : 0);
                    pitprice.pit_purchase_price = purchaseprice;
                    pitprice.pit_price = price;
                    _db.TM_PIT_Product_Instance.ApplyCurrentValues(pitprice);
                }
            }

            //var sprs = (from spr in _db.TR_SPR_Supplier_Product
            //            join pitp in pitWithPirce on spr.prd_id equals pitp.Key2
            //            select spr
            //    ).ToList();

            foreach (var onespr in pitWithPirce)
            {
                var pitprice = _db.TR_SPR_Supplier_Product.FirstOrDefault(m => m.prd_id == onespr.Key2);
                if (pitprice != null)
                {
                    var price = onespr.DcValue;
                    var purchaseprice = (onespr.Value.StartsWith("GOL") || onespr.Value.StartsWith("SEA") || onespr.Value.StartsWith("FAR"))
                        ? (price * (decimal)(0.45))
                        : ((onespr.Value.StartsWith("HAG") || onespr.Value.StartsWith("LEG") || onespr.Value.StartsWith("SCH"))
                            ? (price * (decimal)(0.32))
                            : 0);
                    pitprice.spr_price_1_100 = purchaseprice;
                    _db.TR_SPR_Supplier_Product.ApplyCurrentValues(pitprice);
                }

            }

            _db.SaveChanges();

        }



        #endregion FOR ECOEM

        #region For get product price by client

        public List<ProductInstance> GetClientSoldProducts(int cliId, int socId)
        {
            var result = new List<ProductInstance>();

            var allprds = (from cin in _db.TM_CIN_Client_Invoice
                           join cii in _db.TM_CII_ClientInvoice_Line on cin.cin_id equals cii.cin_id
                           where cin.cli_id == cliId && cin.soc_id == socId
                           select cii).ToList();

            var prdWithPit = allprds.Where(m => m.pit_id.HasValue).ToList();
            var prdWithOutPit = allprds.Where(m => !m.pit_id.HasValue).ToList();

            var productsWithPit = prdWithPit.Select(m => new ProductInstance
            {
                PrdId = m.prd_id ?? 0,
                PitId = m.pit_id ?? 0,
                PrdName = m.pit_id.HasValue ? m.TM_PRD_Product.prd_name : m.cii_prd_name,
                PrdRef = m.pit_id.HasValue ? m.TM_PIT_Product_Instance.pit_ref : string.Empty,
                PrdOutsideDiameter = m.pit_id.HasValue ? m.TM_PRD_Product.prd_outside_diameter : 0,
                PrdLength = m.pit_id.HasValue ? m.TM_PRD_Product.prd_length : 0,
                PrdWidth = m.pit_id.HasValue ? m.TM_PRD_Product.prd_width : 0,
                PrdHeight = m.pit_id.HasValue ? m.TM_PRD_Product.prd_height : 0,
                PrdSepcifications = m.pit_id.HasValue ? m.TM_PRD_Product.prd_specifications : string.Empty
            }).Distinct().ToList();

            // filter 
            var prdwithPit = new List<ProductInstance>();

            foreach (var productInstance in productsWithPit)
            {
                if (!prdwithPit.Any(m => m.PitId == productInstance.PitId))
                {
                    prdwithPit.Add(productInstance);
                }
            }

            var productWithOutPit = prdWithOutPit.Select(m => new ProductInstance
            {
                PrdId = m.prd_id ?? 0,
                PitId = m.pit_id ?? 0,
                PrdName = m.cii_prd_name,
            }).Distinct().ToList();

            // filter
            var prdwithoutPit = new List<ProductInstance>();

            foreach (var productInstance in productWithOutPit)
            {
                if (!prdwithoutPit.Any(m => m.PrdName == productInstance.PrdName))
                {
                    prdwithoutPit.Add(productInstance);
                }
            }

            var ptyIds = prdWithPit.Select(m => m.TM_PRD_Product.pty_id).Distinct().ToList();
            var ptyDict = new Dictionary<int, List<PropertyValue>>();


            foreach (var ptyId in ptyIds)
            {
                if (!ptyDict.Any(l => l.Key == ptyId))
                {
                    var proplist = GetPtyProppertyValues(ptyId, 1);
                    ptyDict.Add(ptyId, proplist);
                }
            }

            prdwithPit.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                var oneprops = ptyDict.FirstOrDefault(l => l.Key == m.PtyId);
                PropertyValue power = null;
                if (oneprops.Key != 0)
                {
                    var powerGuid = oneprops.Value.FirstOrDefault(l => l.PropName == "Puissance");
                    power = GetPrdPropertyValues(m.PrdSepcifications).FirstOrDefault(l => powerGuid != null && l.PropGuid == powerGuid.PropGuid);
                    if (power != null && powerGuid != null)
                    {
                        power.PropUnit = powerGuid.PropUnit;
                    }
                }
                var diameter = string.Format("{0:0}", (m.PrdOutsideDiameter.HasValue && m.PrdOutsideDiameter > 0) ? m.PrdOutsideDiameter : null);
                diameter = !string.IsNullOrEmpty(diameter) ? (string.Format("Ø{0:0}", diameter)) : (string.Format("{0:0}x{1:0}", m.PrdLength, m.PrdWidth));
                diameter += "mm";

                var PrdName = string.Format("{0} {1} {2} {3} {4}", m.PrdName,
                    m.PrdRef,
                    m.PrdSubName,
                    (power != null ? (power.PropValue + power.PropUnit) : string.Empty),
                    diameter
                    );
                m.PrdName = PrdName.Trim();
            });

            result.AddRange(prdwithPit);
            result.AddRange(prdwithoutPit);

            return result.OrderBy(l => l.PrdName).ToList();
        }

        public List<KeyValue> GetClientProducts(int cliId, int socId, int pitId, string prdName)
        {
            var allprds = (from cin in _db.TM_CIN_Client_Invoice
                           join cii in _db.TM_CII_ClientInvoice_Line on cin.cin_id equals cii.cin_id
                           where cin.cli_id == cliId
                           && cin.soc_id == socId
                                 && ((pitId != 0 && cii.pit_id == pitId) || (pitId == 0 && cii.cii_prd_name == prdName))
                           select cii
                ).Select(m => new KeyValue
                {
                    Key = m.cii_id,
                    Key3 = m.cin_id,
                    Value = m.TM_CIN_Client_Invoice.cin_code,
                    DValue = m.TM_CIN_Client_Invoice.cin_d_invoice ?? DateTime.Now,
                    Key2 = m.cii_quantity ?? 0,
                    DcValue = m.cii_unit_price ?? 0,
                    DcValue2 = m.cii_total_price ?? 0,
                    DcValue3 = m.cii_total_crude_price ?? 0,
                    DcValue4 = m.cii_price_with_discount_ht ?? 0,
                    Actived = m.TM_CIN_Client_Invoice.cin_isinvoice,
                }).OrderByDescending(m => m.DValue).ToList();

            allprds.ForEach(m =>
            {
                m.Value2 = StringCipher.EncoderSimple(m.Key3.ToString(), "cinId");
            });
            return allprds;
        }

        public List<PurchaseLineBaseClass> GetLastSellPriceForClient(int cliId, int prdId, int pitId, int socId, string prdName, int supId, int sodId)
        {
            var solList = (from sod in _db.TM_SOD_Supplier_Order
                           join sol in _db.TM_SOL_SupplierOrder_Lines on sod.sod_id equals sol.sod_id
                           where sod.sup_id == supId && sod.cli_id == cliId && sod.soc_id == socId
                                 && sod.sod_id != sodId
                                 &&
                                 (
                                     (pitId != 0 && sol.pit_id == pitId)
                                     ||
                                     (pitId == 0 && prdId != 0 && sol.prd_id == prdId)
                                     ||
                                     (pitId == 0 && prdId == 0 && sol.sol_prd_name.Contains(prdName))
                                     )
                           select sol
                ).OrderByDescending(l => l.TM_SOD_Supplier_Order.sod_code)
                .Select(PurchaseBaseLineTranslator.RepositoryToEntitySol())
                .ToList();
            solList.ForEach(m =>
            {
                m.SodFId = StringCipher.EncoderSimple(m.SodId.ToString(), "sodId");
            });
            //.Select(l => new PurchaseLineBaseClass
            //{
            //    SodId = l.sod.sod_id,
            //    SolId = l.sol.sol_id,
            //    PrdId = l.sol.prd_id ?? 0,
            //    PitId = l.sol.pit_id ?? 0,
            //    SodCode = l.sod.sod_code,
            //    PrdName = l.sol.sol_prd_name,
            //    SodName = l.sod.sod_name,
            //    SodFId = StringCipher.EncoderSimple(l.sod.sod_id.ToString(), "sodId"),
            //    UnitPrice = l.sol.sol_unit_price ?? 0,
            //    UnitPriceWithDis = l.sol.sol_price_with_dis ?? 0,
            //    Quantity = l.sol.sol_quantity ?? 0,
            //    Commercial1 = l.sod.TR_CUR_Currency.cur_symbol, // 借用
            //    Description = l.sol.sol_description,
            //    Comment = l.sol.sol_comment
            //}).ToList();
            return solList;
        }

        #endregion For get product price by client

        #region For get product price by supplier

        public List<ProductInstance> GetSupplierSoldProducts(int supId, int socId)
        {
            var result = new List<ProductInstance>();

            var allprds = (from sod in _db.TM_SOD_Supplier_Order
                           join sol in _db.TM_SOL_SupplierOrder_Lines on sod.sod_id equals sol.sod_id
                           where sod.sup_id == supId && sod.soc_id == socId
                           select sol).ToList();

            var prdWithPit = allprds.Where(m => m.pit_id.HasValue).ToList();
            var prdWithOutPit = allprds.Where(m => !m.pit_id.HasValue).ToList();

            var productsWithPit = prdWithPit.Select(m => new ProductInstance
            {
                PrdId = m.prd_id ?? 0,
                PitId = m.pit_id ?? 0,
                PrdName = m.prd_id.HasValue ? m.TM_PRD_Product.prd_name : m.sol_prd_name,
                PrdRef = m.pit_id.HasValue ? m.TM_PIT_Product_Instance.pit_ref : string.Empty,
                PrdOutsideDiameter = m.prd_id.HasValue ? m.TM_PRD_Product.prd_outside_diameter : 0,
                PrdLength = m.prd_id.HasValue ? m.TM_PRD_Product.prd_length : 0,
                PrdWidth = m.prd_id.HasValue ? m.TM_PRD_Product.prd_width : 0,
                PrdHeight = m.prd_id.HasValue ? m.TM_PRD_Product.prd_height : 0,
                PrdSepcifications = m.prd_id.HasValue ? m.TM_PRD_Product.prd_specifications : string.Empty
            }).Distinct().ToList();

            // filter 
            var prdwithPit = new List<ProductInstance>();

            foreach (var productInstance in productsWithPit)
            {
                if (!prdwithPit.Any(m => m.PitId == productInstance.PitId))
                {
                    prdwithPit.Add(productInstance);
                }
            }

            var productWithOutPit = prdWithOutPit.Select(m => new ProductInstance
            {
                PrdId = m.prd_id ?? 0,
                PitId = m.pit_id ?? 0,
                PrdName = m.sol_prd_name,
            }).Distinct().ToList();

            // filter
            var prdwithoutPit = new List<ProductInstance>();

            foreach (var productInstance in productWithOutPit)
            {
                if (!prdwithoutPit.Any(m => m.PrdName == productInstance.PrdName))
                {
                    prdwithoutPit.Add(productInstance);
                }
            }

            var ptyIds = prdWithPit.Where(m => m.prd_id.HasValue).Select(m => m.TM_PRD_Product.pty_id).Distinct().ToList();
            var ptyDict = new Dictionary<int, List<PropertyValue>>();


            foreach (var ptyId in ptyIds)
            {
                if (!ptyDict.Any(l => l.Key == ptyId))
                {
                    var proplist = GetPtyProppertyValues(ptyId, 1);
                    ptyDict.Add(ptyId, proplist);
                }
            }

            prdwithPit.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PrdId.ToString(), "prdId");
                var oneprops = ptyDict.FirstOrDefault(l => l.Key == m.PtyId);
                PropertyValue power = null;
                if (oneprops.Key != 0)
                {
                    var powerGuid = oneprops.Value.FirstOrDefault(l => l.PropName == "Puissance");
                    power = GetPrdPropertyValues(m.PrdSepcifications).FirstOrDefault(l => powerGuid != null && l.PropGuid == powerGuid.PropGuid);
                    if (power != null && powerGuid != null)
                    {
                        power.PropUnit = powerGuid.PropUnit;
                    }
                }
                var diameter = string.Format("{0:0}", (m.PrdOutsideDiameter.HasValue && m.PrdOutsideDiameter > 0) ? m.PrdOutsideDiameter : null);
                diameter = !string.IsNullOrEmpty(diameter) ? (string.Format("Ø{0:0}", diameter)) : (string.Format("{0:0}x{1:0}", m.PrdLength, m.PrdWidth));
                diameter += "mm";

                var PrdName = string.Format("{0} {1} {2} {3} {4}", m.PrdName,
                    m.PrdRef,
                    m.PrdSubName,
                    (power != null ? (power.PropValue + power.PropUnit) : string.Empty),
                    diameter
                    );
                m.PrdName = PrdName.Trim();
            });

            result.AddRange(prdwithPit);
            result.AddRange(prdwithoutPit);

            return result.OrderBy(l => l.PrdName).ToList();
        }

        public List<KeyValue> GetSupplierProducts(int supId, int socId, int pitId, string prdName)
        {
            var allprds = (from sod in _db.TM_SOD_Supplier_Order
                           join sol in _db.TM_SOL_SupplierOrder_Lines on sod.sod_id equals sol.sod_id
                           where sod.sup_id == supId
                                 && sod.soc_id == socId
                                 && ((pitId != 0 && sol.pit_id == pitId) || (pitId == 0 && sol.sol_prd_name == prdName))
                           select sol
                ).Select(m => new KeyValue
                {
                    Key = m.sol_id,
                    Key3 = m.sod_id,
                    Value = m.TM_SOD_Supplier_Order.sod_code,
                    DValue = m.TM_SOD_Supplier_Order.sod_d_exp_delivery ?? DateTime.Now,
                    Key2 = m.sol_quantity ?? 0,
                    DcValue = m.sol_unit_price ?? 0,
                    DcValue2 = m.sol_total_price ?? 0,
                    DcValue3 = m.sol_total_crude_price ?? 0,
                    DcValue4 = m.sol_price_with_dis ?? 0,
                    Actived = m.TM_SOD_Supplier_Order.sod_canceled ?? false
                }).OrderByDescending(m => m.DValue).ToList();

            allprds.ForEach(m =>
            {
                m.Value2 = StringCipher.EncoderSimple(m.Key3.ToString(), "sodId");
            });
            return allprds;
        }

        #endregion For get product price by supplier

        #region Product for driver and accessory

        public List<Product> GetDriverAccessory(int status, int socId)
        {
            var name = status == 1 ? "DRIVER" : (status == 2 ? "ACCESSOIRE" : "OPTION");
            var drv_acc_prd = (from pty in _db.TM_PTY_Product_Type
                               join prd in _db.TM_PRD_Product on pty.pty_id equals prd.pty_id
                               where pty.pty_name.Contains(name)
                               select prd).Select(prd =>
                new Product
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
                    ProductType = prd.TM_PTY_Product_Type.pty_name
                }).ToList();
            return drv_acc_prd;
        }

        public List<ProductInstance> GetDrvAcc(int prdId, int socId)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId);
            if (prd != null)
            {
                var pits = GetProductInstances(prdId, prd.pty_id, socId);
                return pits;
            }
            else
            {
                return null;
            }
        }

        public int CreateUpdateDrvAcc(int prdMainId, int prdRefId, int pitRefId, int type, decimal price)
        {
            int pdaId = 0;
            var pda = _db.TR_PDA_Product_Driver_Accessory.FirstOrDefault(m => m.prd_id_main == prdMainId && m.pit_id_ref == pitRefId);
            if (pda != null)
            {
                pda.pda_price = price;
                _db.TR_PDA_Product_Driver_Accessory.ApplyCurrentValues(pda);
                _db.SaveChanges();
                pdaId = pda.pda_id;
            }
            else
            {
                pda = new TR_PDA_Product_Driver_Accessory
                {
                    prd_id_main = prdMainId,
                    prd_id_ref = prdRefId,
                    pit_id_ref = pitRefId,
                    pda_type = type,
                    pda_price = price
                };
                _db.TR_PDA_Product_Driver_Accessory.AddObject(pda);
                _db.SaveChanges();
                pdaId = pda.pda_id;
            }
            return pdaId;
        }

        public void DeleteDrvAcc(int prdMainId, int pitRefId)
        {
            var pda = _db.TR_PDA_Product_Driver_Accessory.FirstOrDefault(m => m.prd_id_main == prdMainId && m.pit_id_ref == pitRefId);
            if (pda != null)
            {
                _db.TR_PDA_Product_Driver_Accessory.DeleteObject(pda);
                _db.SaveChanges();
            }
        }

        public List<ProductInstance> GetProductDrvAcc(int prdId, int socId)
        {
            var pits = (from pda in _db.TR_PDA_Product_Driver_Accessory
                        join pit in _db.TM_PIT_Product_Instance on pda.pit_id_ref equals pit.pit_id
                        where pda.prd_id_main == prdId
                        select new ProductInstance
                        {
                            PitId = pit.pit_id,
                            PitDescription = pit.pit_description,
                            PitPrice = pda.pda_price,
                            PitRef = pit.pit_ref,
                            PitPurchasePrice = pit.pit_purchase_price,
                            PrdId = pit.prd_id,
                            PitPrdInfo = pit.pit_prd_info,
                            PtyId = pit.pty_id,
                            PrdName = pit.TM_PRD_Product.prd_name,
                            PrdSubName = pit.TM_PRD_Product.prd_sub_name,
                            InvId = pda.pda_type
                        }).ToList();
            var ptyIds = pits.Select(m => m.PtyId).ToList().Distinct().ToList();
            Dictionary<int, List<PropertyValue>> ptyPropValues = ptyIds.ToDictionary(ptyId => ptyId, ptyId => GetPtyProppertyValues(ptyId, socId));
            foreach (var productInstance in pits)
            {
                var onepty = ptyPropValues.FirstOrDefault(m => m.Key == productInstance.PtyId).Value;
                productInstance.PitAllInfo = GetPitKeyValues(productInstance.PitPrdInfo, onepty);
                productInstance.PitPrdInfo = null;
            }
            return pits;
        }

        #endregion Product for driver and accessory


        #region 供货商登录
        public List<ProductInstance> GetPitByRefSup(string pitRef, int prdId, int supId)
        {
            var pits = _db.TM_PIT_Product_Instance.Where(m => m.prd_id == prdId &&
                (string.IsNullOrEmpty(pitRef)
                || m.pit_ref.Contains(pitRef)
                ))
                    .Select(tmPit => new ProductInstance
                    {
                        PitId = tmPit.pit_id,
                        PtyId = tmPit.pty_id,
                        PitDescription = tmPit.pit_description,
                        PitPrice = tmPit.pit_price,
                        PitRef = tmPit.pit_ref,
                        // todo : 需要得到库存中的平均进价，或者通过计算得到进价
                        PitPurchasePrice = tmPit.pit_purchase_price,
                        PrdId = tmPit.prd_id,
                        PitPrdInfo = tmPit.pit_prd_info,
                        PrdName = tmPit.TM_PRD_Product.prd_name,
                        PrdSubName = tmPit.TM_PRD_Product.prd_sub_name,
                        PrdOutsideDiameter = tmPit.TM_PRD_Product.prd_outside_diameter,
                        PrdLength = tmPit.TM_PRD_Product.prd_length,
                        PrdWidth = tmPit.TM_PRD_Product.prd_width,
                        PrdHeight = tmPit.TM_PRD_Product.prd_height,
                        PrdSepcifications = tmPit.TM_PRD_Product.prd_specifications,
                        PitInventoryThreshold = tmPit.pit_inventory_threshold,
                        PitInventory = tmPit.TM_INV_Inventory.Any() ? tmPit.TM_INV_Inventory.FirstOrDefault().inv_quantity : 0
                    }).ToList();
            if (pits.Any())
            {

                var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                var ptyDict = new Dictionary<int, List<PropertyValue>>();

                foreach (var ptyId in ptyIds)
                {
                    if (!ptyDict.Any(l => l.Key == ptyId))
                    {
                        var proplist = GetPtyProppertyValues(ptyId, 1);
                        ptyDict.Add(ptyId, proplist);
                    }
                }

                //var ptyIds = pits.Select(m => m.PtyId).Distinct().ToList();
                foreach (var ptyId in ptyIds)
                {
                    var ptyPropValues = GetPtyProppertyValuesSup(ptyId);
                    var pitforThisPty = pits.Where(m => m.PtyId == ptyId).ToList();

                    pitforThisPty.ForEach(
                        onepit =>
                        {
                            onepit.PitAllInfo = GetPitKeyValues(onepit.PitPrdInfo, ptyPropValues).Where(
                                l => l.PropIsInTechReport
                                     && !l.PropIsImage
                                     && !l.PropIsSameValue).ToList();

                            var oneprops = ptyDict.FirstOrDefault(l => l.Key == onepit.PtyId);
                            if (oneprops.Key != 0)
                            {
                                var props = oneprops.Value.Where(l => propToadd.Any(k => k == l.PropName));
                                foreach (var propertyValue in props)
                                {
                                    var oneprop = GetPrdPropertyValues(onepit.PrdSepcifications).FirstOrDefault(l => l.PropGuid == propertyValue.PropGuid);
                                    if (oneprop != null)
                                    {
                                        oneprop.PropName = propertyValue.PropName;
                                        oneprop.PropUnit = propertyValue.PropUnit;
                                    }
                                    onepit.PitAllInfo.Add(oneprop);
                                }
                            }
                        }
                        );
                }

                var prdIds = pits.Select(m => m.PrdId).Distinct().ToList();
                foreach (var aPrdId in prdIds)
                {
                    var pitOfPrd = pits.Where(m => m.PrdId == aPrdId).ToList();
                    var supIds = _db.TR_SPR_Supplier_Product.Where(m => m.sup_id == supId && m.prd_id == aPrdId).Select(m => m.sup_id).ToList().Select(m => StringCipher.EncoderSimple(m.ToString(), "supId")).ToList();
                    pitOfPrd.ForEach(m => m.ProductSuppliers = supIds);
                }

            }
            pits.ForEach(m =>
            {
                m.FId = StringCipher.EncoderSimple(m.PitId.ToString(), "pitId");
                m.PitRef = string.Format("{0} [{1}]", m.PitRef, m.PitInventory);
            });
            return pits;
        }


        public List<PropertyValue> GetPtyProppertyValuesSup(int ptyId)
        {
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId);
            var propNames = new List<PropertyValue>();
            if (pty != null)
            {
                var xmlPtyField = pty.pty_specifications_fields;
                propNames = GetPtyPropertyValues(xmlPtyField);
            }
            return propNames;
        }

        #endregion 供货商登录

        #region API Methods

        /// <summary>
        /// Update a product by ID. Returns the updated Product or null if not found.
        /// </summary>
        public Product UpdateProductById(int prdId, int socId, Product updatedProduct)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
            if (prd == null)
            {
                return null;
            }

            // Update basic fields if provided
            if (!string.IsNullOrEmpty(updatedProduct.PrdName))
                prd.prd_name = updatedProduct.PrdName;
            if (!string.IsNullOrEmpty(updatedProduct.PrdSubName))
                prd.prd_sub_name = updatedProduct.PrdSubName;
            if (!string.IsNullOrEmpty(updatedProduct.PrdRef))
                prd.prd_ref = updatedProduct.PrdRef;
            if (!string.IsNullOrEmpty(updatedProduct.PrdDescription))
                prd.prd_description = updatedProduct.PrdDescription;
            if (updatedProduct.PtyId > 0)
                prd.pty_id = updatedProduct.PtyId;
            if (updatedProduct.PrdPrice.HasValue)
                prd.prd_price = updatedProduct.PrdPrice;
            if (updatedProduct.PrdPurchasePrice.HasValue)
                prd.prd_purchase_price = updatedProduct.PrdPurchasePrice;
            if (!string.IsNullOrEmpty(updatedProduct.PrdFileName))
                prd.prd_file_name = updatedProduct.PrdFileName;

            // Update dimension fields
            if (updatedProduct.PrdOutsideDiameter.HasValue)
                prd.prd_outside_diameter = updatedProduct.PrdOutsideDiameter;
            if (updatedProduct.PrdLength.HasValue)
                prd.prd_length = updatedProduct.PrdLength;
            if (updatedProduct.PrdWidth.HasValue)
                prd.prd_width = updatedProduct.PrdWidth;
            if (updatedProduct.PrdHeight.HasValue)
                prd.prd_height = updatedProduct.PrdHeight;
            if (updatedProduct.PrdHoleSize.HasValue)
                prd.prd_hole_size = updatedProduct.PrdHoleSize;
            if (updatedProduct.PrdDepth.HasValue)
                prd.prd_depth = updatedProduct.PrdDepth;
            if (updatedProduct.PrdWeight.HasValue)
                prd.prd_weight = updatedProduct.PrdWeight;
            if (updatedProduct.PrdUnitLength.HasValue)
                prd.prd_unit_length = updatedProduct.PrdUnitLength;
            if (updatedProduct.PrdUnitWidth.HasValue)
                prd.prd_unit_width = updatedProduct.PrdUnitWidth;
            if (updatedProduct.PrdUnitHeight.HasValue)
                prd.prd_unit_height = updatedProduct.PrdUnitHeight;
            if (updatedProduct.PrdUnitWeight.HasValue)
                prd.prd_unit_weight = updatedProduct.PrdUnitWeight;
            if (updatedProduct.PrdQuantityEachCarton.HasValue)
                prd.prd_quantity_each_carton = updatedProduct.PrdQuantityEachCarton;
            if (updatedProduct.PrdCartonLength.HasValue)
                prd.prd_carton_length = updatedProduct.PrdCartonLength;
            if (updatedProduct.PrdCartonWidth.HasValue)
                prd.prd_carton_width = updatedProduct.PrdCartonWidth;
            if (updatedProduct.PrdCartonHeight.HasValue)
                prd.prd_carton_height = updatedProduct.PrdCartonHeight;
            if (updatedProduct.PrdCartonWeight.HasValue)
                prd.prd_carton_weight = updatedProduct.PrdCartonWeight;
            if (updatedProduct.PrdOutsideLength.HasValue)
                prd.prd_outside_length = updatedProduct.PrdOutsideLength;
            if (updatedProduct.PrdOutsideWidth.HasValue)
                prd.prd_outside_width = updatedProduct.PrdOutsideWidth;
            if (updatedProduct.PrdOutsideHeight.HasValue)
                prd.prd_outside_height = updatedProduct.PrdOutsideHeight;
            if (updatedProduct.PrdHoleLength.HasValue)
                prd.prd_hole_lenght = updatedProduct.PrdHoleLength;
            if (updatedProduct.PrdHoleWidth.HasValue)
                prd.prd_hole_width = updatedProduct.PrdHoleWidth;

            // Update additional fields
            if (!string.IsNullOrEmpty(updatedProduct.PrdTmpRef))
                prd.prd_tmp_ref = updatedProduct.PrdTmpRef;
            if (!string.IsNullOrEmpty(updatedProduct.PrdSupDes))
                prd.prd_sup_description = updatedProduct.PrdSupDes;

            // Update specifications if provided
            if (updatedProduct.PrdGeneralInfoList != null && updatedProduct.PrdGeneralInfoList.Count > 0)
            {
                var newSepcifications = GenerateXmlFieldForGeneralInfo(updatedProduct.PrdGeneralInfoList);
                prd.prd_specifications = newSepcifications;
            }

            // Update timestamp
            prd.prd_d_update = DateTime.Now;

            _db.TM_PRD_Product.ApplyCurrentValues(prd);
            _db.SaveChanges();

            // Update product instances if provided
            if (updatedProduct.InstanceList != null && updatedProduct.InstanceList.Count > 0)
            {
                foreach (var onePrdIns in updatedProduct.InstanceList)
                {
                    if (onePrdIns.PitId > 0)
                    {
                        // Update existing instance
                        var oneIns = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pit_id == onePrdIns.PitId && m.prd_id == prdId);
                        if (oneIns != null)
                        {
                            if (!string.IsNullOrEmpty(onePrdIns.PitRef))
                                oneIns.pit_ref = onePrdIns.PitRef;
                            if (!string.IsNullOrEmpty(onePrdIns.PitDescription))
                                oneIns.pit_description = onePrdIns.PitDescription;
                            if (onePrdIns.PitPrice.HasValue)
                                oneIns.pit_price = onePrdIns.PitPrice;
                            if (onePrdIns.PitPurchasePrice.HasValue)
                                oneIns.pit_purchase_price = onePrdIns.PitPurchasePrice;
                            if (onePrdIns.PitInventoryThreshold > 0)
                                oneIns.pit_inventory_threshold = onePrdIns.PitInventoryThreshold;
                            if (onePrdIns.PitAllInfo != null && onePrdIns.PitAllInfo.Count > 0)
                            {
                                var pitPrdInfo = GenerateXmlFieldForProductInstrance(onePrdIns.PitAllInfo);
                                oneIns.pit_prd_info = pitPrdInfo;
                            }
                            oneIns.pty_id = prd.pty_id;
                            _db.TM_PIT_Product_Instance.ApplyCurrentValues(oneIns);
                        }
                    }
                }
                _db.SaveChanges();
            }

            // Return the updated product
            return LoadProductById(prdId, socId);
        }

        /// <summary>
        /// Activate or deactivate a product.
        /// Note: Since there's no active field in the product table, this is a stub that always returns true.
        /// Implement actual activation logic based on business requirements.
        /// </summary>
        public bool ActiverProduct(int socId, int prdId, bool activate)
        {
            var prd = _db.TM_PRD_Product.FirstOrDefault(m => m.prd_id == prdId && m.soc_id == socId);
            if (prd == null)
            {
                return false;
            }

            // Currently, the product table doesn't have an activation field.
            // This method returns true to indicate the product exists.
            // If activation logic is needed, it should be implemented based on business requirements
            // (e.g., adding a prd_actived field to the database, or using a related table).

            return true;
        }

        #endregion API Methods
    }
}


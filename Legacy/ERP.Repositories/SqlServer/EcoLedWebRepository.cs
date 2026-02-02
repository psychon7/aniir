using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using System.Xml;
using System.Globalization;
using System.Threading;
using System.Xml.Linq;
using ERP.Repositories.Extensions;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class EcoLedWebRepository : BaseSqlServerRepository
    {
        //TanZiXiong EcoLedWeb 
        private ProjectRepository ProjectRepository = new ProjectRepository();
        private CostPlanRepository CostPlanServices = new CostPlanRepository();
        #region  Master
        /// <summary>
        /// 获取母版页中produits下的类别
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> GetCategory()
        {
            var keyList = _db.TM_CAT_Category.Where(l => l.cat_is_actived && l.cat_display_in_menu && l.cat_parent_cat_id == null).Select(l => new KeyValue()
            {
                Key = l.cat_id,
                Value = l.cat_name,
            }).OrderBy(l => l.Value).Distinct().ToList();
            //var keyList = (from cat in _db.TM_CAT_Category
            //               join pca in _db.TR_PCA_Product_Category on cat.cat_id equals pca.cat_id
            //               join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
            //               join pty in _db.TM_PTY_Product_Type on prd.pty_id equals pty.pty_id
            //               where cat.cat_is_actived && cat.cat_order == 1
            //               orderby cat.cat_id
            //               group cat by cat.cat_id into result
            //               select new KeyValue()
            //               {
            //                   Key = result.Key,
            //                   Value = result.Max(l => l.cat_name)
            //               }).OrderBy(l => l.Value).Distinct().ToList();
            return keyList;
        }
        #endregion Master

        #region Index
        /// <summary>
        /// 获取index 第一层的显示 
        /// 这里显示在第一层，且是Actived 的，也就是在数据库中[cat_parent_cat_id]这里是null的且[cat_is_actived]=1的，显示在这里 
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> GetCategoryFirst()
        {

            var keyList = _db.TM_CAT_Category.Where(l => l.cat_is_actived && l.cat_parent_cat_id == null && l.cat_display_in_menu).Select(l => new KeyValue()
            {
                Key = l.cat_id,
                Value = l.cat_name,
                Value2 = l.cat_image_path

            }).ToList();
            return keyList;
        }
        /// <summary>
        /// 获取index New Products的显示 
        /// Category里面的，显示前8个
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> GetNewPro()
        {
            var prds = (from cat in _db.TM_CAT_Category
                        join pca in _db.TR_PCA_Product_Category on cat.cat_id equals pca.cat_id
                        join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                        where cat.cat_name.Contains("NEW PRODUCTS")
                        select new KeyValue
                        {
                            Key = prd.prd_id,
                            Value = prd.prd_name + "-" + prd.prd_ref,
                            Value2 = prd.TI_PIM_Product_Image.Any() ? prd.TI_PIM_Product_Image.OrderBy(l => l.pim_order).FirstOrDefault().pim_path : string.Empty
                        }).Take(8).ToList();
            return prds;
            //var keyList = (from pca in _db.TR_PCA_Product_Category
            //               join pro in _db.TM_PRD_Product on pca.prd_id equals pro.prd_id
            //               join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
            //               join pim in _db.TI_PIM_Product_Image on pro.prd_id equals pim.prd_id
            //               where pim.pim_order == 1
            //               select new KeyValue()
            //               {
            //                   Key = pro.prd_id,
            //                   Value = pro.prd_name + "-" + pro.prd_ref,
            //                   Value2 = pim.pim_path

            //               }).Take(8).ToList();
            //foreach (var item in keyList)
            //{
            //    var oneLine = _db.TS_WLL_Wishlist_line.FirstOrDefault(l => l.prd_id == item.Key);
            //    if (oneLine != null)
            //    {
            //        item.Actived = true;
            //    }
            //}
            //return keyList;
        }

        /// <summary>
        /// 获取index 广告页的显示 
        /// Category id=26，显示前3个
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> GetMenuViewPub()
        {
            var keyList = (from pca in _db.TR_PCA_Product_Category
                           join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                           join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
                           //join pim in _db.TI_PIM_Product_Image on pro.prd_id equals pim.prd_id
                           where
                               //pim.pim_order == 0  && 
                           cat.cat_name.Contains("main pub")
                           //pca.cat_id == 26
                           select new KeyValue()
                           {
                               Key = prd.prd_id,
                               Value = prd.prd_name + "-" + prd.prd_ref,
                               Value2 = prd.TI_PIM_Product_Image.OrderBy(l => l.pim_order).FirstOrDefault().pim_path,
                               Value3 = prd.prd_description
                           }).Take(3).ToList();

            return keyList;
        }
        /// <summary>
        /// 获取index 项目的显示 
        /// 显示前3个
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> GetProject()
        {

            var keyList = _db.TS_PRJ_Project.Take(3).Where(l => l.prj_actived && l.prj_recommended).Select(l => new KeyValue()
            {
                Key = l.prj_id,
                Value = l.prj_description,
                Value2 = l.TS_PIG_Project_Image.FirstOrDefault(m => m.pig_order == 1).pig_path,
                Value3 = l.prj_name,

            }).ToList();
            return keyList;
        }
        #endregion Index

        #region  Product

        /// <summary>
        /// 根据catid获取货物列表
        /// </summary>
        /// <param name="input">参数</param>
        /// <returns></returns>

        public List<KeyValue> GetPrdByCatid(ProInput input)
        {
            var keyList = (from cat in _db.TM_CAT_Category
                           join pca in _db.TR_PCA_Product_Category on cat.cat_id equals pca.cat_id
                           join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                           join pty in _db.TM_PTY_Product_Type on prd.pty_id equals pty.pty_id
                           where input.catId == 0 ? pty.pty_id == 1 : ((pca.cat_id == input.catId || cat.cat_parent_cat_id == input.catId))
                           select new KeyValue()
                           {
                               Key = prd.prd_id,
                               Value = prd.prd_name,
                               Value4 = prd.prd_ref,
                               Value2 = string.IsNullOrEmpty(prd.prd_description) ? string.Empty : prd.prd_description,
                               Value3 = prd.TI_PIM_Product_Image.FirstOrDefault(l => true).pim_path,
                           }).Distinct().OrderBy(l => l.Value4).Skip((input.pages * input.rows)).Take(input.rows).ToList();


            //var keyList = (from pca in _db.TR_PCA_Product_Category
            //               join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
            //               join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
            //               where (pca.cat_id == input.catId || cat.cat_parent_cat_id == input.catId)
            //               select new KeyValue()
            //               {
            //                   Key = prd.prd_id,
            //                   Value = prd.prd_name + "-" + prd.prd_ref,
            //                   Value2 = prd.prd_description,
            //                   Value3 = prd.TI_PIM_Product_Image.FirstOrDefault(l => true).pim_path,

            //               }).OrderBy(l => l.Key).Skip((input.pages * input.rows - input.rows)).Take(input.rows).ToList();

            foreach (var item in keyList)
            {
                var oneLine = _db.TS_WLL_Wishlist_line.FirstOrDefault(l => l.prd_id == item.Key);
                if (oneLine != null)
                {
                    item.Actived = true;
                }
            }

            return keyList;
        }

        public int GetPrdCount(ProInput input)
        {
            var keyList = (from pca in _db.TR_PCA_Product_Category
                           join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
                           join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                           where (pca.cat_id == input.catId || cat.cat_parent_cat_id == input.catId)
                           //select new KeyValue()
                           //{
                           //    Key = prd.prd_id,
                           //    Value = prd.prd_name + "-" + prd.prd_ref,
                           //    Value2 = prd.prd_description,
                           //    Value3 = prd.TI_PIM_Product_Image.FirstOrDefault(l => true).pim_path,

                           //}
                           select prd
                           ).Count();
            return keyList;
        }

        /// <summary>
        /// 通过搜索框查找对应商品信息
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        public List<KeyValue> SearchProduct(ProInput input)
        {
            var keyList = (from prd in _db.TM_PRD_Product
                           join pit in _db.TM_PIT_Product_Instance on prd.prd_id equals pit.prd_id
                               into leftJ
                           from lj in leftJ.DefaultIfEmpty()
                           select new { prd, lj }).Where(l => l.prd.prd_ref.Contains(input.value)
                                                 || l.prd.prd_name.Contains(input.value)
                                                 || l.prd.prd_sub_name.Contains(input.value)
                                                 || l.prd.prd_description.Contains(input.value)
                                                 || l.lj.pit_ref.Contains(input.value) ||
                                                 l.lj.pit_description.Contains(input.value)
                ).Select(l => new KeyValue()
                {
                    Key = l.prd.prd_id,
                    Value = l.prd.prd_name,
                    Value4 = l.prd.prd_ref,
                    Value2 = string.IsNullOrEmpty(l.prd.prd_description) ? string.Empty : l.prd.prd_description,
                    Value3 = l.prd.TI_PIM_Product_Image.Any(m => true) ? l.prd.TI_PIM_Product_Image.FirstOrDefault(m => true).pim_path : null
                }).Distinct().OrderBy(l => l.Value4).ToList();

            keyList = keyList.Skip(input.pages * input.rows).Take(input.rows).ToList().ToList();

            foreach (var item in keyList)
            {
                var oneLine = _db.TS_WLL_Wishlist_line.FirstOrDefault(l => l.prd_id == item.Key);
                if (oneLine != null)
                {
                    item.Actived = true;
                }
            }
            return keyList;
        }

        /// <summary>
        /// 获取produits下的类别
        /// </summary>
        /// <returns></returns>
        public List<CatOutList> GetCategoryForPrd()
        {
            List<CatOutList> outlist = new List<CatOutList>();
            var keyList = _db.TM_CAT_Category.Where(l => l.cat_is_actived && l.cat_display_in_menu && l.cat_parent_cat_id == null).ToList();
            var catIds = keyList.Select(l => l.cat_id).Distinct().ToList();
            var subCats = (from id in catIds
                           join cat in _db.TM_CAT_Category
                               on id equals cat.cat_parent_cat_id
                           where cat.cat_is_actived && cat.cat_display_in_menu
                           select cat).Distinct().ToList();

            foreach (var item in keyList)
            {
                CatOutList list = new CatOutList();
                list.CatId = item.cat_id;
                list.CatName = item.cat_name;
                //list.CatList = _db.TM_CAT_Category.Where(l => l.cat_parent_cat_id == item.cat_id).Select(l => new CatOut() { CatId = l.cat_id, CatName = l.cat_name, FId = (int)l.cat_parent_cat_id }).ToList();
                list.CatList = subCats.Where(l => l.cat_parent_cat_id == item.cat_id).Select(l => new CatOut() { CatId = l.cat_id, CatName = l.cat_name, FId = (int)l.cat_parent_cat_id }).ToList();
                outlist.Add(list);
            }

            return outlist;
        }

        #endregion Product

        #region Site Client
        public int CreateUpdateClient(Client oneClient, bool createCco = false)
        {
            int cliId = 0;
            bool create = false;
            if (oneClient.CmuId == 0)
            {
                oneClient.CmuId = CheckCommune(oneClient.Postcode, oneClient.City);
            }
            if (oneClient.Id != 0)
            {
                var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == oneClient.Id);
                if (cli != null)
                {
                    cli = ClientTranslator.EntityToRepository(oneClient, cli);
                    _db.TM_CLI_CLient.ApplyCurrentValues(cli);
                    _db.SaveChanges();
                    cliId = cli.cli_id;
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
                var newClient = new TM_CLI_CLient();
                var lastclient =
                    _db.TM_CLI_CLient.Where(m => m.soc_id == oneClient.SocId
                    && m.cli_d_creation.Year == oneClient.DateCreation.Year
                    && m.cli_d_creation.Month == oneClient.DateCreation.Month).OrderByDescending(m => m.cli_ref).FirstOrDefault();
                string lastRef = string.Empty;
                if (lastclient != null)
                {
                    lastRef = lastclient.cli_ref;
                }
                string clpref = GetCodePref(9);
                oneClient.Reference = GetGeneralRefContinuation(oneClient.DateCreation, clpref, lastRef, _codeType, 0);
                newClient = ClientTranslator.EntityToRepository(oneClient, newClient, true);
                _db.TM_CLI_CLient.AddObject(newClient);
                _db.SaveChanges();
                cliId = newClient.cli_id;
                // create client contact by default
                // create invoice address and delivery address
                if (createCco)
                {
                    ContactClientRepository ContactClientRepository = new ContactClientRepository();
                    var oneCco = new ContactClient
                    {
                        CliId = cliId,
                        CcoAdresseTitle = "Adresse Livraison",
                        CcoFirstname = "",
                        CcoLastname = "",
                        CcoAddress1 = oneClient.Address1,
                        CcoAddress2 = oneClient.Address2,
                        CcoPostcode = oneClient.Postcode,
                        CcoCity = oneClient.City,
                        CivId = 1,
                        CcoCountry = oneClient.Country,
                        CcoTel1 = oneClient.Tel1,
                        CcoTel2 = oneClient.Tel2,
                        SocId = oneClient.SocId,
                        CcoIsDeliveryAdr = true,
                        CcoIsInvoicingAdr = false,
                        CcoRecieveNewsletter = false,
                        UsrCreatedBy = oneClient.UsrCreatedBy,
                        CcoEmail = oneClient.Email,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        CcoFax = oneClient.Fax,
                        CcoCmuId = oneClient.CmuId,
                        CcoCellphone = oneClient.Cellphone,
                    };
                    ContactClientRepository.CreateUpdateContactClient(oneCco);
                    var oneCcoFac = new ContactClient
                    {
                        CliId = cliId,
                        CcoAdresseTitle = "Adresse Facturation",
                        CcoFirstname = "",
                        CcoLastname = "",
                        CcoAddress1 = oneClient.Address1,
                        CcoAddress2 = oneClient.Address2,
                        CcoPostcode = oneClient.Postcode,
                        CcoCity = oneClient.City,
                        CivId = 1,
                        CcoCountry = oneClient.Country,
                        CcoTel1 = oneClient.Tel1,
                        CcoTel2 = oneClient.Tel2,
                        SocId = oneClient.SocId,
                        CcoIsDeliveryAdr = false,
                        CcoIsInvoicingAdr = true,
                        CcoRecieveNewsletter = false,
                        UsrCreatedBy = oneClient.UsrCreatedBy,
                        CcoEmail = oneClient.Email,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        CcoFax = oneClient.Fax,
                        CcoCmuId = oneClient.CmuId,
                        CcoCellphone = oneClient.Cellphone,
                    };
                    ContactClientRepository.CreateUpdateContactClient(oneCcoFac);
                }
            }
            return cliId;
        }

        public int RegisterClient(SiteClient oneClient)
        {
            int sclId = 0;
            var checkEmailExist = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_email == oneClient.Email || m.scl_login == oneClient.Login);
            if (checkEmailExist != null)
            {
                // 已有该客户
                sclId = -2;
            }
            else
            {
                var newclient = ClientTranslator.EntityToRepositoryScl(oneClient, new TS_SCL_Site_Client(), true);
                _db.TS_SCL_Site_Client.AddObject(newclient);
                _db.SaveChanges();
                sclId = newclient.scl_id;
                // create password

                string password = StringCipher.Encrypt(oneClient.Pwd, oneClient.Login);
                var newPwd = new TS_CPW_Client_Password
                {
                    cpw_login = oneClient.Login,
                    //cpw_pwd = oneClient.Pwd,
                    cpw_pwd = password,
                    scl_id = sclId,
                    cpw_d_creation = DateTime.Now,
                    cpw_is_actived = true
                };
                _db.TS_CPW_Client_Password.AddObject(newPwd);
                _db.SaveChanges();

                // 创建收藏
                var wishList = new TS_WLS_Wishlist
                {
                    scl_id = newclient.scl_id,
                    wls_d_creation = DateTime.Now,
                    wls_is_actived = true,
                    wls_d_update = DateTime.Now
                };
                _db.TS_WLS_Wishlist.AddObject(wishList);
                _db.SaveChanges();
                // 创建购物车
                var shoppingCart = new TS_SCT_Shopping_Cart
                {
                    scl_id = newclient.scl_id,
                    sct_d_creation = DateTime.Now,
                    sct_is_actived = true
                };
                _db.TS_SCT_Shopping_Cart.AddObject(shoppingCart);
                _db.SaveChanges();


                ActiveSiteClient(oneClient);
            }
            return sclId;
        }

        public int ActiveSiteClient(SiteClient client)
        {
            ContactClientRepository ContactClientRepository = new ContactClientRepository();
            int cliId = 0;
            var scl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.soc_id == client.SocId && m.scl_id == client.SclId);
            int ccoId = 0;
            if (scl != null)
            {
                if (client.Id == 0)
                {
                    // create new client
                    var newclient = new Client
                    {
                        CompanyName = client.CompanyName,
                        Address1 = client.Address1,
                        Postcode = client.Postcode,
                        City = client.City,
                        Tel1 = client.Tel1,
                        Fax = client.Fax,
                        Cellphone = client.Cellphone,
                        Email = client.Email,
                        RecieveNewsletter = true,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        UsrCreatedBy = client.UsrCreatedBy,
                        Comment4Interne = client.Comment4Interne,
                        CtyId = 1,
                        CurId = 1,
                        PcoId = 1,
                        PmoId = 1,
                        VatId = 1,
                        SocId = 1,
                        ActId = null,
                        Isactive = true,
                        Isblocked = false,
                        VatIntra = client.VatIntra,
                        Siret = client.Siret,
                        InvoiceDay = 30,
                        InvoiceDayIsLastDay = true,
                        CliAccountingEmail = client.Email
                    };
                    cliId = CreateUpdateClient(newclient);
                    var cco = new ContactClient
                    {
                        CcoFirstname = client.FirstName,
                        CcoLastname = client.LastName,
                        CcoAddress1 = client.Address1,
                        CcoPostcode = client.Postcode,
                        CcoAdresseTitle = "Login site",
                        CcoIsDeliveryAdr = false,
                        CcoIsInvoicingAdr = false,
                        CcoCity = client.City,
                        CivId = client.CivId,
                        CcoTel1 = client.Tel1,
                        CcoFax = client.Fax,
                        CcoCellphone = client.Cellphone,
                        CcoEmail = client.Email,
                        CcoRecieveNewsletter = true,
                        CliId = cliId,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        UsrCreatedBy = client.UsrCreatedBy,
                        CcoComment = client.Comment4Interne
                    };
                    ccoId = ContactClientRepository.CreateUpdateContactClient(cco).CcoId;
                }
                else
                {
                    cliId = client.Id;
                    // add to client existed
                    var cco = new ContactClient
                    {
                        CcoFirstname = client.FirstName,
                        CcoLastname = client.LastName,
                        CcoAddress1 = client.Address1,
                        CcoPostcode = client.Postcode,
                        CcoAdresseTitle = "Login site",
                        CcoIsDeliveryAdr = false,
                        CcoIsInvoicingAdr = false,
                        CcoCity = client.City,
                        CivId = client.CivId,
                        CcoTel1 = client.Tel1,
                        CcoFax = client.Fax,
                        CcoCellphone = client.Cellphone,
                        CcoEmail = client.Email,
                        CcoRecieveNewsletter = true,
                        CliId = client.Id,
                        DateCreation = DateTime.Now,
                        DateUpdate = DateTime.Now,
                        UsrCreatedBy = client.UsrCreatedBy,
                        CcoComment = client.Comment4Interne
                    };
                    ccoId = ContactClientRepository.CreateUpdateContactClient(cco).CcoId;
                }
                if (cliId != 0 && ccoId != 0)
                {
                    scl.cli_id = cliId;
                    scl.cco_id = ccoId;
                    scl.scl_is_active = true;
                    scl.scl_d_active = DateTime.Now;
                    _db.TS_SCL_Site_Client.ApplyCurrentValues(scl);
                    _db.SaveChanges();
                }
            }
            return cliId;
        }

        public SiteClient Login(string login, string pwd)
        {
            SiteClient oneUser = new SiteClient();
            login = login.ToLower();
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_login == login);
            if (onescl != null)
            {
                var lastpwd = _db.TS_CPW_Client_Password.FirstOrDefault(m => m.scl_id == onescl.scl_id && m.cpw_is_actived);
                if (lastpwd != null)
                {
                    string password = StringCipher.Decrypt(lastpwd.cpw_pwd, login);
                    if (password == pwd)
                    {
                        oneUser = ClientTranslator.RepositoryToEntityScl().Compile().Invoke(onescl);
                    }
                    else
                    {
                        oneUser.SclId = -2;
                    }
                }
                else
                {
                    oneUser.SclId = -3;
                }
            }
            else
            {
                oneUser.SclId = -1;
            }
            return oneUser;
        }

        public SiteClient LoginWithId(int sclId, bool withPws = false)
        {
            SiteClient oneUser = null;
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_id == sclId);
            if (onescl != null)
            {
                oneUser = ClientTranslator.RepositoryToEntityScl(withPws).Compile().Invoke(onescl);
            }
            return oneUser;
        }

        public bool GetClientActiveFlag(int sclId)
        {
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.scl_id == sclId);
            return onescl != null && onescl.scl_is_active;
        }

        public int GetCountClientToActive(int socId)
        {
            var scls = _db.TS_SCL_Site_Client.Count(m => m.soc_id == socId && !m.scl_is_active);
            return scls;
        }

        public List<SiteClient> GetClientToActive(int socId, bool all = true)
        {
            var scls = _db.TS_SCL_Site_Client.Where(m => m.soc_id == socId && (all || !m.scl_is_active)).Select(ClientTranslator.RepositoryToEntityScl()).ToList();
            return scls;
        }

        public int CreatSiteClientByContactClient(int socId, int cliId, int ccoId)
        {
            int sclId = 0;
            var cco = _db.TM_CCO_Client_Contact.FirstOrDefault(m => m.cli_id == cliId && m.cco_id == ccoId && m.TM_CLI_CLient.soc_id == socId);
            var onescl = _db.TS_SCL_Site_Client.FirstOrDefault(m => m.soc_id == socId && m.cco_id == ccoId);
            if (cco != null && onescl == null)
            {
                var login = string.Empty;
                var password = string.Empty;
                var firstnamecount = string.IsNullOrEmpty(cco.cco_firstname) ? 0 : cco.cco_firstname.Length;

                var loginvalide = false;
                for (int i = 0; i < firstnamecount; i++)
                {
                    var logincheck = string.Format("{0}{1}", cco.cco_firstname.Substring(0, i + 1), cco.cco_lastname);
                    logincheck = logincheck.Replace(" ", "");
                    var loginNoexiste = !_db.TS_SCL_Site_Client.Any(l => l.scl_login == logincheck && l.soc_id == socId);
                    if (loginNoexiste)
                    {
                        loginvalide = true;
                        login = logincheck;
                        break;
                    }
                }
                var oneguid = Guid.NewGuid();
                if (!loginvalide)
                {
                    var loginnumber = oneguid.ToString().Substring(9, 4);
                    login = string.Format("{0}{2}{1}", cco.cco_lastname, loginnumber, string.IsNullOrEmpty(cco.cco_lastname) ? "" : "_");
                }
                password = oneguid.ToString().Substring(0, 8);

                var scl = new TS_SCL_Site_Client
                {
                    scl_firstname = cco.cco_firstname,
                    scl_lastname = cco.cco_lastname,
                    scl_email = cco.cco_email,
                    scl_is_active = true,
                    soc_id = socId,
                    cli_id = cliId,
                    cco_id = cco.cco_id,
                    civ_id = cco.civ_id,
                    scl_login = login,
                    scl_d_creation = DateTime.Now,
                    scl_d_active = DateTime.Now,
                    scl_company_name = cco.TM_CLI_CLient.cli_company_name,
                    scl_address1 = cco.cco_address1,
                    scl_tel1 = cco.cco_tel1,
                    scl_fax = cco.cco_fax,
                    scl_city = cco.cco_city,
                    scl_cellphone = cco.cco_cellphone,
                    scl_vat_intra = cco.TM_CLI_CLient.cli_vat_intra,
                    scl_siret = cco.TM_CLI_CLient.cli_siret
                };

                _db.TS_SCL_Site_Client.AddObject(scl);
                _db.SaveChanges();
                sclId = scl.scl_id;

                // create password
                password = StringCipher.Encrypt(password, scl.scl_login.ToLower());
                var newPwd = new TS_CPW_Client_Password
                {
                    cpw_login = scl.scl_login,
                    cpw_pwd = password,
                    scl_id = sclId,
                    cpw_d_creation = DateTime.Now,
                    cpw_is_actived = true
                };
                _db.TS_CPW_Client_Password.AddObject(newPwd);
                _db.SaveChanges();
            }
            return sclId;
        }

        #endregion Site Client

        #region Cart 购物车

        /// <summary>
        /// 根据用户ID获取对应购物车列表
        /// </summary>
        /// <param name="Id"></param>
        /// <returns></returns>
        public List<Shopping> GetShoppingListById(int userId)
        {
            List<Shopping> shoppingList = (from scl in _db.TS_SCL_Site_Client
                                           join sct in _db.TS_SCT_Shopping_Cart on scl.scl_id equals sct.scl_id
                                           join scln in _db.TS_SCLN_Shopping_Cart_Line on sct.sct_id equals scln.sct_id
                                           join prd in _db.TM_PRD_Product on scln.prd_id equals prd.prd_id
                                           join pty in _db.TM_PTY_Product_Type on prd.pty_id equals pty.pty_id
                                           //join pit in _db.TM_PIT_Product_Instance on scln.pit_id equals pit.pit_id
                                           //into leftJ
                                           //from lj in leftJ.DefaultIfEmpty()
                                           //join pim in _db.TI_PIM_Product_Image on prd.prd_id equals pim.prd_id
                                           //into leftJ2
                                           //from lj2 in leftJ2.DefaultIfEmpty()
                                           where scl.scl_id == userId //&& lj2.pim_order == 1
                                           select new Shopping
                                           {
                                               Id = scln.scln_id,
                                               prdId = prd.prd_id,
                                               ImgUrl = prd.TI_PIM_Product_Image.Any(l => l.pim_order == 1) ? prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 1).pim_path : (prd.TI_PIM_Product_Image.Any(l => !string.IsNullOrEmpty(l.pim_path)) ? prd.TI_PIM_Product_Image.Where(l => !string.IsNullOrEmpty(l.pim_path)).OrderBy(l => l.pim_order).FirstOrDefault().pim_path : null),
                                               Name = prd.prd_name,
                                               Ref = prd.prd_ref,
                                               //Ref = lj != null ? lj.pit_ref : prd.prd_ref,
                                               Qty = scln.scln_qty,
                                               pitId = scln.pit_id ?? 0,
                                               ptyId = pty.pty_id,
                                               //pit_prd_info = lj != null ? lj.pit_prd_info : null,
                                               Couleur = scln.scln_attr1,
                                               Puissance = scln.scln_attr2,
                                               Driver = scln.scln_attr3,
                                               Comment = scln.scln_comment
                                           }).OrderBy(l => l.Id).ToList();

            var scnlPit = (from sc in shoppingList
                           join pit in _db.TM_PIT_Product_Instance on sc.pitId equals pit.pit_id
                           select new { sc, pit }).ToList();

            foreach (var item in shoppingList)
            {
                var onescnlpit = scnlPit.FirstOrDefault(l => l.sc.Id == item.Id);

                if (onescnlpit != null)
                {
                    item.Ref = onescnlpit.pit.pit_ref;
                    item.pit_prd_info = onescnlpit.pit.pit_prd_info;
                }

                // 已经通过attr 赋值了
                var pitXmlList = GetPitKeyValues(item.pit_prd_info, GetPtyProppertyValues(item.ptyId), true);
                foreach (var onePit in pitXmlList)
                {
                    if (onePit.PropName == "Température de couleur")
                    {
                        item.Couleur = onePit.PropName + ":" + item.Couleur + onePit.PropUnit;
                    }
                    if (onePit.PropName == "Puissance")
                    {
                        item.Puissance = onePit.PropName + ":" + item.Puissance + onePit.PropUnit;
                    }
                    if (onePit.PropName == "Driver" || onePit.PropName == "Opération")
                    {
                        item.Driver = onePit.PropName + ":" + item.Driver + onePit.PropUnit;
                    }
                }
            }


            return shoppingList;
        }

        /// <summary>
        /// 添加购物车行
        /// </summary>
        /// <param name="Id"></param>
        /// <param name="UserId"></param>
        /// <param name="Qty"></param>
        public void AddShoppingLine(int prdId, int pitId, int UserId, int Qty, string attr1, string attr2, string attr3)
        {
            var oneLine = _db.TS_SCLN_Shopping_Cart_Line.FirstOrDefault(l => l.pit_id == pitId && l.prd_id == prdId
                // 20231029 这里需要判断一下attr 1,2,3 是否完全一样，如果一样，更改数量，否则增加一行。
                && (l.scln_attr1.Equals(attr1, StringComparison.OrdinalIgnoreCase) || (string.IsNullOrEmpty(l.scln_attr1) && string.IsNullOrEmpty(attr1)))
                && (l.scln_attr2.Equals(attr2, StringComparison.OrdinalIgnoreCase) || (string.IsNullOrEmpty(l.scln_attr2) && string.IsNullOrEmpty(attr2)))
                && (l.scln_attr3.Equals(attr3, StringComparison.OrdinalIgnoreCase) || (string.IsNullOrEmpty(l.scln_attr3) && string.IsNullOrEmpty(attr3)))
                );
            if (oneLine != null)
            {
                oneLine.scln_qty += 1;
                _db.TS_SCLN_Shopping_Cart_Line.ApplyCurrentValues(oneLine);
                _db.SaveChanges();
            }
            else
            {
                attr1 = string.IsNullOrEmpty(attr1) ? null : attr1.Trim();
                attr2 = string.IsNullOrEmpty(attr2) ? null : attr2.Trim();
                attr3 = string.IsNullOrEmpty(attr3) ? null : attr3.Trim();
                var cart = _db.TS_SCT_Shopping_Cart.FirstOrDefault(x => x.scl_id == UserId);
                var prd = _db.TM_PRD_Product.FirstOrDefault(x => x.prd_id == prdId);
                if (cart != null)
                {
                    var Line = new TS_SCLN_Shopping_Cart_Line
                    {
                        sct_id = cart.sct_id,
                        scln_d_add = DateTime.Now,
                        prd_id = prdId,
                        pit_id = pitId == 0 ? (int?)null : pitId,
                        scln_prd_name = string.IsNullOrEmpty(prd.prd_name) ? null : prd.prd_name.Trim(),
                        scln_qty = Qty,
                        scln_attr1 = attr1,
                        scln_attr2 = attr2,
                        scln_attr3 = attr3,
                    };
                    _db.TS_SCLN_Shopping_Cart_Line.AddObject(Line);
                    _db.SaveChanges();
                };
            }
        }
        /// <summary>
        /// 删除购物车行
        /// </summary>
        /// <param name="Id"></param>
        /// <returns></returns>
        public bool DelShoppingLine(int sclnId, int userId)
        {
            if (sclnId == 0)
            {
                var oneSct = _db.TS_SCT_Shopping_Cart.FirstOrDefault(l => l.scl_id == userId);
                var lineList = _db.TS_SCLN_Shopping_Cart_Line.Where(l => l.sct_id == oneSct.sct_id).ToList();
                foreach (var item in lineList)
                {
                    _db.TS_SCLN_Shopping_Cart_Line.DeleteObject(item);
                    _db.SaveChanges();
                }

                return true;
            }
            else
            {
                var Line = _db.TS_SCLN_Shopping_Cart_Line.FirstOrDefault(x => x.scln_id == sclnId);
                if (Line != null)
                {
                    _db.TS_SCLN_Shopping_Cart_Line.DeleteObject(Line);
                    _db.SaveChanges();
                    return true;
                }
                else
                {
                    return false;
                }
            }

        }

        /// <summary>
        /// 根据购物车明细创建一个订单
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        public string CreateOrder(int userId, List<Shopping> shpcartList)
        {
            // 20231029 确认scl 网站客户是否已经对应到client表中
            var oneScl = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userId);
            if (oneScl != null)
            {
                if (!oneScl.cli_id.HasValue)
                {
                    return "3";
                }
                try
                {
                    var oneCostPlan = new CostPlan()
                    {
                        SocId = 1,
                        CplDateCreation = DateTime.Now,
                        CplDateUpdate = DateTime.Now,
                        CliId = oneScl.cli_id.Value,
                        PcoId = oneScl.TM_CLI_CLient.pco_id,
                        PmoId = oneScl.TM_CLI_CLient.pmo_id,
                        CplDateValidity = DateTime.Now,
                        CcoIdInvoicing = oneScl.cco_id.Value,
                        VatId = oneScl.TM_CLI_CLient.vat_id,
                        UsrCreatorId = 1, // 默认是管理员创建
                        CplName = string.Format("SITE {0:yyyyMMddHHmmss}", DateTime.Now),
                        CplId = 0,
                        PrjId = 0,
                        CplFromSite = true,
                    };
                    var cplId = CostPlanServices.CreateUpdateCostPlan(oneCostPlan);
                    var onesct = _db.TS_SCT_Shopping_Cart.FirstOrDefault(l => l.scl_id == userId);
                    var cartLine = _db.TS_SCLN_Shopping_Cart_Line.Where(l => l.sct_id == onesct.sct_id);
                    if (cartLine.Any())
                    {
                        var level1 = 1;
                        foreach (var item in cartLine)
                        {
                            var shpcart = shpcartList.FirstOrDefault(l => l.Id == item.scln_id);
                            var onePrd = _db.TM_PRD_Product.FirstOrDefault(l => l.prd_id == item.prd_id);
                            var onePit = _db.TM_PIT_Product_Instance.FirstOrDefault(l => l.pit_id == item.pit_id);
                            var oneCln = new CostPlanLine()
                            {
                                CplId = cplId,
                                ClnLevel1 = level1,
                                ClnLevel2 = 1,
                                ClnDescription = string.Format("Temperature De Couleur: {0}\r\nPuissance: {1}\r\nDriver: {2}\r\n{3}", item.scln_attr1, item.scln_attr2, item.scln_attr3, shpcart != null ? shpcart.Comment : null),
                                PrdId = item.prd_id,
                                PitId = item.pit_id,
                                VatId = oneCostPlan.VatId,
                                LtpId = 4,
                                ClnPrdName = item.scln_prd_name,
                                ClnPrdDes = string.IsNullOrEmpty(onePrd.prd_description) ? null : onePrd.prd_description,
                                ClnQuantity = shpcart != null ? shpcart.Qty : item.scln_qty,
                                ClnUnitPrice = onePit != null ? onePit.pit_price ?? 0 : onePrd.prd_price ?? 0,
                                ClnPurchasePrice = onePit != null ? onePit.pit_purchase_price ?? 0 : onePrd.prd_purchase_price ?? 0,
                                ClnDiscountAmount = 0,
                                ClnDiscountPercentage = 0
                            };
                            oneCln.ClnTotalPrice = oneCln.ClnQuantity * oneCln.ClnUnitPrice;
                            oneCln.ClnTotalCrudePrice = oneCln.ClnQuantity * oneCln.ClnUnitPrice * (1 + oneScl.TM_CLI_CLient.TR_VAT_Vat.vat_vat_rate / 100);
                            var newCln = new TM_CLN_CostPlan_Lines();
                            newCln = CostPlanLineTranslator.EntityToRepository(oneCln, newCln, true);
                            _db.TM_CLN_CostPlan_Lines.AddObject(newCln);
                            level1++;
                        }
                        _db.SaveChanges();
                        //生成之后清空购物车
                        DelShoppingLine(0, userId);
                    }
                    return "1";

                }
                catch (Exception ex)
                {
                    return "2";
                }
            }
            else
            {
                return "4";
            }
        }

        public List<Shopping> SaveShopCart(int userId, List<Shopping> shopcart)
        {
            var usrshopcart = (from spc in shopcart
                               join scln in _db.TS_SCLN_Shopping_Cart_Line on spc.Id equals scln.scln_id
                               where scln.TS_SCT_Shopping_Cart.scl_id == userId
                               select new { spc, scln }).Distinct().ToList();

            var ifany = false;
            foreach (var shpcarts in usrshopcart)
            {
                ifany = true;
                shpcarts.scln.scln_qty = shpcarts.spc.Qty;
                shpcarts.scln.scln_comment = shpcarts.spc.Comment;
                _db.TS_SCLN_Shopping_Cart_Line.ApplyCurrentValues(shpcarts.scln);
            }
            if (ifany)
            {
                _db.SaveChanges();
            }
            return GetShoppingListById(userId);
        }

        #endregion 购物车

        #region Civility
        public List<KeyValue> GetCivility()
        {
            var allpco = _db.TR_CIV_Civility.Select(m => new KeyValue
            {
                Key = m.civ_id,
                Value = m.civ_designation,
                Actived = m.civ_active
            }).ToList();
            return allpco;
        }
        #endregion Civility

        #region  Project And ProjectDetails
        /// <summary>
        /// 获取所有的项目
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> GetAllPrj()
        {

            var ptjList = _db.TS_PRJ_Project.Where(l => l.prj_actived).ToList();
            List<KeyValue> keyList = new List<KeyValue>();
            foreach (var item in ptjList)
            {
                var key = new KeyValue()
                {

                    Key = item.prj_id,
                    Value = item.prj_name,
                    Value2 = item.TS_PIG_Project_Image.FirstOrDefault(m => true).pig_path,
                    Value3 = Convert.ToDateTime(item.prj_date).ToShortDateString()
                };
                keyList.Add(key);
            };

            return keyList;
        }

        /// <summary>
        /// 根据ID获取项目的详细信息
        /// </summary>
        /// <param name="prjId"></param>
        /// <returns></returns>
        public PrjDetaisOut GetPrjByPrjId(int prjId)
        {
            var onePrj = _db.TS_PRJ_Project.FirstOrDefault(l => l.prj_id == prjId);
            var oneOutPrj = new PrjDetaisOut()
            {
                prjId = onePrj.prj_id,
                name = onePrj.prj_name,
                cateDate = onePrj.prj_d_create.ToShortDateString(),
                client = onePrj.prj_client,
                date = Convert.ToDateTime(onePrj.prj_date).ToShortDateString(),
                description = onePrj.prj_description,
                designer = onePrj.prj_designer,
                firstImg = onePrj.TS_PIG_Project_Image.FirstOrDefault(l => true).pig_path,
                otherImg = onePrj.TS_PIG_Project_Image.Where(l => l.pig_order != 2).Select(l => l.pig_path).ToList(),
                loction = onePrj.prj_location,
                

            };
            var tagIdList = (from ptg in _db.TS_PTG_Project_Tag
                             join tag in _db.TS_TAG_Tags on ptg.tag_id equals tag.tag_id
                             where ptg.prj_id == prjId
                             select ptg.tag_id).ToList();
            var tagList = _db.TS_TAG_Tags.Where(l => tagIdList.Contains(l.tag_id)).Select(l => l.tag_tag).ToList();
            if (tagList.Count != 0)
            {
                var tagStr = "";
                foreach (var item in tagList)
                {
                    tagStr += item + ";";
                }
                oneOutPrj.tags = tagStr.Substring(0, tagStr.Length - 1);
                oneOutPrj.tagsList = _db.TS_TAG_Tags.Where(l => tagIdList.Contains(l.tag_id)).Select(l => new KeyValue()
                {
                    Key = l.tag_id,
                    Value = l.tag_tag

                }).ToList();
            }
            var prdIdList = _db.TS_PPD_Project_Product.Where(l => l.prj_id == prjId).Select(l => l.prd_id).ToList();
            oneOutPrj.prdList = _db.TM_PRD_Product.Where(l => prdIdList.Contains(l.prd_id)).Select(l => new KeyValue()
            {
                Key = l.prd_id,
                Value = l.prd_name,
                Value3 = l.prd_ref,
                Value2 = l.TI_PIM_Product_Image.FirstOrDefault(m => true).pim_path,
            }).ToList();

            return oneOutPrj;
        }

        /// <summary>
        /// 根据tagId查找相关Prj列表信息
        /// </summary>
        /// <param name="tagId"></param>
        /// <returns></returns>
        public List<KeyValue> GetPrjByTagId(int tagId)
        {
            var prjList = (from prj in _db.TS_PRJ_Project
                           join ptj in _db.TS_PTG_Project_Tag on prj.prj_id equals ptj.prj_id
                           where ptj.tag_id == tagId
                           select prj).ToList();
            var keyList = new List<KeyValue>();
            foreach (var item in prjList)
            {
                var key = new KeyValue()
                                  {
                                      Key = item.prj_id,
                                      Value = item.prj_name,
                                      Value2 = item.TS_PIG_Project_Image.FirstOrDefault(m => true).pig_path,
                                      Value3 = Convert.ToDateTime(item.prj_date).ToShortDateString()
                                  };
                keyList.Add(key);

            }

            return keyList;
        }
        #endregion Project  And ProjectDetails

        #region  productis_deails


        /// <summary>
        /// 根据prdId获取货物详情信息
        /// </summary>
        /// <returns></returns>
        public PrdDetailsOut GetPrdByPrdId(int prdId)
        {
            var onePrd = _db.TM_PRD_Product.FirstOrDefault(l => l.prd_id == prdId);
            var ptyId = onePrd.TM_PTY_Product_Type.pty_id;
            var oneLine = _db.TS_WLL_Wishlist_line.FirstOrDefault(l => l.prd_id == onePrd.prd_id);
            var onePrdDeails = new PrdDetailsOut()
            {
                ImgList = onePrd.TI_PIM_Product_Image.Select(l => l.pim_path).Take(5).ToList(),
                prdId = onePrd.prd_id,
                prdName = onePrd.prd_name,
                prdRef = onePrd.prd_ref,
                prdSubName = onePrd.prd_sub_name,
                description = onePrd.prd_description,
                prdPitList = new List<ProductInstance>(),
                prdXmlList = new List<PropertyValue>(),
                IsWish = oneLine != null ? true : false

            };

            onePrdDeails.prdPitList = GetProductInstances(onePrd.prd_id, ptyId, 1);

            onePrdDeails.prdXmlList = GetGeneralPropertyValuesFormXml(ptyId, 1, onePrd.prd_specifications, true);
            return onePrdDeails;
            //return outlist;
        }
        /// <summary>
        /// 根据prdId获取当前id的所有类别显示
        /// </summary>
        /// <returns></returns>
        public List<KeyValue> GetCatbyPrdId(int prdId)
        {
            List<KeyValue> keyList = new List<KeyValue>();
            var onePca = _db.TR_PCA_Product_Category.FirstOrDefault(l => l.prd_id == prdId);
            if (onePca != null)
            {
                var oneCat = _db.TM_CAT_Category.FirstOrDefault(l => l.cat_id == onePca.cat_id);
                if (oneCat != null)
                {
                    KeyValue oneKey = new KeyValue()
                    {
                        Key = oneCat.cat_id,
                        Value = oneCat.cat_name,
                        Actived = oneCat.cat_parent_cat_id == null ? true : false,
                    };
                    keyList.Add(oneKey);
                }
                if (oneCat != null && oneCat.cat_parent_cat_id != null)
                {
                    var ParentCat = _db.TM_CAT_Category.FirstOrDefault(l => l.cat_id == oneCat.cat_parent_cat_id);
                    KeyValue oneKey = new KeyValue()
                    {
                        Key = ParentCat.cat_id,
                        Value = ParentCat.cat_name,
                        Actived = true
                    };
                    keyList.Add(oneKey);
                }
            }

            return keyList;
        }


        #endregion productis_deails

        #region Wishlist 收藏

        /// <summary>
        /// 添加喜欢
        /// </summary>
        /// <param name="prdId"></param>
        /// <param name="userId"></param>
        /// <param name="pitId"></param>
        /// <param name="attr1"></param>
        /// <param name="attr2"></param>
        /// <param name="attr3"></param>
        public string AddWishlist(int prdId, int userId, int pitId, string attr1, string attr2, string attr3)
        {
            var onePrd = _db.TM_PRD_Product.FirstOrDefault(l => l.prd_id == prdId);
            var oneWls = _db.TS_WLS_Wishlist.FirstOrDefault(l => l.scl_id == userId);
            var line = _db.TS_WLL_Wishlist_line.FirstOrDefault(l => l.prd_id == prdId);
            if (onePrd != null)
            {
                attr1 = string.IsNullOrEmpty(attr1) ? null : attr1.Trim();
                attr2 = string.IsNullOrEmpty(attr2) ? null : attr2.Trim();
                attr3 = string.IsNullOrEmpty(attr3) ? null : attr3.Trim();
                if (line == null)
                {
                    var oneLine = new TS_WLL_Wishlist_line()
                    {
                        pit_id = pitId == 0 ? (int?)null : pitId,
                        prd_id = prdId,
                        wll_d_add = DateTime.Now,
                        wll_prd_name = string.IsNullOrEmpty(onePrd.prd_name) ? null : onePrd.prd_name.Trim(),
                        wls_id = oneWls.wls_id,
                        wll_attr1 = attr1,
                        wll_attr2 = attr2,
                        wll_attr3 = attr3

                    };
                    _db.TS_WLL_Wishlist_line.AddObject(oneLine);
                    _db.SaveChanges();
                    return "1";
                }
                else
                {
                    line.pit_id = pitId == 0 ? (int?)null : pitId;
                    line.wll_attr1 = attr1;
                    line.wll_attr2 = attr2;
                    line.wll_attr3 = attr3;
                    _db.TS_WLL_Wishlist_line.ApplyCurrentValues(line);
                    _db.SaveChanges();
                    return "2";
                }
            }
            else
            {
                return "2";
            }
        }

        /// <summary>
        /// 根据用户ID获取喜欢列表
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        public List<WishlistOut> GetWishlistLineByUserId(int userId)
        {
            var allWish = (from wls in _db.TS_WLS_Wishlist
                           join wll in _db.TS_WLL_Wishlist_line on wls.wls_id equals wll.wls_id
                           join prd in _db.TM_PRD_Product on wll.prd_id equals prd.prd_id
                           select new WishlistOut()
                           {
                               wllId = wll.wll_id,
                               prdRef = prd.prd_ref,
                               ImgUrl = prd.TI_PIM_Product_Image.FirstOrDefault(l => true).pim_path,
                               prdName = prd.prd_name,
                               ptyId = prd.TM_PTY_Product_Type.pty_id,
                               prdId = prd.prd_id,
                               Attr1 = wll.wll_attr1,
                               Attr2 = wll.wll_attr2,
                               Attr3 = wll.wll_attr3
                           }).ToList();
            foreach (var oneWish in allWish)
            {
                oneWish.prdPitList = new List<ProductInstance>();
                oneWish.prdPitList = GetProductInstances(oneWish.prdId, oneWish.ptyId, 1);

            }
            return allWish;
        }
        /// <summary>
        /// 根据Id删除对应的喜欢行
        /// </summary>
        /// <param name="wllId"></param>
        public void DeleteLineById(int wllId)
        {
            var oneLine = _db.TS_WLL_Wishlist_line.FirstOrDefault(l => l.wll_id == wllId);
            if (oneLine != null)
            {
                _db.TS_WLL_Wishlist_line.DeleteObject(oneLine);
                _db.SaveChanges();
            }
        }

        #endregion Wishlist 收藏

        #region XML

        public List<PropertyValue> GetPtyProppertyValues(int ptyId)
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
        /// 得到PIT的xml信息
        /// </summary>
        /// <param name="xmlfield"></param>
        /// <returns></returns>
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

        #endregion XML

        #region Commande Devis

        public List<CostPlan> GetUserCostPlans(int userId)
        {
            var cpls = (from scl in _db.TS_SCL_Site_Client
                        from cpl in _db.TM_CPL_Cost_Plan.Where(l => l.cli_id == scl.cli_id && l.cco_id_invoicing == scl.cco_id)
                        where scl.scl_id == userId
                        select cpl
                        ).Select(CostPlanTranslator.RepositoryToEntityLite()).ToList().Distinct().OrderByDescending(l => l.CplDateCreation).ToList();
            var clns = (from cpl in cpls
                        join cln in _db.TM_CLN_CostPlan_Lines on cpl.CplId equals cln.cpl_id
                        select cln).AsQueryable().Select(CostPlanLineTranslator.RepositoryToEntityLite()).ToList();

            cpls.ForEach(l =>
            {
                l.CostPlanLines = clns.Where(m => m.CplId == l.CplId).ToList();
            });
            return cpls;
        }

        #endregion Commande Devis
    }
}

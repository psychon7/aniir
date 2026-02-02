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
    public class ECOLECWebRepository : BaseSqlServerRepository
    {
        private ProjectRepository ProjectRepository = new ProjectRepository();
        private CostPlanRepository CostPlanServices = new CostPlanRepository();
        private ClientOrderRepository clientorder = new ClientOrderRepository();
        private ClientInvoiceRepository ClientInvoiceServices = new ClientInvoiceRepository();
        private ClientInvoiceLineRepository clientInvoiceline = new ClientInvoiceLineRepository();
        //private ClientInvoiceLineRepository ClientInvoiceLineServices = new ClientInvoiceLineRepository();
        private DeliveryFormRepository DeliveryFormservices = new DeliveryFormRepository();
        public List<KeyValue> GetMenuViewPub()
        {
            var keyList = (from pca in _db.TR_PCA_Product_Category
                           join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                           join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
                           //join pim in _db.TI_PIM_Product_Image on pro.prd_id equals pim.prd_id
                           where
                           //pim.pim_order == 0  && 
                           cat.cat_name.Contains("ECOLEC")
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
        /// Method to fetch the product images under ECOLEC category which are added with description as Home
        /// </summary>
        /// <returns>KeyList with Product Id, Name, Image Path and description</returns>
        public List<KeyValue> HomePage()
        {
            var keyList = (from pca in _db.TR_PCA_Product_Category
                           join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                           join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
                           join pim in _db.TI_PIM_Product_Image on prd.prd_id equals pim.prd_id
                           where cat.cat_name.Contains("ECOLEC")
                           && pim.pim_description.Contains("Home")
                           orderby prd.prd_id, pim.pim_order 
                           select new KeyValue()
                           {
                               Key = prd.prd_id,
                               Value = prd.prd_name + "-" + prd.prd_ref,
                               Value2 = pim.pim_path, 
                               Value3 = prd.prd_description
                           }).ToList();


            return keyList;
        }
        /// <summary>
        /// Method to fetch all the product details of the category name ECOLEC
        /// </summary>
        /// <returns>The product details like id,name,image and price details.</returns>
        public List<KeyValue> GetAllPrd()
        {

            var keyList = (from pca in _db.TR_PCA_Product_Category
                           join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                           join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
                           //join pim in _db.TI_PIM_Product_Image on pro.prd_id equals pim.prd_id
                           where                           
                           cat.cat_name.Equals("ECOLEC")                           
                           select new KeyValue()
                           {
                               Key = prd.prd_id,
                               Value = prd.prd_name,
                               Value2 = prd.TI_PIM_Product_Image.Where(i=> i.pim_description.Contains("Home")).Select(l => l.pim_path).FirstOrDefault(),
                               Value3 = prd.prd_description,
                               Key2 = (decimal)prd.prd_price,
                           }).Take(3).ToList();

            return keyList;

        }
        /// <summary>
        /// Method to get all Product names which are under ECOLEC category
        /// </summary>
        /// <returns>Product id and Name</returns>
        public List<KeyValue> GetProductName()
        {

            var keyList = (from pca in _db.TR_PCA_Product_Category
                           join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                           join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id                          
                           where                          
                           cat.cat_name.Contains("ECOLEC")                           
                           select new KeyValue()
                           {
                               Key = prd.prd_id,
                               Value = prd.prd_name,
                              
                           }).Take(3).ToList();

            return keyList;

        }
        /// <summary>
        /// Method to find the Product Id of the Product passed
        /// </summary>
        /// <param name="prdname">Name of the product</param>
        /// <returns>Product Id of the passed Product</returns>
        public int GetProductID(string prdname)
        {

            var productID = (from pca in _db.TR_PCA_Product_Category
                             join prd in _db.TM_PRD_Product on pca.prd_id equals prd.prd_id
                             join cat in _db.TM_CAT_Category on pca.cat_id equals cat.cat_id
                             where cat.cat_name.Equals("ECOLEC") && prd.prd_name.ToLower().Contains(prdname.ToLower())
                             select prd.prd_id).FirstOrDefault();


            return productID;
        }
        /// <summary>
        /// Method to fetch the client id of the user using the Email id
        /// </summary>
        /// <param name="email">Client's email id</param>
        /// <returns>Client id of the user</returns>
        public int GetUserIdbyEmail(string email)
        {

            var clientId = (from client in _db.TS_SCL_Site_Client
                            where client.scl_email.ToLower() == email.ToLower()
                            select client.scl_id).FirstOrDefault();

            return (int)clientId;
        }

        /// <summary>
        /// Method to get the PIT id using the Product id.
        /// </summary>
        /// <param name="prdid">id of the Product</param>
        /// <returns>PIT id of the product</returns>
        public int GetPitByPrdID(int prdid)
        {
            var keyList = (from prd in _db.TM_PIT_Product_Instance
                           where
                           prd.prd_id.Equals(prdid)
                           select prd.pit_id).FirstOrDefault();

            return (int)keyList;

        }

        #region Site Client
        /// <summary>
        /// Method to create the client if the user is new or update the information if the client is 
        /// already existing.
        /// </summary>
        /// <param name="oneClient">client details</param>
        /// <param name="createCco">Boolean value to create or update</param>
        /// <returns>Client id of the user</returns>
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
                oneClient.CliPdfVersion = "0";
                // oneClient.UsrCreatedBy = lastclient.usr_created_by;
                //var user = new User()
                //{
                //    UserLogin= newClient.
                //}
                //user = UserTranslator.EntityToRepository(oneClient, user, true);
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
                oneClient.SclId = sclId;
                oneClient.UsrCreatedBy = 1;
                //oneClient.us
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
        private void CreateUserRelationship(int usrCreatorId, int usrId)
        {
            var urs = _db.TR_URS_User_Relationship.FirstOrDefault(m => m.usr_level1_id == usrCreatorId && m.usr_level2_id == usrId);
            if (urs == null)
            {
                var oneusr = new TR_URS_User_Relationship
                {
                    usr_level1_id = usrCreatorId,
                    usr_level2_id = usrId,
                    urs_type = 1
                };
                _db.TR_URS_User_Relationship.AddObject(oneusr);
                _db.SaveChanges();
            }

        }
        public void CreateUpdatePassword(int socId, int usrId, string pwd)
        {
            if (!string.IsNullOrEmpty(pwd))
            {
                var user = _db.TM_USR_User.FirstOrDefault(m => m.soc_id == socId && m.usr_id == usrId);
                if (user != null)
                {
                    var password = StringCipher.Encrypt(pwd, user.usr_login.ToLower());
                    var othersPwds = _db.TR_UPD_User_Password.Where(m => m.usr_id == usrId && m.upd_actived).ToList();
                    foreach (var oneupd in othersPwds)
                    {
                        oneupd.upd_actived = false;
                        oneupd.upd_d_updated = DateTime.Now;
                        _db.TR_UPD_User_Password.ApplyCurrentValues(oneupd);
                        _db.SaveChanges();
                    }

                    var upd = new TR_UPD_User_Password
                    {
                        usr_id = usrId,
                        upd_pwd = password,
                        upd_d_creation = DateTime.Now,
                        upd_actived = true
                    };
                    _db.TR_UPD_User_Password.AddObject(upd);
                    _db.SaveChanges();
                    // re-update user password
                    user.usr_pwd = password;
                    _db.TM_USR_User.ApplyCurrentValues(user);
                    _db.SaveChanges();
                }
            }
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
        public List<ShoppingECOLEC> GetShoppingListById(int userId)
        {
            List<ShoppingECOLEC> shoppingList = (from scl in _db.TS_SCL_Site_Client
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
                                                 select new ShoppingECOLEC
                                                 {
                                                     Id = scln.scln_id,
                                                     prdId = prd.prd_id,
                                                     ImgUrl = prd.TI_PIM_Product_Image.Any(l => l.pim_order == 1) ? prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 1).pim_path : (prd.TI_PIM_Product_Image.Any(l => !string.IsNullOrEmpty(l.pim_path)) ? prd.TI_PIM_Product_Image.Where(l => !string.IsNullOrEmpty(l.pim_path)).OrderBy(l => l.pim_order).FirstOrDefault().pim_path : null),
                                                     Name = prd.prd_name,
                                                     Ref = prd.prd_ref,
                                                     //Ref = lj != null ? lj.pit_ref : prd.prd_ref,
                                                     Qty = scln.scln_qty,
                                                     price = prd.prd_price,
                                                     pitId = scln.pit_id ?? 0,
                                                     ptyId = pty.pty_id,
                                                     //pit_prd_info = lj != null ? lj.pit_prd_info : null,
                                                     Couleur = scln.scln_attr1,
                                                     Puissance = scln.scln_attr2,
                                                     Driver = scln.scln_attr3,
                                                     Comment = scln.scln_comment,
                                                     orderId = scln.sct_id
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
            var cart = _db.TS_SCT_Shopping_Cart.FirstOrDefault(x => x.scl_id == UserId);
            var oneLine = _db.TS_SCLN_Shopping_Cart_Line.FirstOrDefault(l=>l.prd_id == prdId && l.sct_id == cart.sct_id
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
                cart = _db.TS_SCT_Shopping_Cart.FirstOrDefault(x => x.scl_id == UserId);
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
      
        public int UpdateQuantity(int prdId, int qty, int userId)
        {

            var oneScl = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userId);
            var shoppingcartline = _db.TS_SCLN_Shopping_Cart_Line.Where(s => s.sct_id == userId).ToList();
            //var costplan = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cli_id == oneScl.cli_id);
            //var cpllList = _db.TM_CLN_CostPlan_Lines
            //         .Where(l => l.cpl_id == costplan.cpl_id)
            //         .ToList();
            //foreach (var line in cpllList)
            //{
            //    if (prdId.Equals(line.prd_id))
            //    {
            //        line.cln_quantity = qty;
            //        _db.TM_CLN_CostPlan_Lines.ApplyCurrentValues(line);
            //        _db.SaveChanges();
            //    }

            //}

            foreach (var line in shoppingcartline)
            {
                if (prdId.Equals(line.prd_id))
                {
                    line.scln_qty = qty;
                    _db.TS_SCLN_Shopping_Cart_Line.ApplyCurrentValues(line);
                    _db.SaveChanges();
                }
            }

            return 0;


        }
        /// <summary>
        /// Method to remove the booking line
        /// </summary>
        /// <param name="sclnId">Scln Id of the order</param>
        /// <param name="userId">User ID</param>
        /// <returns>Boolean value based on deletion</returns>
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
                var Line = _db.TS_SCLN_Shopping_Cart_Line.FirstOrDefault(x => x.scln_id == sclnId || x.prd_id == sclnId);
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
        /// Method to get the Product details of the cart
        /// </summary>
        /// <param name="sctid">Sctid of the product</param>
        /// <returns>List of the product details in the cart</returns>
        public List<CartProductDetails> GetCartProductDetails(int sctid)
        {
            var cartDetails = (from line in _db.TS_SCLN_Shopping_Cart_Line
                               join product in _db.TM_PRD_Product
                               on line.prd_id equals product.prd_id
                               where line.sct_id == sctid
                               select new CartProductDetails
                               {
                                   CartId = line.sct_id,
                                   ImgUrl = product.TI_PIM_Product_Image.FirstOrDefault(l => true).pim_path,
                                   ProductId = product.prd_id,
                                   ProductName = product.prd_name,
                                   Quantity = line.scln_qty,
                                   Price = product.prd_price,
                                   Total = line.scln_qty * product.prd_price
                               }).ToList();

            return cartDetails;
        }

        public int UpdateCostPlanStatus(int userId, string chargeId, string cplcode)
        {
            var oneScl = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userId);
            var costplan = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cli_id == oneScl.cli_id && m.cpl_code == cplcode);
            var cpl_status = _db.TR_CST_CostPlan_Statut.FirstOrDefault(s => s.cst_id == costplan.cst_id).cst_designation;
            var cancel_status = _db.TR_CST_CostPlan_Statut.FirstOrDefault(t => t.cst_designation.Contains("Annulé et rembourssé de STRIPE"));


            costplan.cst_id = cancel_status.cst_id;
            costplan.cpl_d_update = DateTime.Now;
            _db.TM_CPL_Cost_Plan.ApplyCurrentValues(costplan);
            _db.SaveChanges();


            return costplan.cpl_id;
        }
        /// <summary>
        /// 根据购物车明细创建一个订单
        /// </summary>
        /// <param name="userId"></param>
        /// <returns></returns>
        public int CreateCostPlan(int userId, List<Shopping> shpcartList)
        {
            // 20231029 确认scl 网站客户是否已经对应到client表中
            var oneScl = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userId);

            var cpl_code = string.Empty;
            if (oneScl != null)
            {
                if (!oneScl.cli_id.HasValue)
                {
                    return 3;
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
                        UsrCreatorId = 27, // 默认是管理员创建
                        CplName = string.Format("SITE {0:yyyyMMddHHmmss}", DateTime.Now),
                        CplId = 0,
                        PrjId = 0,                          
                        CplFromSite = true,
                        cpl_stripe_chargeid = null
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
                                ClnDescription = onePrd.prd_ref,
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
                            newCln.cln_total_price = oneCln.ClnTotalPrice;
                            newCln.cln_price_with_discount_ht = oneCln.ClnTotalPrice;
                            _db.TM_CLN_CostPlan_Lines.AddObject(newCln);
                            level1++;
                        }
                        _db.SaveChanges();
                        //生成之后清空购物车

                        DelShoppingLine(0, userId);
                        cpl_code = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cpl_id == cplId).cpl_code;

                        //  return cplId;
                        // CreateClientOrder(userId);
                    }
                    return cplId;

                }
                catch (Exception ex)
                {
                    return 2;
                }
            }
            else
            {
                return 4;
            }
        }
        public string CreateCostPlanPayOnline(int userId, int prdid, int quantity, string charge_id)
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
                        UsrCreatorId = 27, 
                        CplName = string.Format("SITE {0:yyyyMMddHHmmss}", DateTime.Now),
                        CplId = 0,
                        PrjId = 0,
                        CstId = 8,
                        cpl_stripe_chargeid = charge_id,
                        CplFromSite = true,
                    };
                    var cplId = CostPlanServices.CreateUpdateCostPlan(oneCostPlan);
                    var cod_code = "";
                    var onesct = _db.TS_SCT_Shopping_Cart.FirstOrDefault(l => l.scl_id == userId);
                    var shpcartList = _db.TS_SCLN_Shopping_Cart_Line.Where(k => k.prd_id == prdid && k.sct_id == onesct.sct_id);
                    var cartLine = _db.TS_SCLN_Shopping_Cart_Line.Where(l => l.sct_id == onesct.sct_id);
                    if (cartLine.Any())
                    {
                        var level1 = 1;
                        foreach (var item in cartLine)
                        {
                            var shpcart = shpcartList.FirstOrDefault(l => l.scln_id == item.scln_id);
                            var onePrd = _db.TM_PRD_Product.FirstOrDefault(l => l.prd_id == item.prd_id);
                            var onePit = _db.TM_PIT_Product_Instance.FirstOrDefault(l => l.pit_id == item.pit_id);
                            var oneCln = new CostPlanLine()
                            {
                                CplId = cplId,
                                ClnLevel1 = level1,
                                ClnLevel2 = 1,
                                ClnDescription = onePrd.prd_description,
                                PrdId = item.prd_id,
                                PitId = item.pit_id,
                                VatId = oneCostPlan.VatId,
                                LtpId = 4,
                                ClnPrdName = item.scln_prd_name,
                                ClnPrdDes = string.IsNullOrEmpty(onePrd.prd_description) ? null : onePrd.prd_description,
                                ClnQuantity = quantity,
                                ClnUnitPrice = onePit != null ? onePit.pit_price ?? 0 : onePrd.prd_price ?? 0,
                                ClnPurchasePrice = onePit != null ? onePit.pit_purchase_price ?? 0 : onePrd.prd_purchase_price ?? 0,
                                ClnDiscountAmount = 0,
                                ClnDiscountPercentage = 0,

                            };
                            oneCln.ClnTotalPrice = oneCln.ClnQuantity * oneCln.ClnUnitPrice;
                            oneCln.ClnTotalCrudePrice = oneCln.ClnQuantity * oneCln.ClnUnitPrice * (1 + oneScl.TM_CLI_CLient.TR_VAT_Vat.vat_vat_rate / 100);
                            var newCln = new TM_CLN_CostPlan_Lines();
                            newCln = CostPlanLineTranslator.EntityToRepository(oneCln, newCln, true);
                            newCln.cln_total_price = oneCln.ClnTotalPrice;
                            newCln.cln_price_with_discount_ht = oneCln.ClnTotalPrice;
                            _db.TM_CLN_CostPlan_Lines.AddObject(newCln);
                            level1++;
                        }
                        _db.SaveChanges();
                        //生成之后清空购物车

                        DelShoppingLine(0, userId);
                        cod_code = CreateClientOrder(userId);
                        if (cod_code != "-1")
                        {

                        }
                        else
                        {
                            cplId = -1;
                        }
                    }
                    return cod_code;

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
        public List<KeyValuePair<string, string>> GetCustomerDetails(string userId)
        {
            var key = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_login == userId);

            if (key == null)
                return new List<KeyValuePair<string, string>>();

            var keyList = new List<KeyValuePair<string, string>>
            {
                 new KeyValuePair<string, string>("Email", key.scl_email),
                 new KeyValuePair<string, string>("Address1", key.scl_address1),
                 new KeyValuePair<string, string>("FirstName", key.scl_firstname),
                 new KeyValuePair<string, string>("LastName", key.scl_lastname),
                 new KeyValuePair<string, string>("Telephone", key.scl_tel1),
                 new KeyValuePair<string, string>("City", key.scl_city),
                 new KeyValuePair<string, string>("PostCode", key.scl_postcode)
            };

            return keyList;
        }
        public List<KeyValuePair<string, string>> GetOrderdetails(string code, int userid)
        {
            var category = _db.TM_CAT_Category.Where(cat => cat.cat_name.Equals("ECOLEC")).FirstOrDefault();
            var key = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userid);


            var keyList = new List<KeyValuePair<string, string>>
            {
                 new KeyValuePair<string, string>("Email", key.scl_email),
                 new KeyValuePair<string, string>("Address1", key.scl_address1),
                 new KeyValuePair<string, string>("FirstName", key.scl_firstname),
                 new KeyValuePair<string, string>("LastName", key.scl_lastname),
                 new KeyValuePair<string, string>("Telephone", key.scl_tel1),
                 new KeyValuePair<string, string>("City", key.scl_city),
                 new KeyValuePair<string, string>("Code", code),
                 new KeyValuePair<string, string>("PostCode", key.scl_postcode),
                 new KeyValuePair<string, string>("url", category.cat_image_path)
            };

            return keyList;
        }

        public bool checkDeliveryStatus(int cplid)
        {
            var cod = _db.TM_COD_Client_Order.FirstOrDefault(m => m.cpl_id == cplid);
            var delivery = _db.TM_DFO_Delivery_Form.FirstOrDefault(d => d.cod_id == cod.cod_id);
            if (cod != null && delivery == null)
            {
                return true;
            }
            return false;
        }
        public List<KeyValuePair<string, string>> GetOrderdetailsoffline(int cpl_id, int userid)
        {
            var category = _db.TM_CAT_Category.Where(cat => cat.cat_name.Equals("ECOLEC")).FirstOrDefault();
            var key = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userid);
            var cpl_Code = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.cpl_id == cpl_id).cpl_code;

            var keyList = new List<KeyValuePair<string, string>>
            {
                 new KeyValuePair<string, string>("Email", key.scl_email),
                 new KeyValuePair<string, string>("Address1", key.scl_address1),
                 new KeyValuePair<string, string>("FirstName", key.scl_firstname),
                 new KeyValuePair<string, string>("LastName", key.scl_lastname),
                 new KeyValuePair<string, string>("Telephone", key.scl_tel1),
                 new KeyValuePair<string, string>("City", key.scl_city),
                 new KeyValuePair<string, string>("Code", cpl_Code),
                 new KeyValuePair<string, string>("PostCode", key.scl_postcode),
                 new KeyValuePair<string, string>("url", category.cat_image_path)
            };

            return keyList;
        }

        public string CreateClientOrder(int userId)
        {
            var oneScl = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userId);
            var costplan = _db.TM_CPL_Cost_Plan
                    .Where(m => m.cli_id == oneScl.cli_id)
                    .OrderByDescending(m => m.cpl_d_creation)
                    .FirstOrDefault();
            var cod_code = PassCostPlan2ClientOrder(costplan.cpl_id, costplan.soc_id);
            return cod_code;
        }

        //public string GetClientOrderLines(string codorder)
        //{
        //    var clientorder = _db.TM_COD_Client_Order.FirstOrDefault(f => f.cod_code == codorder);

        //}

        public string PassCostPlan2ClientOrder(int cplId, int socId)
        {
            int codId = 0;
            var cod_code = "";
            var cpl = _db.TM_CPL_Cost_Plan.FirstOrDefault(m => m.soc_id == socId && m.cpl_id == cplId);
            if (cpl != null)
            {

                var cod = new ClientOrder
                {
                    CodId = 0,
                    CplId = cpl.cpl_id,
                    SocId = cpl.soc_id,
                    PrjId = cpl.prj_id,
                    VatId = cpl.vat_id,
                    CplCode = cpl.cpl_code,
                    PrjName = cpl.TM_PRJ_Project.prj_name,
                    PrjCode = cpl.TM_PRJ_Project.prj_code,
                    CodDateCreation = DateTime.Now,
                    CodDateUpdate = DateTime.Now,
                    CliId = cpl.cli_id,
                    ClientCompanyName = cpl.TM_CLI_CLient.cli_company_name,
                    PcoId = cpl.pco_id,
                    PmoId = cpl.pmo_id,
                    PaymentMode = cpl.TR_PMO_Payment_Mode.pmo_designation,
                    PaymentCondition = cpl.TR_PCO_Payment_Condition.pco_designation,
                    CodDatePreDeliveryForm = null,
                    CodDatePreDeliveryTo = null,
                    CodDateEndWork = null,
                    CodHeaderText = cpl.cpl_header_text,
                    CodFooterText = cpl.cpl_footer_text,
                    //CcoIdDelivery = cpl.cco_id_delivery,
                    CcoIdInvoicing = cpl.cco_id_invoicing,
                    CodClientComment = cpl.cpl_client_comment,
                    CodInterComment = cpl.cpl_inter_comment,
                    UsrCreatorId = cpl.usr_creator_id,
                    CodName = cpl.cpl_name,
                    #region cco
                    // invoicing
                    //Inv_CcoFirstname = cpl.cpl_inv_cco_firstname,
                    //Inv_CcoLastname = cpl.cpl_inv_cco_lastname,
                    //Inv_CcoAddress1 = cpl.cpl_inv_cco_address1,
                    //Inv_CcoAddress2 = cpl.cpl_inv_cco_address2,
                    //Inv_CcoPostcode = cpl.cpl_inv_cco_postcode,
                    //Inv_CcoCity = cpl.cpl_inv_cco_city,
                    //Inv_CcoCountry = cpl.cpl_inv_cco_country,
                    //Inv_CcoTel1 = cpl.cpl_inv_cco_tel1,
                    //Inv_CcoFax = cpl.cpl_inv_cco_fax,
                    //Inv_CcoCellphone = cpl.cpl_inv_cco_cellphone,
                    //Inv_CcoEmail = cpl.cpl_inv_cco_email,
                    Inv_CcoRef = cpl.TM_CCO_Client_Contact != null ? cpl.TM_CCO_Client_Contact.cco_ref : string.Empty,
                    // delivery
                    //Dlv_CcoFirstname = cpl.cpl_dlv_cco_firstname,
                    //Dlv_CcoLastname = cpl.cpl_dlv_cco_lastname,
                    //Dlv_CcoAddress1 = cpl.cpl_dlv_cco_address1,
                    //Dlv_CcoAddress2 = cpl.cpl_dlv_cco_address2,
                    //Dlv_CcoPostcode = cpl.cpl_dlv_cco_postcode,
                    //Dlv_CcoCity = cpl.cpl_dlv_cco_city,
                    //Dlv_CcoCountry = cpl.cpl_dlv_cco_country,
                    //Dlv_CcoTel1 = cpl.cpl_dlv_cco_tel1,
                    //Dlv_CcoFax = cpl.cpl_dlv_cco_fax,
                    //Dlv_CcoCellphone = cpl.cpl_dlv_cco_cellphone,
                    //Dlv_CcoEmail = cpl.cpl_dlv_cco_email,
                    //Dlv_CcoRef = cpl.TM_CCO_Client_Contact.cco_ref,
                    #endregion cco
                    CodDiscountAmount = cpl.cpl_discount_amount,
                    CodDiscountPercentage = cpl.cpl_discount_percentage,
                    UsrCom1 = cpl.usr_commercial1,
                    UsrCom2 = cpl.usr_commercial2,
                    UsrCom3 = cpl.usr_commercial3
                };
                codId = clientorder.CreateUpdateClientOrder(cod);
                cod_code = _db.TM_COD_Client_Order.FirstOrDefault(o => o.cod_id == codId).cod_code;
                var clns = _db.TM_CLN_CostPlan_Lines.Where(m => m.cpl_id == cod.CplId).ToList();

                InsertColByCln(codId, clns);
            }
            else
            {
                cod_code = "-1";
            }
            return cod_code;
        }

        public string GetClientCode(int userid)
        {
            string returnvalue = "";
            var client = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userid);
            returnvalue = _db.TM_COD_Client_Order.Where(o => o.cli_id == client.cli_id).OrderByDescending(m => m.cod_d_creation)
                    .FirstOrDefault().cod_code;
            return returnvalue;

        }
        public void InsertColByCln(int codId, List<TM_CLN_CostPlan_Lines> clns)
        {
            var cols = clns.Select(o => new TM_COL_ClientOrder_Lines
            {
                cln_id = o.cln_id,
                cod_id = codId,
                col_id = 0,
                col_level1 = o.cln_level1,
                col_level2 = o.cln_level2,
                col_description = o.cln_description ?? string.Empty,
                prd_id = o.prd_id,
                col_prd_name = o.TM_PRD_Product.prd_name,
                pit_id = o.pit_id,
                col_purchase_price = o.cln_purchase_price,
                col_unit_price = o.cln_unit_price,
                col_quantity = o.cln_quantity,
                col_total_price = o.cln_total_price,
                col_total_crude_price = o.cln_total_crude_price,
                vat_id = o.vat_id,
                ltp_id = o.ltp_id,
                col_discount_amount = o.cln_discount_amount,
                col_discount_percentage = o.cln_discount_percentage,
                col_price_with_discount_ht = o.cln_price_with_discount_ht,
                col_margin = o.cln_margin,
                col_prd_des = o.cln_prd_des,
            }).ToList();
            foreach (var oneCol in cols)
            {
                _db.TM_COL_ClientOrder_Lines.AddObject(oneCol);
                _db.SaveChanges();
            }
        }

        public int CreateClientInvoice(int userId)
        {
            var oneScl = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userId);
            var cliId = oneScl.cli_id;
            var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == cliId);
            var cinid = 0;

            var cpl = _db.TM_CPL_Cost_Plan
                .Where(p => p.cli_id == cliId)
                .OrderByDescending(p => p.cpl_d_creation)
                .FirstOrDefault();

            var cpllList = _db.TM_CLN_CostPlan_Lines
                    .Where(l => l.cpl_id == cpl.cpl_id)
                    .ToList();
            var costplanline = _db.TM_CLN_CostPlan_Lines
             .Where(p => p.cpl_id == cpl.cpl_id)
             .FirstOrDefault();
            var clientorder = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(p => p.cln_id == costplanline.cln_id);
            if (!cpllList.Any()) throw new Exception("No products found in the cost plan.");
            var oneclientservice = new ClientInvoice
            {
                ClientCompanyName = oneScl.scl_company_name,
                CliId = cli.cli_id,
                CodId = null,
                PrjId = cpl.prj_id,
                CinDCreation = DateTime.Now,
                UsrCreatorId = 27,
                CurId = 1,
                CinAccount = false,
                CcoIdInvoicing = cpl.cco_id_invoicing,
                Inv_CcoFirstname = oneScl.scl_firstname,
                Inv_CcoLastname = oneScl.scl_lastname,
                Inv_CcoCellphone = oneScl.scl_tel1,
                Inv_CcoAddress1 = oneScl.scl_address1,
                Inv_CcoAddress2 = oneScl.scl_address2,
                Inv_CcoEmail = cli.cli_email,
                PcoId = cpl.pco_id,
                SocId = cpl.soc_id,
                VatId = cpl.vat_id,
                CinIsInvoiced = false,
                PmoId = cpl.pmo_id
            };

            cinid = ClientInvoiceServices.CreateUpdateClientInvoice(oneclientservice);
            oneclientservice.CinId = cinid;
            var newdfo = new DeliveryForm
            {
                CodId = clientorder.cod_id,
                DfoDCreation = DateTime.Now,
                DfoDeliveryComment = "",
                UsrCreatorId = 27,
                CliId = cli.cli_id,
                SocId = cpl.soc_id,
                DfoDeliveried = false,
                DfoClientAdr = true,
                DfoDDelivery = DateTime.Now,
                Dlv_CcoAddress1 = oneScl.scl_address1,
                Dlv_CcoAddress2 = oneScl.scl_address2,
                Dlv_CcoEmail = cli.cli_email,
                Dlv_CcoPostcode = cli.cli_postcode,
                Dlv_CcoCountry = oneScl.scl_tel1
            };
            var dfoId = DeliveryFormservices.CreateUpdateDeliveryForm(newdfo);           

            var cincode = _db.TM_CIN_Client_Invoice.FirstOrDefault(j => j.cin_id == cinid).cin_code;

            return dfoId;
        }

        public int CreateClientInvoiceOnline(int userId, int cplid)
        {
            var oneScl = _db.TS_SCL_Site_Client.FirstOrDefault(l => l.scl_id == userId);
            var cliId = oneScl.cli_id;
            var cli = _db.TM_CLI_CLient.FirstOrDefault(m => m.cli_id == cliId);
            var cinid = 0;

            var cpl = _db.TM_CPL_Cost_Plan
                .Where(p => p.cpl_id == cplid).FirstOrDefault(); ;

            var cpllList = _db.TM_CLN_CostPlan_Lines
                    .Where(l => l.cpl_id == cplid)
                    .ToList();
            var costplanline = _db.TM_CLN_CostPlan_Lines
             .Where(p => p.cpl_id == cplid)
             .FirstOrDefault();
            var clientorder = _db.TM_COL_ClientOrder_Lines.FirstOrDefault(p => p.cln_id == costplanline.cln_id);
            if (!cpllList.Any()) throw new Exception("No products found in the cost plan.");
            var oneclientservice = new ClientInvoice
            {
                ClientCompanyName = oneScl.scl_company_name,
                CliId = cli.cli_id,
                CodId = clientorder.cod_id,
                PrjId = cpl.prj_id,
                CinDCreation = DateTime.Now,
                CinName = oneScl.scl_firstname,
                UsrCreatorId = 27,
                CurId = 1,
                CinAccount = false,
                CcoIdInvoicing = cpl.cco_id_invoicing,
                Inv_CcoFirstname = oneScl.scl_firstname,
                Inv_CcoLastname = oneScl.scl_lastname,
                Inv_CcoCellphone = oneScl.scl_tel1,
                Inv_CcoAddress1 = oneScl.scl_address1,
                Inv_CcoAddress2 = oneScl.scl_address2,
                Inv_CcoEmail = cli.cli_email,
                PcoId = cpl.pco_id,
                SocId = cpl.soc_id,
                VatId = cpl.vat_id,
                CinIsInvoiced = false,
                PmoId = cpl.pmo_id
            };

            cinid = ClientInvoiceServices.CreateUpdateClientInvoice(oneclientservice);
            oneclientservice.CinId = cinid;
            var cpy = new TM_CPY_ClientInvoice_Payment
            {
                cin_id = cinid,
                cpy_amount = (decimal)costplanline.cln_total_crude_price,
                cpy_d_create = DateTime.Now,
                cpy_file = null


            };
            _db.TM_CPY_ClientInvoice_Payment.AddObject(cpy);
            _db.SaveChanges();
            var newdfo = new DeliveryForm
            {
                CodId = clientorder.cod_id,
                DfoDCreation = DateTime.Now,
                DfoDeliveryComment = "",
                UsrCreatorId = 27,
                CliId = cli.cli_id,
                SocId = cpl.soc_id,
                DfoDeliveried = false,
                DfoClientAdr = true,
                DfoDDelivery = DateTime.Now,
                Dlv_CcoAddress1 = oneScl.scl_address1,
                Dlv_CcoAddress2 = oneScl.scl_address2,
                Dlv_CcoEmail = cli.cli_email,
                Dlv_CcoPostcode = cli.cli_postcode,
                Dlv_CcoCountry = oneScl.scl_tel1
            };
            var dfoId = DeliveryFormservices.CreateUpdateDeliveryForm(newdfo);

            foreach (var cpll in cpllList)
            {
                var clientinvoiceline = new TM_CII_ClientInvoice_Line
                {
                    cin_id = cinid,
                    cii_prd_name = cpll.TM_PRD_Product.prd_name,
                    cii_quantity = cpll.cln_quantity,
                    cii_prd_des = cpll.cln_prd_des,
                    cii_purchase_price = cpll.cln_purchase_price,
                    cii_total_crude_price = cpll.cln_total_crude_price,
                    cii_price_with_discount_ht = cpll.cln_price_with_discount_ht,
                    cii_margin = cpll.cln_total_crude_price,
                    cii_total_price = cpll.cln_total_price,
                    cii_discount_amount = cpll.cln_discount_amount,
                    cii_discount_percentage = cpll.cln_discount_percentage,
                    prd_id = cpll.prd_id,
                    pit_id = cpll.pit_id,
                    ltp_id = cpll.ltp_id,
                    vat_id = cpll.vat_id
                };
                _db.TM_CII_ClientInvoice_Line.AddObject(clientinvoiceline);
                _db.SaveChanges();

                var onedfl = new TM_DFL_DevlieryForm_Line
                {
                    dfo_id = dfoId,
                    cii_id = clientinvoiceline.cii_id,
                    col_id = clientorder.col_id,  // If client order exists, add the line id
                    dfl_quantity = clientorder.col_quantity ?? cpll.cln_quantity
                };

                _db.TM_DFL_DevlieryForm_Line.AddObject(onedfl);
                _db.SaveChanges();
            }


            var cincode = _db.TM_CIN_Client_Invoice.FirstOrDefault(j => j.cin_id == cinid).cin_code;

            return cinid;
        }
        public List<ERP.Entities.ShoppingECOLEC> SaveShopCart(int userId, List<ERP.Entities.ShoppingECOLEC> shopcart)
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
        #region country
        public List<KeyValue> GetCountry()
        {
            var allpco = _db.TR_COU_Country.Select(m => new KeyValue
            {
                Key = m.cou_id,
                Value = m.cou_name,
                Value2 = m.cou_code
            }).ToList();
            return allpco;
        }
        public List<KeyValuePair<string, string>> getUserdetails(string userlogin)
        {
            var key = _db.TS_SCL_Site_Client.FirstOrDefault(j => j.scl_login == userlogin);
            var keyList = new List<KeyValuePair<string, string>>
            {
                 new KeyValuePair<string, string>("firstname", key.scl_firstname),
                 new KeyValuePair<string, string>("Address1", key.scl_address1),
                 new KeyValuePair<string, string>("Address2", key.scl_address2),
                 new KeyValuePair<string, string>("LastName", key.scl_lastname),
                 new KeyValuePair<string, string>("Telephone", key.scl_tel1),
                 new KeyValuePair<string, string>("Email", key.scl_email),
                 new KeyValuePair<string, string>("City", key.scl_city),
                 new KeyValuePair<string, string>("PostCode", key.scl_postcode)
            };
            return keyList;
        }
        #endregion country
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
        public PrdDetailsOutECOLEC GetPrdByPrdId(int prdId)
        {
            var onePrd = _db.TM_PRD_Product.FirstOrDefault(l => l.prd_id == prdId);
            var ptyId = onePrd.TM_PTY_Product_Type.pty_id;
            var oneLine = _db.TS_WLL_Wishlist_line.FirstOrDefault(l => l.prd_id == onePrd.prd_id);
            var onePrdDeails = new PrdDetailsOutECOLEC()
            {
                ImgList = onePrd.TI_PIM_Product_Image.Select(l => l.pim_path).Take(5).ToList(),
                prdId = onePrd.prd_id,
                prdName = onePrd.prd_name,
                prdRef = onePrd.prd_ref,
                prdSubName = onePrd.prd_sub_name,
                description = onePrd.prd_description,
                price = onePrd.prd_price,
                height = onePrd.prd_height,
                weight = onePrd.prd_carton_weight,
                prdPitList = new List<ProductInstance>(),
                prdXmlList = new List<PropertyValue>(),
                //IsWish = oneLine != null ? true : false

            };

            onePrdDeails.prdPitList = GetProductInstances(onePrd.prd_id, ptyId, 1);
            var pitlist = GetPtyProppertyValues(ptyId, prdId);

            onePrdDeails.prdXmlList = GetGeneralPropertyValuesFormXml(ptyId, 1, onePrd.TM_PTY_Product_Type.pty_specifications_fields, prdId, true);


            //  var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId && m.soc_id == 1);
            //var pit = _db.TM_PIT_Product_Instance.FirstOrDefault(n => n.pty_id == ptyId && n.prd_id == prdId);


            //    var xmlPtyField = pty.pty_specifications_fields;
            //    var listProps = GetPtyPropertyValues(xmlPtyField);
            //    var prdProps = GetPrdPropertyValues(pit.pit_prd_info);
            //    onePrdDeails.prdXmlList = prdProps;
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
        public List<ShoppingECOLEC> GetShoppingListByUserId(int userId)
        {
            List<ShoppingECOLEC> shoppingList = (from scl in _db.TS_SCL_Site_Client
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
                                                 select new ShoppingECOLEC
                                                 {
                                                     Id = scln.scln_id,
                                                     prdId = prd.prd_id,
                                                     ImgUrl = prd.TI_PIM_Product_Image.Any(l => l.pim_order == 1) ? prd.TI_PIM_Product_Image.FirstOrDefault(l => l.pim_order == 1).pim_path : (prd.TI_PIM_Product_Image.Any(l => !string.IsNullOrEmpty(l.pim_path)) ? prd.TI_PIM_Product_Image.Where(l => !string.IsNullOrEmpty(l.pim_path)).OrderBy(l => l.pim_order).FirstOrDefault().pim_path : null),
                                                     Name = prd.prd_name,
                                                     Ref = prd.prd_ref,
                                                     //Ref = lj != null ? lj.pit_ref : prd.prd_ref,
                                                     Qty = scln.scln_qty,
                                                     price = prd.prd_price,
                                                     pitId = scln.pit_id ?? 0,
                                                     ptyId = pty.pty_id,
                                                     //pit_prd_info = lj != null ? lj.pit_prd_info : null,
                                                     Couleur = scln.scln_attr1,
                                                     Puissance = scln.scln_attr2,
                                                     Driver = scln.scln_attr3,
                                                     Comment = scln.scln_comment,
                                                     orderId = scln.sct_id
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
                //var pitXmlList = GetPitKeyValues(item.pit_prd_info, GetPtyProppertyValues(item.ptyId), true);
                //foreach (var onePit in pitXmlList)
                //{
                //    if (onePit.PropName == "Température de couleur")
                //    {
                //        item.Couleur = onePit.PropName + ":" + item.Couleur + onePit.PropUnit;
                //    }
                //    if (onePit.PropName == "Puissance")
                //    {
                //        item.Puissance = onePit.PropName + ":" + item.Puissance + onePit.PropUnit;
                //    }
                //    if (onePit.PropName == "Driver" || onePit.PropName == "Opération")
                //    {
                //        item.Driver = onePit.PropName + ":" + item.Driver + onePit.PropUnit;
                //    }
                //}
            }


            return shoppingList;
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
        public List<PropertyValue> GetGeneralPropertyValuesFormXml(int ptyId, int socId, string xmlFields, int prdid, bool getEmptyValue = false)
        {
            var pty = _db.TM_PTY_Product_Type.FirstOrDefault(m => m.pty_id == ptyId && m.soc_id == socId);
            var pit = _db.TM_PIT_Product_Instance.FirstOrDefault(n => n.pty_id == ptyId && n.prd_id == prdid);

            var propNames = new List<PropertyValue>();
            if (pty != null)
            {
                var xmlPtyField = pty.pty_specifications_fields;
                var listProps = GetPtyPropertyValues(xmlPtyField);
                var prdProps = GetPrdPropertyValues(pit.pit_prd_info);
                foreach (var prdProp in prdProps)
                {
                    var ptyProp = listProps.FirstOrDefault(m => m.PropGuid == prdProp.PropGuid);
                    if (ptyProp != null)
                    {
                        prdProp.PropName = ptyProp.PropName;
                        //   prdProp.PropDescription = listProps.;
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
            var prds = _db.TM_PIT_Product_Instance.Where(m => m.pty_id == ptyId && m.prd_id == prdId).Select(m => new ProductInstance
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
            var ptyPropValues = GetPtyProppertyValues(ptyId, prdId);
            foreach (var productInstance in prds)
            {
                productInstance.PitAllInfo = GetPitKeyValues(productInstance.PitPrdInfo, ptyPropValues);
                productInstance.PitImages =
                    _db.TI_PTI_Product_Instance_Image.Where(m => m.pit_id == productInstance.PitId).Distinct()
                        .Select(m => new KeyValue
                        {
                            Key = m.pti_id,
                            Value = m.pal_id.HasValue ? m.TR_PAL_Photo_Album.pal_path : m.pti_path,
                            Value2 = m.TM_PIT_Product_Instance.pit_description,
                            Key3 = m.pit_id,
                            Key2 = m.pti_order
                        }).OrderBy(m => m.Key2).ToList();
            }
            return prds;
        }
        public List<PropertyValue> GetPtyProppertyValues(int ptyId, int prdid)
        {
            var pty = _db.TM_PIT_Product_Instance.FirstOrDefault(m => m.pty_id == ptyId && m.prd_id == prdid);
            var propNames = new List<PropertyValue>();
            if (pty != null)
            {
                var xmlPtyField = pty.pit_prd_info;
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
                        ).Select(CostPlanTranslator.RepositoryToEntity()).ToList().Distinct().OrderByDescending(l => l.CplDateCreation).ToList();
            var clns = (from cpl in cpls
                        join cln in _db.TM_CLN_CostPlan_Lines on cpl.CplId equals cln.cpl_id
                        select cln).AsQueryable().Select(CostPlanLineTranslator.RepositoryToEntityLite()).ToList();

            cpls.ForEach(l =>
            {
                l.CostPlanLines = clns.Where(m => m.CplId == l.CplId).ToList();
            });
            return cpls;
        }
        public List<CostPlanLine> GetCostPlanLinesByCplId(int cplId)
        {
            var costPlanLines = (from cln in _db.TM_CLN_CostPlan_Lines
                                 where cln.cpl_id == cplId
                                 select cln)
                                 .AsQueryable()
                                 .Select(CostPlanLineTranslator.RepositoryToEntity())
                                 .ToList();

            return costPlanLines;
        }


        #endregion Commande Devis
    }
}

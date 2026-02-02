using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using HtmlAgilityPack;
using HtmlDocument = HtmlAgilityPack.HtmlDocument;
using System.Net;
using System.Web.Configuration;
using ERP.DataServices;
using ERP.Entities;

namespace ERP.Web.Views.Admin
{
    public partial class EnterpriseSetting : BasePage.BasePage
    {
        static SocietyServices SocietyServices = new SocietyServices();
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        [WebMethod]
        public static int UpdateCurrencyEx(decimal usdmad)
        {
            var listCurrency = new List<Currencies>();
            var _ExchangeUrl = "ExchangeUrl";
            string url = WebConfigurationManager.AppSettings[_ExchangeUrl];

            try
            {
                GetCurrencyFromPage(url, listCurrency);
            }
            catch (Exception)
            {
            }
            try
            {
                //url = WebConfigurationManager.AppSettings[_ExchangeUrl];
                url = string.Format("{0}index_1.html", url);
                GetCurrencyFromPage(url, listCurrency);
            }
            catch (Exception)
            {
            }

            if (usdmad > 0)
            {
                var exUsdMad = new Currencies
                {
                    Name = "摩洛哥迪拉姆",
                    SellingRate = usdmad
                };
                listCurrency.Add(exUsdMad);
            }
            try
            {
                SocietyServices.UpdateCurrency(listCurrency);
            }
            catch (Exception)
            {
            }
            return 0;
        }

        private static void GetCurrencyFromPage(string url, List<Currencies> listCurrency)
        {
            var pagecode = string.Empty;
            using (WebClient client = new WebClient())
            {
                ServicePointManager.Expect100Continue = true;
                ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072;
                client.Encoding = System.Text.Encoding.GetEncoding("gbk");
                try
                {
                    pagecode = Encoding.GetEncoding("utf-8").GetString(client.DownloadData(url));
                }
                catch (Exception ex)
                {
                }
                if (!string.IsNullOrEmpty(pagecode))
                {
                    HtmlDocument parser = new HtmlDocument();
                    parser.LoadHtml(pagecode);
                    //var pagetitle = parser.DocumentNode.SelectSingleNode("//title").InnerText;
                    var divLabel = "//div[contains(@class, 'publish')]";
                    var tabLabel = "//table[contains(@align, 'left')]";
                    var curDiv = parser.DocumentNode.SelectNodes(divLabel).FirstOrDefault();
                    if (curDiv != null)
                    {
                        var trDiv = curDiv.SelectNodes(tabLabel).FirstOrDefault();
                        if (trDiv != null)
                        {
                            var allcurrencyTr = curDiv.SelectNodes("//tr");
                            foreach (var oneTr in allcurrencyTr)
                            {
                                var oneCur = new Currencies();
                                oneCur.Name = oneTr.ChildNodes[1].InnerHtml;
                                oneCur.BuyingRate = DecimalTry(oneTr.ChildNodes[3].InnerHtml.Replace(".", ","));
                                oneCur.CashBuyingRate = DecimalTry(oneTr.ChildNodes[5].InnerHtml.Replace(".", ","));
                                oneCur.SellingRate = DecimalTry(oneTr.ChildNodes[7].InnerHtml.Replace(".", ","));
                                oneCur.CashSellingRate = DecimalTry(oneTr.ChildNodes[9].InnerHtml.Replace(".", ","));
                                oneCur.MiddleRate = DecimalTry(oneTr.ChildNodes[1].InnerHtml.Replace(".", ","));
                                listCurrency.Add(oneCur);
                            }
                        }
                    }
                }
            }
        }

        private static decimal DecimalTry(string str)
        {
            decimal returnValue = 0;
            decimal.TryParse(str, out returnValue);
            return returnValue;
        }

        protected void updatecinonce_OnClick(object sender, EventArgs e)
        {
            //var cilservice = new ClientInvoiceLineServices();
            //cilservice.UpdateCinMarginOneTime();
        }
    }

}
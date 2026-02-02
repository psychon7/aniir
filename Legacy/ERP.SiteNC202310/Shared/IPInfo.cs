using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using System.Xml;
using ERP.Entities;
using HtmlAgilityPack;

namespace ERP.SiteNC202310.Shared
{
    public static class IPInfo
    {
        static CultureInfo culture = new CultureInfo("FR-fr");

        #region 这些网站不能使用了
        public static XmlNodeList GetIPInformation(string ipAddress)
        {
            XmlNodeList XmlNodeList = null;
            try
            {
                string ipResponse = IPRequestHelper("http://ip-api.com/xml/" + ipAddress);
                //return ipResponse;
                XmlDocument ipInfoXML = new XmlDocument();
                ipInfoXML.LoadXml(ipResponse);
                XmlNodeList responseXML = ipInfoXML.GetElementsByTagName("query");
                XmlNodeList = responseXML;
                //NameValueCollection dataXML = new NameValueCollection();
                //dataXML.Add(responseXML.Item(0).ChildNodes[2].InnerText, responseXML.Item(0).ChildNodes[2].Value);
                //strReturnVal = responseXML.Item(0).ChildNodes[1].InnerText.ToString(); // Contry
                //strReturnVal += "(" + responseXML.Item(0).ChildNodes[2].InnerText.ToString() + ")"; // Contry Code 
            }
            catch (Exception)
            {
            }
            return XmlNodeList;
        }
        public static UserLog TreateUserLogIP(this UserLog userLog)
        {
            try
            {
                if (!string.IsNullOrEmpty(userLog.Ip) && userLog.Ip.Contains("."))
                {
                    var ipnodelist = GetIPInformation(userLog.Ip);
                    if (ipnodelist != null)
                    {
                        //	[0]	status
                        //	[1]	country
                        //	[2]	countryCode
                        //	[3]	region
                        //	[4]	regionName
                        //	[5]	city
                        //	[6]	zip
                        //	[7]	lat
                        //	[8]	lon
                        //	[9]	timezone
                        //	[10]	isp
                        //	[11]	org
                        //	[12]	as
                        //	[13]	query

                        var ipnode = ipnodelist.Item(0);
                        if (ipnode != null)
                        {
                            userLog.ulg_ip_status = ipnode.ChildNodes[0].InnerText;
                            userLog.ulg_ip_country = ipnode.ChildNodes[1].InnerText;
                            userLog.ulg_ip_ulg_ip_countryCode = ipnode.ChildNodes[2].InnerText;
                            userLog.ulg_ip_region = ipnode.ChildNodes[3].InnerText;
                            userLog.ulg_ip_regionName = ipnode.ChildNodes[4].InnerText;
                            userLog.ulg_ip_city = ipnode.ChildNodes[5].InnerText;
                            userLog.ulg_ip_zip = ipnode.ChildNodes[6].InnerText;
                            decimal lat;
                            if (decimal.TryParse(ipnode.ChildNodes[7].InnerText.Replace(".", ",").Replace(" ", ""),
                                NumberStyles.Any, culture, out lat))
                            {
                                userLog.ulg_ip_lat = lat;
                            }
                            decimal lon;
                            if (decimal.TryParse(ipnode.ChildNodes[8].InnerText.Replace(".", ",").Replace(" ", ""),
                                NumberStyles.Any, culture, out lon))
                            {
                                userLog.ulg_ip_lon = lon;
                            }
                            //userLog.ulg_ip_lat = ipnode.ChildNodes[7].InnerText.Replace(",",".");
                            //userLog.ulg_ip_lon = ipnode.ChildNodes[8].InnerText;
                            userLog.ulg_ip_timezone = ipnode.ChildNodes[9].InnerText;
                            userLog.ulg_ip_isp = ipnode.ChildNodes[10].InnerText;
                            userLog.ulg_ip_org = ipnode.ChildNodes[11].InnerText;
                            userLog.ulg_ip_as = ipnode.ChildNodes[12].InnerText;
                            userLog.ulg_ip_query = ipnode.ChildNodes[13].InnerText;
                        }
                    }
                }
            }
            catch (Exception)
            {
            }

            return userLog;
        }
        public static string IPRequestHelper(string url)
        {
            HttpWebRequest objRequest = (HttpWebRequest)WebRequest.Create(url);
            HttpWebResponse objResponse = (HttpWebResponse)objRequest.GetResponse();
            StreamReader responseStream = new StreamReader(objResponse.GetResponseStream());
            string responseRead = responseStream.ReadToEnd();
            responseStream.Close();
            responseStream.Dispose();
            return responseRead;
        }
        public static string GetIPInfoFromWhatismyipaddress_old(string ipAddress)
        {
            string url = string.Format("http://whatismyipaddress.com/ip/{0}", ipAddress);
            HttpWebRequest objRequest = (HttpWebRequest)WebRequest.Create(url);
            HttpWebResponse objResponse = (HttpWebResponse)objRequest.GetResponse();
            StreamReader responseStream = new StreamReader(objResponse.GetResponseStream());
            string responseRead = responseStream.ReadToEnd();
            responseStream.Close();
            responseStream.Dispose();
            return responseRead;
        }
        #endregion 这些网站不能使用了

        public static UserLog GetIPInfoFromWhatismyipaddress(this UserLog userlog, string ipAddress)
        {
            string url = string.Format("http://whatismyipaddress.com/ip/{0}", ipAddress);
            List<KeyValue> listinfo = new List<KeyValue>();
            try
            {
                string pagehtml = LoadPre(ipAddress);
                HtmlWeb webClient = new HtmlWeb();

                if (string.IsNullOrEmpty(pagehtml))
                {
                    HtmlAgilityPack.HtmlWeb.PreRequestHandler handler = delegate(HttpWebRequest request)
                    {
                        request.Headers[HttpRequestHeader.AcceptEncoding] = "gzip, deflate";
                        request.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;
                        request.CookieContainer = new System.Net.CookieContainer();
                        return true;
                    };
                    webClient.PreRequest += handler;
                }
                HtmlDocument doc = string.IsNullOrEmpty(pagehtml) ? webClient.Load(url) : new HtmlDocument();
                if (!string.IsNullOrEmpty(pagehtml))
                {
                    doc.LoadHtml(pagehtml);
                }

                //HtmlWeb hw = new HtmlWeb();
                //hw.AutoDetectEncoding = false;
                //hw.OverrideEncoding = Encoding.UTF8;//Encoding.GetEncoding("gzip");
                //HtmlDocument doc = new HtmlDocument();
                //doc.OptionReadEncoding = false;
                //doc = hw.Load(url);
                string divTable = "//table";
                var tables = doc.DocumentNode.SelectNodes(divTable);

                foreach (var atable in tables)
                {
                    foreach (var onerow in atable.SelectNodes("tr"))
                    {
                        try
                        {

                            var name = onerow.ChildNodes[0].InnerText;
                            var value = onerow.ChildNodes[1].InnerText;

                            if (!string.IsNullOrEmpty(name))
                            {
                                var onekeyvalue = new KeyValue
                                {
                                    Value = name.Replace(":", "").Trim(),
                                    Value2 = value.Trim()
                                };
                                listinfo.Add(onekeyvalue);
                            }
                        }
                        catch (Exception)
                        {
                        }
                    }
                }

            }
            catch (Exception ex)
            {
            }


            if (listinfo.Any())
            {
                var hostname = listinfo.GetInfoInIPList("Hostname");
                userlog.ulg_ip_as = hostname;
                var ips = listinfo.GetInfoInIPList("ISP");
                userlog.ulg_ip_isp = ips;
                var org = listinfo.GetInfoInIPList("Organization");
                userlog.ulg_ip_org = org;
                var continent = listinfo.GetInfoInIPList("Continent");
                userlog.ulg_ip_status = continent;
                var country = listinfo.GetInfoInIPList("Country");
                userlog.ulg_ip_country = country;
                var region = listinfo.GetInfoInIPList("State/Region");
                userlog.ulg_ip_regionName = region;
                var city = listinfo.GetInfoInIPList("City");
                userlog.ulg_ip_city = city;
                var postcode = listinfo.GetInfoInIPList("Postal Code");
                userlog.ulg_ip_zip = postcode;
                var latitude = listinfo.GetInfoInIPList("Latitude");
                var longitude = listinfo.GetInfoInIPList("Longitude");
                decimal lat;
                if (latitude.Contains("&nbsp;") && decimal.TryParse(latitude.Replace("&nbsp;", "#").Split('#')[0].Replace(".", ",").Replace(" ", ""),
                    NumberStyles.Any, culture, out lat))
                {
                    userlog.ulg_ip_lat = lat;
                }
                decimal lon;
                if (longitude.Contains("&nbsp;") && decimal.TryParse(longitude.Replace("&nbsp;", "#").Split('#')[0].Replace(".", ",").Replace(" ", ""),
                    NumberStyles.Any, culture, out lon))
                {
                    userlog.ulg_ip_lon = lon;
                }
                userlog.Id = 1;
            }
            return userlog;
        }

        private static string GetInfoInIPList(this List<KeyValue> ipInfoList, string filedname)
        {
            var onefiled = ipInfoList.FirstOrDefault(m => m.Value.ToLower() == filedname.ToLower());
            string result = string.Empty;
            if (onefiled != null)
            {
                result = !string.IsNullOrEmpty(onefiled.Value2) ? onefiled.Value2.Trim() : onefiled.Value2;
            }
            return result;
        }

        public static string LoadPre(string ipAddress)
        {
            string result = string.Empty;
            string url = string.Format("http://whatismyipaddress.com/ip/{0}", ipAddress);
            HttpWebRequest request = null;
            request = WebRequest.Create(url) as HttpWebRequest;
            request.Accept = "text/html, application/xhtml+xml, */*";
            request.UserAgent = "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko";
            request.Method = "GET";
            request.Host = "whatismyipaddress.com";
            request.KeepAlive = true;
            request.Headers.Add("Accept-Encoding", "gzip, deflate");
            request.Headers.Add("Accept-Language", "fr-FR");
            //如果没有 下面这行代码 将获取不到相应的Cookie （response.Cookies）  
            //其实 不添加这行代码对于获取 数据没有影响，但是过后的POST操作会用到相应的Cookie  
            request.CookieContainer = new CookieContainer();
            //以下两行对于获取Cookie 对于本次测试 没有影响  
            CookieCollection cc = new CookieCollection();
            cc.Add(new Cookie("pt", "be3f230914e1e06df7b1abb37b0f6d36") { Domain = request.Host });
            cc.Add(new Cookie("crtg_rta", "") { Domain = request.Host });
            cc.Add(new Cookie("_ga", "GA1.2.578600753.1462532477") { Domain = request.Host });
            cc.Add(new Cookie("_gat", "1") { Domain = request.Host });
            cc.Add(new Cookie("__utma", "53830638.578600753.1462532477.1462532482.1462532481.1") { Domain = request.Host });
            cc.Add(new Cookie("__utmb", "53830638.1.10.1462532482") { Domain = request.Host });
            cc.Add(new Cookie("__utmc", "53830638") { Domain = request.Host });
            cc.Add(new Cookie("__utmz", "53830638.1462532482.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)") { Domain = request.Host });
            cc.Add(new Cookie("__utmt_gwo", "1") { Domain = request.Host });
            cc.Add(new Cookie("__gads", "ID=2cb2b1edf3b5a7dd:T=1462532482:S=ALNI_MbqpzjJBeVofLKPEXWWa_eICufO0w") { Domain = request.Host });
            request.CookieContainer.Add(cc);
            try
            {
                //响应  
                HttpWebResponse response = (HttpWebResponse)request.GetResponse();
                int statusInt = response.StatusCode.GetHashCode();
                //相应成功  
                if (response.StatusCode.ToString().ToLower() == "ok" || response.StatusCode.ToString().ToLower() == "200")
                {
                    string strtUrl = response.ResponseUri.AbsoluteUri;
                    //GV_CookieCollection = response.Cookies;
                    //string responseText = new StreamReader(response.GetResponseStream(), Encoding.UTF8).ReadToEnd();
                    //if (response.ContentEncoding.ToLower() == "gzip")
                    //{
                    result = new StreamReader(new GZipStream(response.GetResponseStream(), CompressionMode.Decompress), Encoding.UTF8).ReadToEnd();
                    //}
                    //else if (response.CharacterSet.ToLower() == "utf-8")
                    //{
                    //    responseText = new StreamReader(response.GetResponseStream(), Encoding.UTF8).ReadToEnd();
                    //}
                    //else
                    //{
                    //responseText = new StreamReader(response.GetResponseStream(), Encoding.Default).ReadToEnd();
                    //}
                    //if (!string.IsNullOrEmpty(responseText))
                    //{
                    //    webBrowser1.DocumentText = responseText;
                    //    //以下通过 正则表达式 查到隐藏域 name='__RequestVerificationToken'  
                    //    //为稍后的POST请求使用  
                    //    string patternRegion = "<\\s*input\\s*.*name\\s*=\\s*\"__RequestVerificationToken\"\\s*.*value\\s*=\\s*\"(?<value>[\\w-]{108,108})\"\\s*/>";
                    //    RegexOptions regexOptions = RegexOptions.Singleline | RegexOptions.IgnoreCase | RegexOptions.Compiled;
                    //    Regex reg = new Regex(patternRegion, regexOptions);
                    //    MatchCollection mc = reg.Matches(responseText);
                    //    foreach (Match m in mc)
                    //    {
                    //        hidRequestVerificationToken = m.Groups["value"].Value;
                    //    }
                    //}
                }
            }
            catch (Exception ex)
            {
                //MessageBox.Show(ex.Message);
            }
            return result;
        }

        public static UserLog GetIPInfoFromFindIPAddress(this UserLog userlog, string ipAddress)
        {
            bool treated = false;
            var response = LoadLocation(ipAddress);
            List<KeyValue> listinfo = new List<KeyValue>();
            if (!string.IsNullOrEmpty(response))
            {
                HtmlWeb webClient = new HtmlWeb();
                HtmlDocument doc = new HtmlDocument();
                doc.LoadHtml(response);
                string divTable = "//div[@style='margin-left:5%; margin-top:5%;']";
                var div2treat = doc.DocumentNode.SelectSingleNode(divTable);

                if (div2treat != null)
                {
                    treated = true;
                    var allB = div2treat.SelectNodes("//b");
                    var allstrong = div2treat.SelectNodes("//strong");
                    if (allB != null)
                    {
                        foreach (var oneB in allB)
                        {
                            var onekey = new KeyValue();
                            onekey.Value = oneB.InnerText;
                            string nextname = string.Empty;
                            int namecount = 100;
                            var nextSib = oneB;

                            for (int i = 0; i < namecount; i++)
                            {
                                if (nextSib.NextSibling != null)
                                {
                                    nextname = nextSib.NextSibling.Name;
                                    if (nextname == "font")
                                    {
                                        onekey.Value2 = nextSib.NextSibling.InnerText.Trim();
                                        break;
                                    }
                                    nextSib = nextSib.NextSibling;
                                }
                            }
                            listinfo.Add(onekey);
                        }
                    }

                    if (allstrong != null)
                    {
                        foreach (var oneStrong in allstrong)
                        {
                            var onekey = new KeyValue();
                            onekey.Value = oneStrong.InnerText;
                            string nextname = string.Empty;
                            int namecount = 100;
                            var nextSib = oneStrong;

                            for (int i = 0; i < namecount; i++)
                            {
                                if (nextSib.NextSibling != null)
                                {
                                    nextname = nextSib.NextSibling.Name;
                                    if (nextname == "font")
                                    {
                                        onekey.Value2 = nextSib.NextSibling.InnerText.Trim();
                                        break;
                                    }
                                    nextSib = nextSib.NextSibling;
                                }
                            }
                            listinfo.Add(onekey);
                        }
                    }
                }
            }

            if (listinfo.Any())
            {
                var Region = listinfo.GetInfoInIPList("IP Address Region");
                userlog.ulg_ip_regionName = Region;
                var City = listinfo.GetInfoInIPList("IP Address City");
                userlog.ulg_ip_city = City;
                var PostalCode = listinfo.GetInfoInIPList("IP Postal Code (IP Zip Code)");
                userlog.ulg_ip_zip = PostalCode;
                var CountryName = listinfo.GetInfoInIPList("IP Country Name");
                userlog.ulg_ip_country = CountryName;
                var CountryCode = listinfo.GetInfoInIPList("IP Country Code");
                userlog.ulg_ip_ulg_ip_countryCode = CountryCode;
                var AddressContinent = listinfo.GetInfoInIPList("IP Address Continent");
                userlog.ulg_ip_status = AddressContinent;
                var AddressOrganization = listinfo.GetInfoInIPList("IP Address Organization");
                userlog.ulg_ip_org = AddressOrganization;
                var AddressISP = listinfo.GetInfoInIPList("IP Address ISP");
                userlog.ulg_ip_isp = AddressISP;
                var Latitude = listinfo.GetInfoInIPList("IP Address Latitude");
                var Longtitude = listinfo.GetInfoInIPList("IP Address Longtitude");


                decimal lat;
                if (decimal.TryParse(Latitude.Replace("(", "").Replace(")", "").Replace(".", ",").Replace(" ", ""), NumberStyles.Any, culture, out lat))
                {
                    userlog.ulg_ip_lat = lat;
                }
                decimal lon;
                if (decimal.TryParse(Longtitude.Replace("(", "").Replace(")", "").Replace(".", ",").Replace(" ", ""), NumberStyles.Any, culture, out lon))
                {
                    userlog.ulg_ip_lon = lon;
                }
                userlog.Id = 1;
            }
            return userlog;
        }

        public static string LoadLocation(string ip)
        {
            WebClient webClient = new WebClient();
            var data = new NameValueCollection();
            data["scrollx"] = "0";
            data["scrolly"] = "400";
            data["ip"] = ip;

            string result = string.Empty;
            try
            {
                var response = webClient.UploadValues("http://www.find-ip-address.org/ip-address-locator.php", "POST", data);
                var reponseString = System.Text.Encoding.UTF8.GetString(response);
                result = reponseString;
            }
            catch (Exception)
            {
            }
            return result;
        }

        public static UserLog GetIPInfoFromAddress(this UserLog userlog, string ipAddress)
        {
            var oneuserlog = userlog.GetIPInfoFromWhatismyipaddress(ipAddress);
            if (oneuserlog.Id == 0)
            {
                oneuserlog = userlog.GetIPInfoFromFindIPAddress(ipAddress);
            }
            return oneuserlog;
        }

        public static UserLog GetAddressFromLatLon(this UserLog userlog, decimal? lat, decimal? lon)
        {
            try
            {
                var latstr = string.Format("{0:n12}", lat);
                latstr = latstr.Replace(",", ".");

                var lonstr = string.Format("{0:n12}", lon);
                lonstr = lonstr.Replace(",", ".");
                string url = string.Format("http://maps.google.com/maps/api/geocode/xml?latlng={0},{1}&sensor=false", latstr, lonstr);
                WebClient wc = new WebClient();
                //wc.Encoding = Encoding.UTF8;
                wc.Encoding = UTF8Encoding.UTF8;
                string xml = wc.DownloadString(url);
                XmlDocument doc = new XmlDocument();
                doc.LoadXml(xml);
                XmlNodeList elemList = doc.GetElementsByTagName("formatted_address");
                userlog.ulg_ip_2_address = elemList[0].InnerText.Trim();
                var addressComs = doc.GetElementsByTagName("address_component");
                foreach (XmlNode oneComp in addressComs)
                {
                    if (oneComp.LastChild.InnerText == "postal_code" && string.IsNullOrEmpty(userlog.ulg_ip_zip))
                    {
                        userlog.ulg_ip_zip = oneComp.FirstChild.InnerText;
                    }
                    if (oneComp.LastChild.PreviousSibling.InnerText == "locality" && string.IsNullOrEmpty(userlog.ulg_ip_city))
                    {
                        userlog.ulg_ip_city = oneComp.FirstChild.InnerText;
                    }
                    if (oneComp.LastChild.PreviousSibling.InnerText == "administrative_area_level_2" && string.IsNullOrEmpty(userlog.ulg_ip_regionName))
                    {
                        userlog.ulg_ip_regionName = oneComp.FirstChild.InnerText;
                    }
                    if (!string.IsNullOrEmpty(userlog.ulg_ip_zip) && !string.IsNullOrEmpty(userlog.ulg_ip_city) && !string.IsNullOrEmpty(userlog.ulg_ip_regionName))
                    {
                        break;
                    }
                }

                //userlog.

            }
            catch (Exception)
            {
            }
            return userlog;
        }

    }
}
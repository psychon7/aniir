using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ERP.RefSite.Shared
{
    public static class UrlDecode
    {
        public static string UrlDecode2String(this string url)
        {
            try
            {
                url = url.Replace("+", "###############");
                url = System.Web.HttpUtility.UrlDecode(url);
                url = url.Replace("###############", "+");
            }
            catch (Exception)
            {
            }
            return url;
        }
    }

    public static class StringExtension
    {
        public static string StringTrimSetEmptyIfNull(this string str)
        {
            if (string.IsNullOrEmpty(str))
            {
                return string.Empty;
            }
            else
            {
                return str.Trim();
            }
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class UserLog
    {
        public int Id { get; set; }
        public DateTime UseTime { get; set; }
        public string Ip { get; set; }
        public decimal? Longtitude { get; set; }
        public decimal? Latitude { get; set; }
        public string UserAgent { get; set; }
        public string AppName { get; set; }
        public string AppVersion { get; set; }
        public int CookieEnabled { get; set; }
        public string Mime { get; set; }
        public string Platform { get; set; }
        public string UsrLng { get; set; }
        public string SysLng { get; set; }
        public string NavLng { get; set; }
        public int JavaEnabled { get; set; }
        public int ScrHeight { get; set; }
        public int ScrWidth { get; set; }
        public int ScrColorDepth { get; set; }
        public string Url { get; set; }
        public string ulg_ip_status { get; set; }
        public string ulg_ip_country { get; set; }
        public string ulg_ip_ulg_ip_countryCode { get; set; }
        public string ulg_ip_region { get; set; }
        public string ulg_ip_regionName { get; set; }
        public string ulg_ip_city { get; set; }
        public string ulg_ip_zip { get; set; }
        public decimal? ulg_ip_lat { get; set; }
        public decimal? ulg_ip_lon { get; set; }
        public string ulg_ip_timezone { get; set; }
        public string ulg_ip_isp { get; set; }
        public string ulg_ip_org { get; set; }
        public string ulg_ip_as { get; set; }
        public string ulg_ip_query { get; set; }
        public string ulg_ip_2_address { get; set; }
    }
}

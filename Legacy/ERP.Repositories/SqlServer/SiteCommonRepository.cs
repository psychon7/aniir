using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using ERP.Repositories.DataBase;

namespace ERP.Repositories.SqlServer
{
    public class SiteCommonRepository : BaseSqlServerRepository
    {
        public void InsertUserLog(Entities.UserLog ulog)
        {
            // 设定 10分钟之内的同一个ip连续访问无效
            var checkLastLog = _db.TS_ULG_User_Log.OrderByDescending(m => m.ulg_time).FirstOrDefault(m => m.ulg_ip == ulog.Ip);
            bool insertLog = false;
            if (checkLastLog != null)
            {
                int valuableSec = 600;
                if ((DateTime.Now - checkLastLog.ulg_time).TotalSeconds >= valuableSec || checkLastLog.ulg_userAgent != ulog.UserAgent)
                {
                    insertLog = true;
                }
            }
            else
            {
                insertLog = true;
            }

            if (insertLog)
            {
                var ulg = new TS_ULG_User_Log
                {
                    ulg_time = DateTime.Now,
                    ulg_ip = ulog.Ip,
                    ulg_longtitude = ulog.Longtitude,
                    ulg_latitude = ulog.Latitude,
                    ulg_userAgent = ulog.UserAgent,
                    ulg_appName = ulog.AppName,
                    ulg_appVersion = ulog.AppVersion,
                    ulg_cookieEnabled = ulog.CookieEnabled == 1,
                    ulg_mime = ulog.Mime,
                    ulg_platform = ulog.Platform,
                    ulg_nav_lng = ulog.NavLng,
                    ulg_system_lng = ulog.SysLng,
                    ulg_user_lng = ulog.UsrLng,
                    ulg_javaEnabled = ulog.JavaEnabled == 1,
                    ulg_scr_height = ulog.ScrHeight,
                    ulg_scr_width = ulog.ScrWidth,
                    ulg_scr_colorDepth = ulog.ScrColorDepth,
                    ulg_url = ulog.Url,

                    // user ip info
                    ulg_ip_status = ulog.ulg_ip_status,
                    ulg_ip_country = ulog.ulg_ip_country,
                    ulg_ip_ulg_ip_countryCode = ulog.ulg_ip_ulg_ip_countryCode,
                    ulg_ip_region = ulog.ulg_ip_region,
                    ulg_ip_regionName = ulog.ulg_ip_regionName,
                    ulg_ip_city = ulog.ulg_ip_city,
                    ulg_ip_zip = ulog.ulg_ip_zip,
                    ulg_ip_lat = ulog.ulg_ip_lat,
                    ulg_ip_lon = ulog.ulg_ip_lon,
                    ulg_ip_timezone = ulog.ulg_ip_timezone,
                    ulg_ip_isp = ulog.ulg_ip_isp,
                    ulg_ip_org = ulog.ulg_ip_org,
                    ulg_ip_as = ulog.ulg_ip_as,
                    ulg_ip_query = ulog.ulg_ip_query,
                    ulg_ip_2_address = ulog.ulg_ip_2_address
                };
                _db.TS_ULG_User_Log.AddObject(ulg);
                try
                {
                    _db.SaveChanges();
                }
                catch (Exception ex)
                {
                }
            }
        }

        public string RecordMessage(Entities.EntityMessage message)
        {
            string code = string.Empty;
            var newMsg = new TS_Mgr_Message_Record
            {
                mgr_d_creation = DateTime.Now,
                mgr_email = message.Email,
                mgr_ip = message.IP,
                mgr_message = message.Message,
                mgr_name = message.Name,
                mgr_subject = message.Subject,
                mgr_tel = message.Telephone,
                mgr_last_name = message.Lastname,
                mgr_code = Guid.NewGuid().ToString().Substring(0, 8),
                mgr_type = Convert.ToInt32(message.IsDirver),
                mgr_address = message.Address,
                mgr_postcode = message.PostCode,
                mgr_how2Know = message.How2Know,
                mgr_city = message.City
            };
            _db.TS_Mgr_Message_Record.AddObject(newMsg);
            try
            {
                code = newMsg.mgr_code;
                _db.SaveChanges();
            }
            catch (Exception ex)
            {
            }
            return code;
        }

    }
}

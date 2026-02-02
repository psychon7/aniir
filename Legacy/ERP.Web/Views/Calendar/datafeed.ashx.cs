using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Security;
using ERP.DataServices;
using ERP.Repositories.Shared;
using ERP.SharedServices;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using ERP.Entities;
using ERP.Repositories;

namespace ERP.Web.Views.Calendar
{
    /// <summary>
    /// Summary description for datafeed
    /// </summary>
    public class datafeed : IHttpHandler
    {
        CultureInfo culture = new CultureInfo("en-US");
        PurchaseBaseServices PurchaseBaseServices = new PurchaseBaseServices();
        private delegate void SendAppointmentDelegate(DateTime st, DateTime et, string sub, string dscr, string loc, string guest, int socId, int usrId);
        public void ProcessRequest(HttpContext context)
        {
            Entities.User connectedUser;
            if (CheckAuthentication(out connectedUser))
            {
                context.Response.ContentType = "text/plain";
                string method = context.Request.QueryString["method"];
                if (string.IsNullOrEmpty(method))
                {
                    method = context.Request.Form["method"];
                }
                //string usrId = context.Request.Form["usrId"];
                int usr_id = connectedUser.Id;
                string guest = context.Request.Form["guest"];
                switch (method)
                {
                    case "add":
                        var addresult = addCalendar(context.Request.Form["CalendarStartTime"],
                            context.Request.Form["CalendarEndTime"], context.Request.Form["CalendarTitle"],
                            Convert.ToInt32(context.Request.Form["IsAllDayEvent"]), usr_id, Convert.ToInt32(context.Request.Form["IsDone"]));
                        context.Response.Write(addresult);
                        break;
                    case "list":
                        //DateTime showdate = Convert.ToDateTime(Convert.ToDateTime(context.Request.Form["showdate"]).ToString("yyyy-MM-dd"));
                        DateTime showdate = Convert.ToDateTime(context.Request.Form["showdate"], culture);
                        string viewtype = context.Request.Form["viewtype"];
                        string jqlist = listCalendar(showdate, viewtype, usr_id);
                        context.Response.Write(jqlist);
                        break;
                    case "update": // 通过拖拽实施的更新
                        string upstring;
                        upstring = updateCalendar(Convert.ToInt32(context.Request.Form["calendarId"]),
                            Convert.ToDateTime(context.Request.Form["CalendarStartTime"], culture),
                            Convert.ToDateTime(context.Request.Form["CalendarEndTime"], culture), usr_id);
                        context.Response.Write(upstring);
                        break;
                    case "remove":
                        {
                            var resultvalue = removeCalendar(Convert.ToInt32(context.Request.Form["calendarId"]));
                            if (string.IsNullOrEmpty(resultvalue))
                            {
                                context.Response.Write("{\"IsSuccess\":true,\"Msg\":\"Réussir\"}");
                            }
                            else
                            {
                                // -2 is supplier order error
                                var mgs = "{\"IsSuccess\":false,\"Msg\":\"" + resultvalue + "\",\"Code\":-2}";
                                //context.Response.Write("{\"IsSuccess\":false,\"Msg\":\"Échouer！\"}");
                                context.Response.Write(mgs);
                            }

                        }
                        break;

                    case "adddetails":
                        //usrId = context.Request.QueryString["usrId"];
                        //usr_id = Convert.ToInt32(usrId);
                        var ccoid = context.Request.Form["ccoId"];
                        int ccoId = 0;
                        int.TryParse(ccoid, out ccoId);
                        string st1 = context.Request.Form["stpartdate"] + " " + context.Request.Form["stparttime"] ==
                                     null
                            ? ""
                            : context.Request.Form["stpartdate"] + " " + context.Request.Form["stparttime"];
                        string et1 = context.Request.Form["etpartdate"] + " " + context.Request.Form["etparttime"] ==
                                     null
                            ? ""
                            : context.Request.Form["etpartdate"] + " " + context.Request.Form["etparttime"];
                        string id = context.Request.Form["id"] == null ? "" : context.Request.Form["id"];
                        string Subject = context.Request.Form["Subject"] == null ? "" : context.Request.Form["Subject"];
                        string IsAllDayEvent = context.Request.Form["IsAllDayEvent"] == null
                            ? ""
                            : context.Request.Form["IsAllDayEvent"];
                        string Description = context.Request.Form["Description"] == null
                            ? ""
                            : context.Request.Form["Description"];
                        string Location = context.Request.Form["Location"] == null
                            ? ""
                            : context.Request.Form["Location"];
                        string colorvalue = context.Request.Form["colorvalue"] == null
                            ? ""
                            : context.Request.Form["colorvalue"];
                        string timezone = context.Request.Form["timezone"] == null
                            ? ""
                            : context.Request.Form["timezone"];
                        DateTime st = Convert.ToDateTime(st1, culture);
                        DateTime et = Convert.ToDateTime(et1, culture);
                        string misok;

                        if (id != "" && id != "0")
                        {
                            misok = updateDetailedCalendar(Convert.ToInt32(id), st, et, Subject,
                                IsAllDayEvent == "1" ? 1 : 0, Description, Location, colorvalue, timezone, guest, usr_id, Convert.ToInt32(context.Request.Form["IsDone"]) == 1,
                                ccoId);
                        }
                        else
                        {
                            misok = addDetailedCalendar(st, et, Subject, IsAllDayEvent == "1" ? 1 : 0, Description,
                                Location, colorvalue, timezone, guest, usr_id, Convert.ToInt32(context.Request.Form["IsDone"]) == 1, ccoId);
                        }
                        context.Response.Write(misok);
                        //context.Response.Write("<script>alert('Hello');</script>");
                        break;

                    default:
                        break;
                }
            }

        }

        /// //添加日历 
        /// </summary>author:Angel_asp
        /// <param name="st"></param>
        /// <param name="et"></param>
        /// <param name="sub"></param>
        /// <param name="ade"></param>
        /// <returns></returns>
        public string addCalendar(string st, string et, string sub, int ade, int usrId, int isDone)
        {
            Entities.User connectedUser;
            StringBuilder table2 = new StringBuilder();
            if (CheckAuthentication(out connectedUser))
            {
                var bjq = new CalendarServices();
                var jq = new Entities.Calendar();
                try
                {
                    jq.CldDStart = Convert.ToDateTime(st, culture);
                    jq.CldDEnd = Convert.ToDateTime(et, culture);
                    jq.CldSubject = sub;
                    jq.CldIsAllDayEvent = ade == 1;
                    jq.IsDone = isDone == 1;
                    jq.UsrId = connectedUser.Id;
                    var id = bjq.Add(jq);
                    if (id > 1)
                    {
                        //table2.Append("{\"IsSuccess\":true,\"Msg\":\"Réussir\",\"Data\":" + bjq.GetMaxId() + "}");
                        table2.Append("{\"IsSuccess\":true,\"Msg\":\"Réussir\",\"Data\":" + id + "}");
                    }
                    else
                    {
                        table2.Append("{\"IsSuccess\":false,\"Msg\":\"Échouer\"}");
                    }
                }
                catch (Exception ex)
                {
                    table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + ex.Message + "\"}");
                }
                return table2.ToString();
            }
            else
            {
                table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + "Authentication error !" + "\"}");
                return table2.ToString();
            }
        }

        /// <summary>
        /// 添加方法 
        /// </summary>
        /// <param name="st"></param>
        /// <param name="et"></param>
        /// <param name="sub"></param>
        /// <param name="ade"></param>
        /// <param name="dscr"></param>
        /// <param name="loc"></param>
        /// <param name="color"></param>
        /// <param name="tz"></param>
        /// <returns></returns>
        public string addDetailedCalendar(DateTime st, DateTime et, string sub, int ade, string dscr, string loc, string color, string tz, string guest, int usrId, bool isDone, int ccoId = 0)
        {
            Entities.User connectedUser;
            StringBuilder table2 = new StringBuilder();
            if (CheckAuthentication(out connectedUser))
            {
                var bjq = new CalendarServices();
                var jq = new Entities.Calendar();
                jq.CldIsAllDayEvent = ade == 1;
                if (jq.CldIsAllDayEvent)
                {
                    jq.CldDStart = new DateTime(st.Year, st.Month, st.Day);
                    jq.CldDEnd = new DateTime(et.Year, et.Month, et.Day);
                }
                else
                {
                    jq.CldDStart = st;
                    jq.CldDEnd = et;
                }
                jq.CldSubject = sub;

                jq.CldDescription = dscr;
                jq.CldLocation = loc;
                jq.CldColor = color;
                jq.UsrId = connectedUser.Id;
                jq.CldGuest = guest;
                jq.IsDone = isDone;
                try
                {
                    var id = bjq.Add(jq);
                    if (id > 1)
                    {
                        // send appointment
                        try
                        {
                            SendAppointmentDelegate v = SendAppmt;
                            v.BeginInvoke(st, et, sub, dscr, loc, guest, connectedUser.Soc_id, connectedUser.Id, null, null);

                            //SendAppmt(st, et, sub, dscr, loc, guest);
                        }
                        catch (Exception ex)
                        {
                        }
                        //table2.Append("{\"IsSuccess\":true,\"Msg\":\"Réussir\",\"Data\":" + bjq.GetMaxId() + "}");
                        table2.Append("{\"IsSuccess\":true,\"Msg\":\"Réussir\",\"Data\":" + id + "}");
                    }
                    else
                    {
                        table2.Append("{\"IsSuccess\":false,\"Msg\":\"Échouer\"}");
                    }
                }
                catch (Exception ex)
                {
                    table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + ex.Message + "\"}");
                }
                return table2.ToString();
            }
            else
            {
                table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + "Authentication error !" + "\"}");
                return table2.ToString();
            }
        }

        private static void SendAppmt(DateTime st, DateTime et, string sub, string dscr, string loc, string guest, int socId, int usrId)
        {
            string Email4Aganda = "";
            UserServices userServices = new UserServices();
            var oneusr = userServices.GetOneUser(socId, usrId);
            if (oneusr != null)
            {
                Email4Aganda = oneusr.Email;
            }
            if (string.IsNullOrEmpty(Email4Aganda))
            {
                Email4Aganda = ConfigurationManager.AppSettings["Email4Aganda"];
            }

            guest += ";" + Email4Aganda;
            var tos = guest.RemoveDuplicate();
            var toTreated = tos.RemoveDuplicate().Split(';').ToList();
            foreach (var item in toTreated)
            {
                try
                {
                    NetMails.SendAppointment(null, item, sub, dscr, st, et, loc);
                }
                catch (Exception ex)
                {
                    string msg = ex.InnerException != null ? ex.InnerException.ToString() : "";
                    msg += " || " + ex.Message;
                    LogWriter.Write(DateTime.Now + " : Send mail failed for the following Error :" + msg, LogType.MailError);
                }
            }
        }

        /// <summary>
        /// 输出所有json数据  
        /// </summary>
        /// <param name="st"></param>
        /// <param name="et"></param>
        /// <returns></returns>
        public string listCalendarByRange(DateTime st, DateTime et, int usrId)
        {
            Entities.User connectedUser;
            StringBuilder table2 = new StringBuilder();
            if (CheckAuthentication(out connectedUser))
            {
                var bjq = new CalendarServices();
                string exstring = null;
                try
                {
                    List<Entities.Calendar> table1 = bjq.GetCalendarList(connectedUser.Id, st, et);
                    List<ArrayList> lists = new List<ArrayList>();
                    var sodIds = table1.Where(l => l.Sodid.HasValue).Select(l => l.Sodid.Value).ToList();
                    var sodwithCode = PurchaseBaseServices.GetSodCode(sodIds);
                    for (int i = 0; i < table1.Count; i++)
                    {
                        ArrayList list = new ArrayList();
                        list.Add(table1[i].CldId.ToString());
                        list.Add(table1[i].CldSubject);
                        list.Add(table1[i].CldDStart);
                        list.Add(table1[i].CldDEnd);
                        list.Add(table1[i].CldIsAllDayEvent ? "1" : "0");
                        list.Add(0);
                        list.Add(0);
                        list.Add(table1[i].CldColor);
                        list.Add(1);
                        list.Add(table1[i].CldLocation);
                        list.Add(table1[i].IsDone ? "1" : "0");
                        // jquery.calendar.js 中 1493行定义 
                        var thissod = sodwithCode.FirstOrDefault(l => l.Key == (table1[i].Sodid));
                        if (thissod != null)
                        {
                            // 11
                            list.Add(thissod.Value);
                            // 12
                            var sodFId = string.Format("../SupplierOrder/SupplierOrder.aspx?sodId={0}&mode=view", StringCipher.EncoderSimple(thissod.Key.ToString(), "sodId"));
                            list.Add(sodFId);
                        }
                        else
                        {
                            // 11
                            list.Add("");
                            // 12
                            list.Add("");
                        }
                        lists.Add(list);
                    }


                    string ResJsonStr;
                    IsoDateTimeConverter timeConverter;
                    timeConverter = new IsoDateTimeConverter();
                    timeConverter.DateTimeFormat = "MM'/'dd'/'yyyy' 'HH':'mm";
                    ResJsonStr = JsonConvert.SerializeObject(lists, Newtonsoft.Json.Formatting.Indented, timeConverter);
                    table2.Append("{\"events\":");
                    table2.Append(ResJsonStr + ",\"issort\":true,");
                    table2.Append("\"start\":\"" + st.ToString("MM/dd/yyyy HH:mm") + "\",");
                    table2.Append("\"end\":\"" + et.ToString("MM/dd/yyyy HH:mm") + "\",");


                }
                catch (Exception ex)
                {
                    exstring = ex.Message;
                }

                if (exstring == "" || exstring == null)
                {
                    table2.Append("\"error\":null}");
                }
                else
                {
                    table2.Append("\"error\":" + exstring + "}");
                }
            }
            else
            {
                table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + "Authentication error !" + "\"}");
                return table2.ToString();
            }

            return table2.ToString();
        }

        /// <summary>
        /// 两个时间段查询  
        /// </summary>
        /// <param name="day"></param>
        /// <param name="type"></param>
        /// <returns></returns>
        private string listCalendar(DateTime day, string type, int usrId)
        {
            DateTime st = new DateTime();
            DateTime et = new DateTime();
            switch (type)
            {
                case "month":
                    st = Convert.ToDateTime(day.Date.ToString("yyyy-MM-dd") + " " + day.Hour + ":" + day.Minute,
                        culture);
                    et =
                        Convert.ToDateTime(
                            day.AddMonths(1).Date.ToString("yyyy-MM-dd") + " " + day.Hour + ":" + day.Minute,
                            culture);
                    break;
                case "week":
                    int wd = (int)day.DayOfWeek;
                    st = Convert.ToDateTime(day.AddDays(1 - wd), culture);
                    et = Convert.ToDateTime(day.AddDays(7 - wd), culture);
                    break;
                case "day":
                    st = Convert.ToDateTime(day.Date.ToString("yyyy-MM-dd") + " " + day.Hour + ":" + day.Minute,
                        culture);
                    et =
                        Convert.ToDateTime(
                            day.AddDays(1).Date.ToString("yyyy-MM-dd") + " " + day.Hour + ":" + day.Minute, culture);
                    break;
                default:
                    break;
            }
            return listCalendarByRange(st, et, usrId);

        }

        /// <summary>
        /// 更新时间  
        /// </summary>
        /// <param name="id"></param>
        /// <param name="st"></param>
        /// <param name="et"></param>
        /// <returns></returns>
        public string updateCalendar(int id, DateTime st, DateTime et, int usrId)
        {
            Entities.User connectedUser;
            StringBuilder table2 = new StringBuilder();
            if (CheckAuthentication(out connectedUser))
            {
                var bjq = new CalendarServices();
                var jq = new Entities.Calendar();
                jq.CldId = id;
                jq.CldDStart = st;
                jq.CldDEnd = et;
                jq.UsrId = usrId;
                try
                {
                    string guest = string.Empty;
                    if (bjq.Update(ref jq, out guest, false))
                    {
                        // send appointment
                        try
                        {
                            SendAppointmentDelegate v = SendAppmt;
                            v.BeginInvoke(st, et, jq.CldSubject, jq.CldDescription, jq.CldLocation, guest, connectedUser.Soc_id, connectedUser.Id, null, null);

                            //SendAppmt(st, et, jq.cld_subject, jq.cld_description, jq.cld_location, guest);
                        }
                        catch (Exception ex)
                        {
                        }
                        table2.Append("{\"IsSuccess\":true,\"Msg\":\"Réussir\",\"Data\":" + jq.CldId + "}");
                    }
                    else
                    {
                        table2.Append("{\"IsSuccess\":false,\"Msg\":\"Échouer\"}");
                    }
                }
                catch (Exception ex)
                {
                    table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + ex.Message + "\"}");
                }
            }
            else
            {
                table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + "Authentication error !" + "\"}");
            }
            return table2.ToString();
        }

        /// <summary>
        /// 更新日程信息  
        /// </summary>
        /// <param name="id"></param>
        /// <param name="st"></param>
        /// <param name="et"></param>
        /// <param name="sub"></param>
        /// <param name="ade"></param>
        /// <param name="dscr"></param>
        /// <param name="loc"></param>
        /// <param name="color"></param>
        /// <param name="tz"></param>
        /// <returns></returns>
        public string updateDetailedCalendar(int id, DateTime st, DateTime et, string sub, int ade, string dscr, string loc, string color, string tz, string guest, int usrId, bool isDone, int ccoId = 0)
        {
            Entities.User connectedUser;
            StringBuilder table2 = new StringBuilder();
            if (CheckAuthentication(out connectedUser))
            {
                var bjq = new CalendarServices();
                var jq = new Entities.Calendar();
                jq.CldId = id;
                //jq.cld_d_start = st;
                //jq.cld_d_end = et;
                jq.CldSubject = sub;
                //jq.cld_is_all_day_event = ade == 1;

                jq.CldIsAllDayEvent = ade == 1;
                if (jq.CldIsAllDayEvent)
                {
                    jq.CldDStart = new DateTime(st.Year, st.Month, st.Day);
                    jq.CldDEnd = new DateTime(et.Year, et.Month, et.Day);
                }
                else
                {
                    jq.CldDStart = st;
                    jq.CldDEnd = et;
                }

                jq.CldDescription = dscr;
                jq.CldLocation = loc;
                jq.CldColor = color;
                jq.UsrId = usrId;
                jq.CldGuest = guest;
                jq.IsDone = isDone;
                try
                {
                    //string guest2 = string.Empty;
                    if (bjq.Update(ref jq, out guest))
                    {
                        // send appointment
                        try
                        {
                            SendAppointmentDelegate v = SendAppmt;
                            v.BeginInvoke(st, et, sub, dscr, loc, guest, connectedUser.Soc_id, connectedUser.Id, null, null);

                            //SendAppmt(st, et, sub, dscr, loc, guest);
                        }
                        catch (Exception ex)
                        {
                        }
                        table2.Append("{\"IsSuccess\":true,\"Msg\":\"Réussir\",\"Data\":" + jq.CldId + "}");
                    }
                    else
                    {
                        table2.Append("{\"IsSuccess\":false,\"Msg\":\"Échouer\"}");
                    }
                }
                catch (Exception ex)
                {
                    table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + ex.Message + "\"}");
                }
            }
            else
            {
                table2.Append("{\"IsSuccess\":false,\"Msg\":\"" + "Authentication error !" + "\"}");
            }
            return table2.ToString();
        }

        public string removeCalendar(int id)
        {
            var bjq = new CalendarServices();
            return bjq.Delete(id);
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }

        private bool CheckAuthentication(out Entities.User connectedUser)
        {
            bool checkOK = false;
            connectedUser = new Entities.User();
            var authCookieName = FormsAuthentication.FormsCookieName;
            var authCookie = HttpContext.Current.Request.Cookies[authCookieName];
            if (authCookie != null)
            {
                try
                {
                    FormsAuthenticationTicket ticket = FormsAuthentication.Decrypt(authCookie.Value);
                    checkOK = ticket.UserData.DecodeTicket(connectedUser);
                }
                catch (Exception ex)
                {
                }
            }
            return checkOK;
        }
    }
}
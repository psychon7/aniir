using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Linq.Dynamic;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;
using ERP.Repositories.SqlServer.Translators;

namespace ERP.Repositories.SqlServer
{
    public class CalendarRepository : BaseSqlServerRepository
    {

        public int GetMaxId()
        {
            int max = 0;
            var lastone = _db.TM_CLD_Calendar.OrderByDescending(m => m.cld_id).FirstOrDefault();
            max = lastone != null ? lastone.cld_id : 0;
            return max;
        }

        public bool Exists(int cldId)
        {
            return _db.TM_CLD_Calendar.Any(m => m.cld_id == cldId);
        }

        public int Add(Calendar calendar)
        {
            var onecld = CalendarTranslator.Entity2Rep().Compile().Invoke(calendar);
            var starttime = onecld.cld_d_start;
            var endtime = onecld.cld_d_end;
            CheckStartEndTime(ref starttime, ref endtime);
            onecld.cld_d_start = starttime;
            onecld.cld_d_end = endtime;
            onecld.cld_d_create = DateTime.Now;
            onecld.cld_d_update = null;
            _db.TM_CLD_Calendar.AddObject(onecld);
            _db.SaveChanges();
            return onecld.cld_id;
        }

        public bool Update(ref Calendar calendar, out string guest, bool updateDetail = true)
        {
            guest = string.Empty;
            if (calendar.CldId != 0)
            {
                Calendar calendar1 = calendar;
                //var onecal = _db.TM_CLD_Calendar.FirstOrDefault(m => m.cld_id == calendar1.CldId);
                var onecal = _db.TM_CLD_Calendar.FirstOrDefault(m => m.cld_id == calendar1.CldId);
                if (onecal != null)
                {
                    var starttime = calendar.CldDStart;
                    var endtime = calendar.CldDEnd;
                    CheckStartEndTime(ref starttime, ref endtime);
                    // 测试日期是否改变，如果改变且关联了sod 需要更改sod的日期
                    if ((!Compare2Dates(onecal.cld_d_start, starttime) || Compare2Dates(onecal.cld_d_end, endtime)) &&
                        (onecal.sol_id.HasValue || onecal.sod_id.HasValue)
                        && !string.IsNullOrEmpty(onecal.cld_action))
                    {
                        // 用于判断是更新SOD还是SOL
                        if (onecal.sol_id.HasValue)
                        {
                            UpdateSolDateByCalendar(onecal.sol_id.Value, onecal.cld_action, starttime);
                        }
                        else
                        {
                            UpdateSodDateByCalendar(onecal.sod_id.Value, onecal.cld_action, starttime);
                        }
                        // 是否有logistics 只更预达到
                        if (onecal.cld_action == "9")
                        {
                            var lgs = _db.TM_LGS_Logistic.FirstOrDefault(l => l.lgs_id == onecal.lgs_id);
                            if (lgs != null)
                            {
                                lgs.lgs_d_arrive_pre = starttime;
                                _db.TM_LGS_Logistic.ApplyCurrentValues(lgs);
                                _db.SaveChanges();

                                var lgls = lgs.TM_LGL_Logistic_Lines.Where(l => l.sol_id.HasValue && l.sol_id != onecal.sod_id).ToList();

                                foreach (var lgl in lgls)
                                {

                                    UpdateSolDeliveryDateByLogistic(lgl.sol_id.Value, starttime, calendar.UsrId, lgs.lgs_id);
                                }

                                //UpdateSolDeliveryDateByLogistic
                            }
                        }
                        //var lgs = _db.TM_LGL_Logistic_Lines.Where(l => l.lgs_id == onecal.lgs_id).ToList();

                    }
                    onecal.cld_d_start = starttime;
                    onecal.cld_d_end = endtime;
                    onecal.cld_d_update = DateTime.Now;
                    if (updateDetail)
                    {
                        onecal.cld_color = calendar.CldColor;
                        onecal.cld_description = calendar.CldDescription;
                        onecal.cld_is_all_day_event = calendar.CldIsAllDayEvent;
                        onecal.cld_location = calendar.CldLocation;
                        onecal.cld_recurring_rule = calendar.CldRecurringRule;
                        onecal.cld_subject = calendar.CldSubject;
                        onecal.cld_guest = calendar.CldGuest;
                        onecal.cld_isdone = calendar.IsDone;
                    }
                    else
                    {
                        calendar.CldColor = onecal.cld_color;
                        calendar.CldDescription = onecal.cld_description;
                        calendar.CldIsAllDayEvent = onecal.cld_is_all_day_event;
                        calendar.CldLocation = onecal.cld_location;
                        calendar.CldRecurringRule = onecal.cld_recurring_rule;
                        calendar.CldSubject = onecal.cld_subject;
                        calendar.CldGuest = onecal.cld_guest;
                    }
                    guest = onecal.cld_guest;
                    _db.TM_CLD_Calendar.ApplyCurrentValues(onecal);
                    _db.SaveChanges();
                    return true;
                }
                else
                {
                    return Add(calendar) > 1;
                }
            }
            else
            {
                return Add(calendar) > 1;
            }
        }

        private void CheckStartEndTime(ref DateTime? startTime, ref DateTime? endTime)
        {
            if (startTime > endTime)
            {
                var intertime = startTime;
                startTime = endTime;
                endTime = intertime;
            }
        }

        private bool Compare2Dates(DateTime? d1, DateTime? d2)
        {
            bool result = false;
            if (d1.HasValue && !d2.HasValue)
            {
                result = false;
            }
            else if (!d1.HasValue && d2.HasValue)
            {
                result = false;
            }
            else if (!d1.HasValue && !d2.HasValue)
            {
                result = true;
            }
            else if (d1.HasValue && d2.HasValue && (d1.Value.Date == d2.Value.Date))
            {
                result = true;
            }
            return result;
        }

        /// <summary>
        /// 删除一条数据
        /// </summary>
        public string Delete(int cldId)
        {
            var onecal = _db.TM_CLD_Calendar.FirstOrDefault(m => m.cld_id == cldId);
            try
            {
                if (onecal != null)
                {
                    if (onecal.sol_id.HasValue)
                    {
                        return "Supplier Order is not empty, please delete from supplier order !!!";
                    }
                    else
                    {
                        _db.DeleteObject(onecal);
                        _db.SaveChanges();
                        return null;
                    }
                }
                else
                {
                    return null;
                }
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }
        ///// <summary>
        ///// 批量删除数据
        ///// </summary>
        //public bool DeleteList(string Idlist)
        //{
        //    try
        //    {
        //        var ids = Enumerable.Select(Idlist.Split(',').ToList().Select(m => m.Trim()), m => Convert.ToInt32(m));
        //        var allcals = Queryable.Where(_db.TM_CLD_Calendar, m => ids.Contains(m.cld_id)).ToList();
        //        foreach (var aCal in allcals)
        //        {
        //            _db.DeleteObject(aCal);
        //            _db.SaveChanges();
        //        }
        //        return true;
        //    }
        //    catch (Exception)
        //    {
        //        return false;
        //    }
        //}

        /// <summary>
        /// 得到一个对象实体
        /// </summary>
        public Calendar GetModel(int cldId)
        {
            var onecal = _db.TM_CLD_Calendar.FirstOrDefault(m => m.cld_id == cldId);
            var cld = new Calendar
            {
                CldDStart = DateTime.Now,
                CldDEnd = DateTime.Now
            };

            if (onecal != null)
            {
                cld = CalendarTranslator.Rep2Entity().Compile().Invoke(onecal);
            }
            return cld;

        }

        public List<Calendar> GetCalendarList(int usrId, DateTime st, DateTime et)
        {
            st = st.AddMonths(-1);
            et = et.AddMonths(1);
            var allcals = (from cld in _db.TM_CLD_Calendar
                           join ucl in _db.TR_UCL_User_Calendar on cld.cld_id equals ucl.cld_id
                           into leftJn
                           from lj in leftJn.DefaultIfEmpty()
                           where (cld.usr_id == usrId || lj.usr_id == usrId)
                           && ((cld.cld_d_start >= st && cld.cld_d_start <= et)
                           || (cld.cld_d_end >= st && cld.cld_d_end <= et))
                           select cld).Distinct().Select(CalendarTranslator.Rep2Entity()).ToList();

            //var allcals = _db.TM_CLD_Calendar.Where(m => m.usr_id == usrId).Select(CalendarTranslator.Rep2Entity()).ToList();
            return allcals;
        }

        public List<Calendar> GetComingEvents(int usrId)
        {
            var allcals = (from cld in _db.TM_CLD_Calendar
                           join ucl in _db.TR_UCL_User_Calendar on cld.cld_id equals ucl.cld_id
                           into leftJn
                           from lj in leftJn.DefaultIfEmpty()
                           where (cld.usr_id == usrId || lj.usr_id == usrId)
                           && cld.cld_d_end >= DateTime.Now
                           && (cld.cld_isdone == null || cld.cld_isdone == false)
                           select cld).Distinct().OrderBy(m => m.cld_d_start).Select(CalendarTranslator.Rep2Entity()).ToList();

            //var allcals = _db.TM_CLD_Calendar.Where(m => m.usr_id == usrId && m.cld_d_end >= DateTime.Now).OrderBy(m => m.cld_d_start).Select(CalendarTranslator.Rep2Entity()).ToList();
            return allcals;
        }

        /// <summary>
        /// 获取记录总数
        /// </summary>
        public int GetRecordCount(int usrId)
        {
            return _db.TM_CLD_Calendar.Count(m => m.usr_id == usrId);
        }

        #region For Supplier Order

        #region Supplier Order Line

        public List<Calendar> AddUpdateNotfForSol(int solId, int usrId, out string guests)
        {
            var result = new List<Calendar>();
            guests = string.Empty;
            var sodsol = (from sod in _db.TM_SOD_Supplier_Order
                          join sol in _db.TM_SOL_SupplierOrder_Lines on sod.sod_id equals sol.sod_id
                          where sol.sol_id == solId
                          select new { sod, sol }).FirstOrDefault();
            if (sodsol != null)
            {
                guests =
                    _db.TM_USR_User.Where(
                        m =>
                            (m.usr_rcv_purchase_notif == true || m.usr_id == usrId) &&
                            !string.IsNullOrEmpty(m.usr_email))
                        .Select(m => m.usr_email)
                        .Distinct().ToList()
                        .Aggregate("", (current, guest) => current + (guest + ";"));
                var allusrRcvNotif = _db.TM_USR_User.Where(m => m.usr_rcv_purchase_notif == true && m.usr_id != usrId).Select(m => m.usr_id).Distinct().ToList();
                string Description = sodsol.sol.sol_description;
                string PrdDescription = sodsol.sol.sol_prd_des;
                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n" + Description));
                allDes = string.Format("Qty:{0}\r\n{1}", sodsol.sol.sol_quantity, allDes);
                // for deadline

                var actioncolor = "1";

                // 20201022 取消最迟交期及开始生产提醒
                string title = sodsol.sod.sod_name + " 最迟交期/DEADLINE";
                //AddCalenderSolDate(guests, sodsol.sol.sol_deadline, sodsol.sod, sodsol.sol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

                //// for date start production
                //actioncolor = "12";
                //title = sodsol.sod.sod_name + " 开始生产/START 2 PROD";
                //AddCalenderSolDate(guests, sodsol.sol.sol_d_production, sodsol.sod, sodsol.sol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

                // for date pre delivery
                actioncolor = "6";
                title = sodsol.sod.sod_code + " 预完成/FINI LA PROD PRÉVU";
                AddCalenderSolDate(guests, sodsol.sol.sol_d_exp_delivery, sodsol.sod, sodsol.sol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

                // for date pre arrival
                actioncolor = "9";
                title = sodsol.sod.sod_code + " 预到达/ARRIVER PRÉVU";
                AddCalenderSolDate(guests, sodsol.sol.sol_d_exp_arrival, sodsol.sod, sodsol.sol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

            }
            else
            {
                if (solId != 0)
                {
                    var allClds = _db.TM_CLD_Calendar.Where(m => m.sol_id == solId).ToList();
                    if (allClds.Any())
                    {
                        foreach (var onecld in allClds)
                        {
                            _db.TM_CLD_Calendar.DeleteObject(onecld);
                        }
                        _db.SaveChanges();
                    }
                }
            }
            return result;
        }

        private void AddCalenderSolDate(string guests,
            DateTime? datetime,
            TM_SOD_Supplier_Order sod,
            TM_SOL_SupplierOrder_Lines sol,
            string actioncolor,
            string allDes,
            List<Calendar> result,
            string title,
            int usrId,
            List<int> usrIds)
        {
            var onedate = AddCalendarSol(datetime, actioncolor);
            var subject = string.Format("{0}: {1} | {2} | Qty {3:n0} | {4} ", title, sol.sol_client, sod.sod_name, sol.sol_quantity, sol.sol_prd_name);
            if (onedate != null)
            {
                //var checkDate = (from cld in _db.TM_CLD_Calendar
                //                 where cld.sol_id == sol.sol_id
                //                       && cld.cld_action == actioncolor
                //                 select cld).FirstOrDefault();

                var checkDateList = (from cld in _db.TM_CLD_Calendar
                                     where cld.sol_id == sol.sol_id
                                           && cld.cld_action == actioncolor
                                     select cld).ToList();
                var checkDate = checkDateList.FirstOrDefault();
                if (checkDate != null)
                {
                    if (checkDate.cld_d_start != onedate.CldDStart || checkDate.cld_d_end != onedate.CldDEnd || checkDate.cld_subject != subject)
                    {
                        // to update
                        var description = allDes;
                        checkDate.cld_subject = subject;
                        checkDate.cld_description = description;
                        checkDate.cld_guest = guests;
                        checkDate.cld_d_update = DateTime.Now;
                        checkDate.cld_d_start = onedate.CldDStart;
                        checkDate.cld_d_end = onedate.CldDEnd;
                        _db.TM_CLD_Calendar.ApplyCurrentValues(checkDate);
                        _db.SaveChanges();
                        subject = "UPDATE " + subject;
                        onedate.CldSubject = subject;
                        onedate.CldDescription = description;
                        onedate.CldGuest = guests;
                        result.Add(onedate);
                    }

                    var otherDate = checkDateList.Where(l => l.cld_id != checkDate.cld_id).ToList();
                    foreach (var tmCldCalendar in otherDate)
                    {
                        _db.TM_CLD_Calendar.DeleteObject(tmCldCalendar);
                    }
                    _db.SaveChanges();
                }
                else
                {
                    // create
                    onedate.CldSubject = subject;
                    onedate.CldDescription = allDes;
                    onedate.CldGuest = guests;
                    var onecld = CalendarTranslator.Entity2Rep().Compile().Invoke(onedate);
                    onecld.sod_id = sod.sod_id;
                    onecld.sol_id = sol.sol_id;
                    onecld.sol_guid = sol.sol_guid;
                    onecld.usr_id = usrId;
                    onecld.cld_action = actioncolor;
                    _db.TM_CLD_Calendar.AddObject(onecld);
                    _db.SaveChanges();

                    // add to all users who receive notif
                    foreach (var id in usrIds)
                    {
                        var ucl = new TR_UCL_User_Calendar
                        {
                            cld_id = onecld.cld_id,
                            usr_id = id
                        };
                        _db.TR_UCL_User_Calendar.AddObject(ucl);
                    }
                    _db.SaveChanges();
                    result.Add(onedate);
                }
            }
            else
            {
                // 将已有的date 删除
                var checkDate = (from cld in _db.TM_CLD_Calendar
                                 where cld.sol_id == sol.sol_id
                                       && cld.cld_action == actioncolor
                                 select cld).FirstOrDefault();
                if (checkDate != null)
                {
                    try
                    {
                        // delete in ucl
                        var ucls = _db.TR_UCL_User_Calendar.Where(m => m.cld_id == checkDate.cld_id).ToList();
                        if (ucls.Any())
                        {
                            foreach (var oneucl in ucls)
                            {
                                _db.TR_UCL_User_Calendar.DeleteObject(oneucl);
                            }
                            _db.SaveChanges();
                        }
                        _db.DeleteObject(checkDate);
                        _db.SaveChanges();
                    }
                    catch (Exception)
                    {
                    }
                }
            }
        }

        private Calendar AddCalendarSol(DateTime? dateTime, string color)
        {
            if (dateTime.HasValue)
            {
                var oneday = new DateTime(dateTime.Value.Year, dateTime.Value.Month, dateTime.Value.Day);
                var calendar = new Calendar
                {
                    CldDStart = oneday,
                    CldDEnd = oneday.AddDays(1).AddSeconds(-1),
                    CldColor = color,
                    CldIsAllDayEvent = true,
                };
                var onecld = CalendarTranslator.Entity2Rep().Compile().Invoke(calendar);
                var starttime = onecld.cld_d_start;
                var endtime = onecld.cld_d_end;
                CheckStartEndTime(ref starttime, ref endtime);
                onecld.cld_d_start = starttime;
                onecld.cld_d_end = endtime;
                onecld.cld_d_create = DateTime.Now;
                onecld.cld_d_update = DateTime.Now;
                return calendar;
            }
            else
            {
                return null;
            }
        }

        private string UpdateSolDateByCalendar(int solId, string coloraction, DateTime? datetime)
        {
            var guests = _db.TM_USR_User.Where(m => (m.usr_rcv_purchase_notif == true) && !string.IsNullOrEmpty(m.usr_email)).Select(m => m.usr_email).Distinct().ToList().Aggregate("", (current, guest) => current + (guest + ";"));
            var sol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(m => m.sol_id == solId);
            if (sol != null)
            {
                switch (coloraction)
                {
                    case "1":
                        {
                            sol.sol_deadline = datetime;
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sol);
                            _db.SaveChanges();
                        }
                        break;
                    case "12":
                        {
                            sol.sol_d_production = datetime;
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sol);
                            _db.SaveChanges();
                        }
                        break;
                    case "6":
                        {
                            sol.sol_d_exp_delivery = datetime;
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sol);
                            _db.SaveChanges();
                        }
                        break;
                    case "9":
                        {
                            sol.sol_d_exp_arrival = datetime;
                            _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sol);
                            _db.SaveChanges();
                        }
                        break;
                }
            }
            return guests;
        }

        public void DeletedAllNotifOfSod(int sodId)
        {
            var cldsods = _db.TM_CLD_Calendar.Where(l => l.sod_id == sodId).ToList();
            if (cldsods.Any())
            {
                //var ucls = (from ucl in _db.TR_UCL_User_Calendar
                //    join cld in cldsods on ucl.cld_id equals cld.cld_id
                //    select ucl).ToList();
                //foreach (var oneucl in ucls)
                //{
                //    _db.TR_UCL_User_Calendar.DeleteObject(oneucl);
                //}
                //_db.SaveChanges();

                //var ucls = _db.TR_UCL_User_Calendar.Join(
                //    cldsods,
                //    ucl => ucl.cld_id,
                //    cld => cld.cld_id,
                //    (ucl, cld) => ucl).ToList();

                foreach (var onecld in cldsods)
                {
                    var ucls = _db.TR_UCL_User_Calendar.Where(l => l.cld_id == onecld.cld_id).ToList();
                    foreach (var oneucl in ucls)
                    {
                        _db.TR_UCL_User_Calendar.DeleteObject(oneucl);
                    }
                    _db.SaveChanges();
                }

                foreach (var onecld in cldsods)
                {
                    _db.TM_CLD_Calendar.DeleteObject(onecld);
                }
                _db.SaveChanges();
            }
        }


        /// <summary>
        /// 当SOL有变动或logistics有变动时，更新日历
        /// </summary>
        /// <param name="solId"></param>
        /// <param name="dExpArr"></param>
        /// <param name="usrId"></param>
        /// <param name="lgsId"></param>
        public void UpdateSolDeliveryDateByLogistic(int solId, DateTime? dExpArr, int usrId, int lgsId, string Transporter = null, string LogsNbr = null)
        {
            var sol = _db.TM_SOL_SupplierOrder_Lines.FirstOrDefault(l => l.sol_id == solId);
            if (sol != null)
            {
                // update sol date
                sol.sol_d_exp_arrival = dExpArr;
                if (!string.IsNullOrEmpty(Transporter))
                {
                    sol.sol_transporter = Transporter;
                }
                if (!string.IsNullOrEmpty(LogsNbr))
                {
                    sol.sol_logistics_number = LogsNbr;
                }
                _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sol);
                _db.SaveChanges();

                // create
                var usr = _db.TM_USR_User.FirstOrDefault(l => l.usr_id == usrId);
                var actioncolor = "9";
                var sod = sol.TM_SOD_Supplier_Order;
                var title = sod.sod_code + " 预到达/ARRIVER PRÉVU";
                var onedate = AddCalendarSol(dExpArr, actioncolor);
                var subject = string.Format("{0}: {1} | {2} | Qty {3:n0} | {4} ", title, sol.sol_client, sod.sod_name, sol.sol_quantity, sol.sol_prd_name);
                string Description = sol.sol_description;
                string PrdDescription = sol.sol_prd_des;
                string allDes = string.IsNullOrEmpty(PrdDescription)
                    ? Description
                    : (string.IsNullOrEmpty(Description) ? PrdDescription : (PrdDescription + "\r\n" + Description));
                allDes = string.Format("Qty:{0}\r\n{1}", sol.sol_quantity, allDes);
                var guests = usr != null ? usr.usr_email : string.Empty;
                var allusrRcvNotif = _db.TM_USR_User.Where(m => m.usr_rcv_purchase_notif == true && m.usr_id != usrId).Select(m => m.usr_id).Distinct().ToList();
                if (onedate != null)
                {
                    var checkDate = (from cld in _db.TM_CLD_Calendar
                                     where cld.sol_id == sol.sol_id
                                           && cld.cld_action == actioncolor
                                     select cld).FirstOrDefault();
                    if (checkDate != null)
                    {
                        if (checkDate.cld_d_start != onedate.CldDStart || checkDate.cld_d_end != onedate.CldDEnd || checkDate.cld_subject != subject)
                        {
                            // to update
                            //var description = allDes;
                            checkDate.cld_subject = subject;
                            //checkDate.cld_description = description;
                            //checkDate.cld_guest = guests;
                            checkDate.cld_d_update = DateTime.Now;
                            checkDate.cld_d_start = onedate.CldDStart;
                            checkDate.cld_d_end = onedate.CldDEnd;
                            checkDate.lgs_id = lgsId;
                            _db.TM_CLD_Calendar.ApplyCurrentValues(checkDate);
                            _db.SaveChanges();
                        }
                    }
                    else
                    {
                        // create
                        onedate.CldSubject = subject;
                        onedate.CldDescription = allDes;
                        onedate.CldGuest = guests;
                        var onecld = CalendarTranslator.Entity2Rep().Compile().Invoke(onedate);
                        onecld.sod_id = sod.sod_id;
                        onecld.sol_id = sol.sol_id;
                        onecld.sol_guid = sol.sol_guid;
                        onecld.usr_id = usrId;
                        onecld.cld_action = actioncolor;
                        onecld.lgs_id = lgsId;
                        _db.TM_CLD_Calendar.AddObject(onecld);
                        _db.SaveChanges();

                        // add to all users who receive notif
                        foreach (var id in allusrRcvNotif)
                        {
                            var ucl = new TR_UCL_User_Calendar
                            {
                                cld_id = onecld.cld_id,
                                usr_id = id
                            };
                            _db.TR_UCL_User_Calendar.AddObject(ucl);
                        }
                        _db.SaveChanges();
                    }
                }
                else
                {
                    // 将已有的date 删除
                    var checkDate = (from cld in _db.TM_CLD_Calendar
                                     where cld.sol_id == sol.sol_id
                                           && cld.cld_action == actioncolor
                                     select cld).FirstOrDefault();
                    if (checkDate != null)
                    {
                        try
                        {
                            // delete in ucl
                            var ucls = _db.TR_UCL_User_Calendar.Where(m => m.cld_id == checkDate.cld_id).ToList();
                            if (ucls.Any())
                            {
                                foreach (var oneucl in ucls)
                                {
                                    _db.TR_UCL_User_Calendar.DeleteObject(oneucl);
                                }
                                _db.SaveChanges();
                            }
                            _db.DeleteObject(checkDate);
                            _db.SaveChanges();
                        }
                        catch (Exception)
                        {
                        }
                    }
                }
            }
        }

        #endregion Supplier Order Line

        #region Supplier Order


        public List<Calendar> AddUpdateNotfForSod(int sodId, int usrId, out string guests)
        {
            var result = new List<Calendar>();
            guests = string.Empty;
            var sodsol = (from sod in _db.TM_SOD_Supplier_Order
                          where sod.sod_id == sodId
                          select sod).FirstOrDefault();
            if (sodsol != null)
            {
                guests =
                    _db.TM_USR_User.Where(
                        m =>
                            (m.usr_rcv_purchase_notif == true || m.usr_id == usrId) &&
                            !string.IsNullOrEmpty(m.usr_email))
                        .Select(m => m.usr_email)
                        .Distinct().ToList()
                        .Aggregate("", (current, guest) => current + (guest + ";"));
                var allusrRcvNotif = _db.TM_USR_User.Where(m => m.usr_rcv_purchase_notif == true && m.usr_id != usrId).Select(m => m.usr_id).Distinct().ToList();
                string Description = sodsol.sod_code;
                string PrdDescription = sodsol.sod_name;
                string allDes = Description + " | " + PrdDescription;
                // for deadline

                var actioncolor = "1";

                // 20201022 取消最迟交期及开始生产提醒
                string title = sodsol.sod_name + " 最迟交期/DEADLINE";
                //AddCalenderSolDate(guests, sodsol.sol.sol_deadline, sodsol.sod, sodsol.sol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

                //// for date start production
                //actioncolor = "12";
                //title = sodsol.sod.sod_name + " 开始生产/START 2 PROD";
                //AddCalenderSolDate(guests, sodsol.sol.sol_d_production, sodsol.sod, sodsol.sol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

                // for date pre delivery
                actioncolor = "6";
                title = sodsol.sod_code + " 预完成/FINI LA PROD PRÉVU";
                AddCalenderSodDate(guests, sodsol.sod_d_exp_delivery, sodsol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

                // for date pre arrival
                //actioncolor = "9";
                //title = sodsol.sod_code + " 预到达/ARRIVER PRÉVU";
                //AddCalenderSodDate(guests, sodsol.sol.sol_d_exp_arrival, sodsol.sod, sodsol.sol, actioncolor, allDes, result, title, usrId, allusrRcvNotif);

            }
            else
            {
                if (sodId != 0)
                {
                    var allClds = _db.TM_CLD_Calendar.Where(m => m.sod_id == sodId && !m.sol_id.HasValue).ToList();
                    if (allClds.Any())
                    {
                        foreach (var onecld in allClds)
                        {
                            _db.TM_CLD_Calendar.DeleteObject(onecld);
                        }
                        _db.SaveChanges();
                    }
                }
            }
            return result;
        }



        private void AddCalenderSodDate(string guests,
            DateTime? datetime,
            TM_SOD_Supplier_Order sod,
            string actioncolor,
            string allDes,
            List<Calendar> result,
            string title,
            int usrId,
            List<int> usrIds)
        {
            var onedate = AddCalendarSol(datetime, actioncolor);
            var subject = string.Format("{0}: {1}", title, sod.sod_name);
            if (onedate != null)
            {
                //var checkDate = (from cld in _db.TM_CLD_Calendar
                //                 where cld.sol_id == sol.sol_id
                //                       && cld.cld_action == actioncolor
                //                 select cld).FirstOrDefault();

                var checkDateList = (from cld in _db.TM_CLD_Calendar
                                     where cld.sod_id == sod.sod_id
                                     && !cld.sol_id.HasValue
                                           && cld.cld_action == actioncolor
                                     select cld).ToList();
                var checkDate = checkDateList.FirstOrDefault();
                if (checkDate != null)
                {
                    if (checkDate.cld_d_start != onedate.CldDStart || checkDate.cld_d_end != onedate.CldDEnd || checkDate.cld_subject != subject)
                    {
                        // to update
                        var description = allDes;
                        checkDate.cld_subject = subject;
                        checkDate.cld_description = description;
                        checkDate.cld_guest = guests;
                        checkDate.cld_d_update = DateTime.Now;
                        checkDate.cld_d_start = onedate.CldDStart;
                        checkDate.cld_d_end = onedate.CldDEnd;
                        _db.TM_CLD_Calendar.ApplyCurrentValues(checkDate);
                        _db.SaveChanges();
                        subject = "UPDATE " + subject;
                        onedate.CldSubject = subject;
                        onedate.CldDescription = description;
                        onedate.CldGuest = guests;
                        result.Add(onedate);
                    }

                    var otherDate = checkDateList.Where(l => l.cld_id != checkDate.cld_id).ToList();
                    foreach (var tmCldCalendar in otherDate)
                    {
                        _db.TM_CLD_Calendar.DeleteObject(tmCldCalendar);
                    }
                    _db.SaveChanges();
                }
                else
                {
                    // create
                    onedate.CldSubject = subject;
                    onedate.CldDescription = allDes;
                    onedate.CldGuest = guests;
                    var onecld = CalendarTranslator.Entity2Rep().Compile().Invoke(onedate);
                    onecld.sod_id = sod.sod_id;
                    onecld.usr_id = usrId;
                    onecld.cld_action = actioncolor;
                    _db.TM_CLD_Calendar.AddObject(onecld);
                    _db.SaveChanges();

                    // add to all users who receive notif
                    foreach (var id in usrIds)
                    {
                        var ucl = new TR_UCL_User_Calendar
                        {
                            cld_id = onecld.cld_id,
                            usr_id = id
                        };
                        _db.TR_UCL_User_Calendar.AddObject(ucl);
                    }
                    _db.SaveChanges();
                    result.Add(onedate);
                }
            }
            else
            {
                // 将已有的date 删除
                var checkDate = (from cld in _db.TM_CLD_Calendar
                                 where cld.sod_id == sod.sod_id
                                     && !cld.sol_id.HasValue
                                       && cld.cld_action == actioncolor
                                 select cld).FirstOrDefault();
                if (checkDate != null)
                {
                    try
                    {
                        // delete in ucl
                        var ucls = _db.TR_UCL_User_Calendar.Where(m => m.cld_id == checkDate.cld_id).ToList();
                        if (ucls.Any())
                        {
                            foreach (var oneucl in ucls)
                            {
                                _db.TR_UCL_User_Calendar.DeleteObject(oneucl);
                            }
                            _db.SaveChanges();
                        }
                        _db.DeleteObject(checkDate);
                        _db.SaveChanges();
                    }
                    catch (Exception)
                    {
                    }
                }
            }
        }


        private string UpdateSodDateByCalendar(int sodId, string coloraction, DateTime? datetime)
        {
            var guests = _db.TM_USR_User.Where(m => (m.usr_rcv_purchase_notif == true) && !string.IsNullOrEmpty(m.usr_email)).Select(m => m.usr_email).Distinct().ToList().Aggregate("", (current, guest) => current + (guest + ";"));
            var sod = _db.TM_SOD_Supplier_Order.FirstOrDefault(m => m.sod_id == sodId);
            if (sod != null)
            {
                switch (coloraction)
                {
                    //case "1":
                    //    {
                    //        sod.sol_deadline = datetime;
                    //        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sod);
                    //        _db.SaveChanges();
                    //    }
                    //    break;
                    //case "12":
                    //    {
                    //        sod.sol_d_production = datetime;
                    //        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sod);
                    //        _db.SaveChanges();
                    //    }
                    //    break;
                    case "6":
                        {
                            sod.sod_d_exp_delivery = datetime;
                            _db.TM_SOD_Supplier_Order.ApplyCurrentValues(sod);
                            _db.SaveChanges();
                        }
                        break;
                    //case "9":
                    //    {
                    //        sod.sol_d_exp_arrival = datetime;
                    //        _db.TM_SOL_SupplierOrder_Lines.ApplyCurrentValues(sod);
                    //        _db.SaveChanges();
                    //    }
                    //    break;
                }
            }
            return guests;
        }





        #endregion Supplier Order
        #endregion For Supplier Order
    }
}
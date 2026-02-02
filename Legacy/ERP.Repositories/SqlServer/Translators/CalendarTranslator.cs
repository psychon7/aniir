using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using ERP.Repositories.DataBase;
using ERP.Entities;

namespace ERP.Repositories.SqlServer.Translators
{
    public static class CalendarTranslator
    {
        public static Expression<Func<TM_CLD_Calendar, Calendar>> Rep2Entity()
        {
            return m => new Calendar
            {
                CldId = m.cld_id,
                CldDEnd = m.cld_d_end,
                CldDStart = m.cld_d_start,
                CldColor = m.cld_color,
                CldDCreate = m.cld_d_create,
                CldDUpdate = m.cld_d_update,
                CldDescription = m.cld_description,
                CldGuest = m.cld_guest,
                CldIsAllDayEvent = m.cld_is_all_day_event,
                CldLocation = m.cld_location,
                CldRecurringRule = m.cld_recurring_rule,
                CldSubject = m.cld_subject,
                UsrId = m.usr_id,
                Guid = m.cld_guid,
                SolGuid = m.sol_guid,
                Sodid = m.sod_id,
                SolId = m.sol_id,
                Action = m.cld_action,
                IsDone = m.cld_isdone ?? false,
                LgsId = m.lgs_id
            };
        }

        public static Expression<Func<Calendar, TM_CLD_Calendar>> Entity2Rep()
        {
            return m => new TM_CLD_Calendar
            {
                //cld_id = m.CldId,
                cld_d_end = m.CldDEnd,
                cld_d_start = m.CldDStart,
                cld_color = m.CldColor,
                cld_d_create = DateTime.Now,
                cld_d_update = m.CldDUpdate,
                cld_description = m.CldDescription,
                cld_guest = m.CldGuest,
                cld_is_all_day_event = m.CldIsAllDayEvent,
                cld_location = m.CldLocation,
                cld_recurring_rule = m.CldRecurringRule,
                cld_subject = m.CldSubject,
                cld_action = m.Action,
                cld_isdone = m.IsDone,
                usr_id = m.UsrId,
                lgs_id = m.LgsId
            };
        }
    }
}

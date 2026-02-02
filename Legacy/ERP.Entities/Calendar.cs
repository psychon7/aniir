using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Calendar
    {
        public int CldId { get; set; }
        public string CldSubject { get; set; }
        public string CldLocation { get; set; }
        public string CldDescription { get; set; }
        public DateTime? CldDStart { get; set; }
        public DateTime? CldDEnd { get; set; }
        public bool CldIsAllDayEvent { get; set; }
        public string CldColor { get; set; }
        public string CldRecurringRule { get; set; }
        public int UsrId { get; set; }
        public DateTime CldDCreate { get; set; }
        public string CldGuest { get; set; }
        public DateTime? CldDUpdate { get; set; }

        public Guid? Guid { get; set; }
        public int? SolId { get; set; }
        public int? Sodid { get; set; }
        public Guid? SolGuid { get; set; }

        /// <summary>
        /// 在SOD中，用color 定义Action
        /// </summary>
        public string Action { get; set; }
        public bool IsDone { get; set; }
        public int? LgsId { get; set; }
    }
}
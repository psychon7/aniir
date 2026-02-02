using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    /// <summary>
    /// User comment and user flag
    /// </summary>
    public class UserCommentFlagH : BaseClass
    {
        public int Id { get; set; }
        public DateTime DCreation { get; set; }
        public DateTime? DUpdate { get; set; }
        public string Comment { get; set; }
        /// <summary>
        /// 外键名称 nulable
        /// </summary>
        public string FkName { get; set; }
        /// <summary>
        /// 外键Id nulable
        /// </summary>
        public int? FkId { get; set; }
        public int UsrId { get; set; }
    }
}

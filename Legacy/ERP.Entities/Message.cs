using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Message : BaseClass
    {
        public int Id { get; set; }
        public DateTime DCreation { get; set; }
        public string FkName { get; set; }
        public int? FkId { get; set; }
        public int UsrId { get; set; }
        public List<MessageItem> AllMessages { get; set; }
        public bool IsToDo { get; set; }
        public bool IsMemo { get; set; }
    }

    public class MessageItem
    {
        /// <summary>
        /// guid
        /// </summary>
        public string Id { get; set; }
        public DateTime DCreation { get; set; }
        public DateTime DUpdate { get; set; }
        public string Content { get; set; }
        public bool? IsRead { get; set; }
        public bool? IsTreated { get; set; }
        public int MsgId { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class EntityMessage
    {
        public string Name { get; set; }
        public string Lastname { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
        public string OrderCode { get; set; }
        public string Subject { get; set; }
        public string url { get; set; }
        public string Message { get; set; }
        /// <summary>
        /// 0--> contact; 1 --> diagnostic
        /// </summary>
        public string IsDirver { get; set; }
        public string Address { get; set; }
        public string PostCode { get; set; }
        public string City { get; set; }
        public string How2Know { get; set; }
        public string Code { get; set; }
        public string IP { get; set; }
        public string CompanyName { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class EmailClass : BaseClass
    {
        public string Subject { get; set; }
        public string From { get; set; }
        public string Body { get; set; }
        public string Tos { get; set; }
        public string Password { get; set; }
        public string Ccs { get; set; }
        public bool IsHtml { get; set; }
    }
}

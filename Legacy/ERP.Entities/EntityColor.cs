using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class EntityColor : BaseClass
    {
        public int Id { get; set; }
        public string CorName { get; set; }
        public string CorDescription { get; set; }
        public int CorRed { get; set; }
        public int CorGreen { get; set; }
        public int CorBlue { get; set; }
        public int SocId { get; set; }
    }
}

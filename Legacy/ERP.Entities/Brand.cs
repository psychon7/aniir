using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Brand : BaseClass
    {
        public int BraId { get; set; }
        public int SocId { get; set; }
        public string BraCode { get; set; }
        public string BraName { get; set; }
        public string BraDescription { get; set; }
        public bool BraIsActived { get; set; }
    }
}

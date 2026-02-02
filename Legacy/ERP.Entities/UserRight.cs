using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class UserRight : BaseClass
    {
        public int RitId { get; set; }
        public int ScrId { get; set; }
        public int RolId { get; set; }
        public bool RitRead { get; set; }
        public bool RitValid { get; set; }
        public bool RitModify { get; set; }
        public bool RitCreate { get; set; }
        public bool RitDelete { get; set; }
        public bool RitActive { get; set; }
        public bool RitCancel { get; set; }
        public bool RitSuperRight { get; set; }
    }
}

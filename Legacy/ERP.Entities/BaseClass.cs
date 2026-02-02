using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class BaseClass
    {
        public string FId { get; set; }

        /// <summary>
        /// 0 normal, 1 super mode
        /// </summary>
        public int LoginMode { get; set; }

        public bool SuperRight { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Permissions;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class DeliveryFormLine : ClientOrderLine
    {
        public int DflId { get; set; }
        public int DfoId { get; set; }
        public string DfoFId { get; set; }
        //public int ColId { get; set; }
        public string DflDescription { get; set; }
        public decimal? DflQuantity { get; set; }
        //public int SocId { get; set; }

        /// <summary>
        ///  for shipping receving
        /// </summary>
        public int SheId { get; set; }

        /// <summary>
        ///  for shipping receving
        /// </summary>
        public int InvId { get; set; }


        /// <summary>
        ///  for shipping receving
        /// </summary>
        public int WhsId { get; set; }

        /// <summary>
        /// 20210903 Client Invoice Line
        /// </summary>
        public int CiiId { get; set; }
        public int CinId { get; set; }

    }
}

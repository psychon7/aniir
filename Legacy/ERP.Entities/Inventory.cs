using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Inventory : BaseClass
    {
        public int Id { get; set; }
        public int PrdId { get; set; } //  if null 0
        public int PitId { get; set; } // if null 0
        public string PrdName { get; set; }
        public string PrdRef { get; set; }
        public string PrdDescription { get; set; }
        public int Quantity { get; set; }
        public DateTime DUpdate { get; set; }
        public string Description { get; set; }
    }

    public class PreInventory : BaseClass
    {
        public int Id { get; set; }
        public int InvId { get; set; }
        public int Quantity { get; set; }
        public DateTime DUpdate { get; set; }
    }
}

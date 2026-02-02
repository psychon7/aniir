using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class ShippingReceiving : BaseClass
    {
        public int SrvId { get; set; }
        /// <summary>
        /// is receive
        /// </summary>
        public bool SrvIsRev { get; set; }
        public DateTime SrvTime { get; set; }
        public string SrvCode { get; set; }
        public string SrvDescription { get; set; }
        public int UsrCreatorId { get; set; }
        public decimal? SrvTotalQuantity { get; set; }
        public decimal? SrvTotalReal { get; set; }
        public bool SrvIsLend { get; set; }
        public DateTime? SrvDLendReturnPre { get; set; }
        public bool? SrvIsReturnClient { get; set; }
        public DateTime? SrvDReturnClient { get; set; }
        public bool? SrvIsDestroy { get; set; }
        public DateTime? SrvDDestroy { get; set; }
        public bool? SrvIsReturnSupplier { get; set; }
        public DateTime? SrvDReturnSupplier { get; set; }
        public bool? SrvIsDamaged { get; set; }
        public DateTime? SrvDDamaged { get; set; }
        public string SrvClient { get; set; }
        public User Creator { get; set; }
        //public int WhsId { get; set; }

        // for create directly
        public int? PitId { get; set; }
        // for create directly
        public int InvId { get; set; }
        // for create directly
        public string PrdName { get; set; }
        // for search
        public string WareHouse { get; set; }

        public bool SrvValid { get; set; }

        public List<ShippingReceivingLine> SrlLines { get; set; }
    }

    public class ShippingReceivingLine : BaseClass
    {
        public int SrlId { get; set; }
        public int SrvId { get; set; }
        public int LglId { get; set; }
        public int DflId { get; set; }
        public decimal? SrlQuantity { get; set; }
        public decimal SrlUnitPrice { get; set; }
        public decimal SrlTotalPrice { get; set; }
        public int PrdId { get; set; }
        public int PitId { get; set; }
        public string SrlPrdRef { get; set; }
        public string SrlPrdName { get; set; }
        public string SrlPrdDes { get; set; }
        public string SrlDescription { get; set; }
        public decimal? SrlQuantityReal { get; set; }
        public decimal? SrlTotalPriceReal { get; set; }

        // for create directly
        public int WhsId { get; set; }
        // for create directly
        public int SheId { get; set; }
        // for create directly
        public int PshId { get; set; }
        // for create directly
        public int InvId { get; set; }

        public int LgsId { get; set; }
        public string LgsCode { get; set; }
        public int DfoId { get; set; }
        public decimal? QuantityForLgl { get; set; }
        public decimal? SolQuantity { get; set; }
        public string LgsFId { get; set; }
        public string DfoFId { get; set; }
        public string WhsCode { get; set; }
        public string SheCode { get; set; }
        public int SodId { get; set; }
        public string SodFId { get; set; }
        public string SodCode { get; set; }
        public int SolId { get; set; }

    }

    public class PreShippingReceivingLine : BaseClass
    {
        public int Id { get; set; }
        public int ColId { get; set; }
        public int LglId { get; set; }
        public DateTime DCreation { get; set; }
        public int Quantity { get; set; }
        public bool IsDone { get; set; }
        public DateTime? DDone { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class HeaderFooterText
    {
        public int Id { get; set; }
        public string CostPlanHeader { get; set; }
        public string CostPlanFooter { get; set; }
        /// <summary>
        /// client order, delivery form etc.,
        /// </summary>
        public string OtherHeader { get; set; }
        public string OtherFooter { get; set; }

        public string DeliveryFooterCondition { get; set; }
        public string DeliveryFooterLaw { get; set; }

        public string ClientInvoicePenality { get; set; }
        public string ClientInvoiceDiscountForPrepayment { get; set; }

        public string ClinetInvoiceEmail { get; set; }

        public string CurUserEmail { get; set; }
    }
}

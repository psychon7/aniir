using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class Project : BaseClass
    {
        public int PrjId { get; set; }
        public string PrjCode { get; set; }
        public string PrjName { get; set; }
        public DateTime PrjDCreation { get; set; }
        public DateTime? PrjDUpdate { get; set; }
        public int CliId { get; set; }
        public string CliFId { get; set; }
        public string ClientCompanyName { get; set; }
        public int PcoId { get; set; }
        public KeyValue PaymentCondition { get; set; }
        public int PmoId { get; set; }
        public KeyValue PaymentMode { get; set; }
        public int VatId { get; set; }
        public int SocId { get; set; }
        public string PrjHeaderText { get; set; }
        public string PrjFooterText { get; set; }
        public string PrjClientComment { get; set; }
        public string PrjInterComment { get; set; }
        public int UsrCreatorId { get; set; }

        public string _dCreationString { get; set; }
        public string _dUpdateString { get; set; }
        /// <summary>
        /// 计算facture
        /// </summary>
        public decimal? PrdInvoicedAmount { get; set; }
    }
}

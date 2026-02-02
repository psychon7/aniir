using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Permissions;
using System.Text;

namespace ERP.Entities
{
    public class DeliveryForm : BaseClass
    {
        public int DfoId { get; set; }
        public int SocId { get; set; }
        public string DfoCode { get; set; }
        public DateTime DfoDCreation { get; set; }
        public DateTime DfoDUpdate { get; set; }
        public DateTime DfoDDelivery { get; set; }
        public string _DfoDDelivery { get; set; }
        public int CliId { get; set; }
        public string ClientCompanyName { get; set; }
        public string CliFId { get; set; }
        public int PrjId { get; set; }
        public string PrjFId { get; set; }
        public string DfoHeaderText { get; set; }
        public string DfoFooterText { get; set; }
        //public int CcoIdDelivery { get; set; }
        public string DfoDeliveryComment { get; set; }
        public string DfoInterComment { get; set; }
        public int UsrCreatorId { get; set; }
        public User Creator { get; set; }
        public int CodId { get; set; }
        public string CodFId { get; set; }
        public string Dlv_CcoFirstname { get; set; }
        public string Dlv_CcoLastname { get; set; }
        public string Dlv_CcoAddress1 { get; set; }
        public string Dlv_CcoAddress2 { get; set; }
        public string Dlv_CcoPostcode { get; set; }
        public string Dlv_CcoCity { get; set; }
        public string Dlv_CcoCountry { get; set; }
        public string Dlv_CcoTel1 { get; set; }
        public string Dlv_CcoFax { get; set; }
        public string Dlv_CcoCellphone { get; set; }
        public string Dlv_CcoEmail { get; set; }
        //public string Dlv_CcoRef { get; set; }
        //public string Dlv_Civility { get; set; }
        public string DfoFile { get; set; }
        public bool DfoDeliveried { get; set; }



        public string _DfoDCreation { get; set; }
        public string _DfoDUpdate { get; set; }

        #region For Display

        public string CodCode { get; set; }
        public string CodName { get; set; }
        public string PrjName { get; set; }

        #endregion For Display

        #region for Search

        public string PrjCode { get; set; }
        public string CplName { get; set; }
        public string CplCode { get; set; }

        #endregion for Search

        public List<DeliveryFormLine> DeliveryFormLines { get; set; }

        /// <summary>
        /// 如果已经开具了发票，此为true
        /// </summary>
        public bool HasClientInvoice { get; set; }

        public int CinId { get; set; }
        public string CinFId { get; set; }
        public string CinCode { get; set; }
        public string CinName { get; set; }


        /// <summary>
        /// 2018-04-05 如果同一个Client Order 已经有发票了，这一项是true，否则是false
        /// </summary>
        public bool CodInvoiced { get; set; }

        /// <summary>
        /// 2018-04-05 client order 全部都派送了
        /// </summary>
        public bool CodAllDeliveried { get; set; }

        /// <summary>
        /// 送货地址是否和client的地址一样
        /// </summary>
        public bool? DfoClientAdr { get; set; }

        public Client OneClient { get; set; }
        /// <summary>
        /// 20181217 是否含有delivery line
        /// </summary>
        public bool HasDfl { get; set; }
        /// <summary>
        /// 20220527 client abbreviation
        /// </summary>
        public string CliAbbr { get; set; }
        /// <summary>
        /// 20231125 插入xml 用于导入 Suivi Admin
        /// </summary>
        public string DfoImportField { get; set; }

        public int? DfoGdocNb { get; set; }
        
        /// <summary>
        /// 20241208 Contact client for delivery form page
        /// </summary>
        public List<ContactClient> CcoListForDfo { get; set; }
    }

    public class ClientForDfo : BaseClass
    {
        public string CliFId { get; set; }
        public int CliId { get; set; }
        public string ClientCompanyName { get; set; }
        public List<ClientOrder> ClientOrderList { get; set; }
        //public List<KeyValue> ClientOrderLinesList { get; set; }
        public Client OneClient { get; set; }
    }
}

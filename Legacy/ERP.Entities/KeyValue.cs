using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    [Serializable]
    public class KeyValue
    {
        public int Key { get; set; }
        public string Value { get; set; }
        //public int Key2 { get; set; }
        public decimal Key2 { get; set; }
        public string Value2 { get; set; }
        public DateTime DValue { get; set; }
        public DateTime DValue2 { get; set; }
        public DateTime? DValue3 { get; set; }
        public decimal DcValue { get; set; }
        public decimal DcValue2 { get; set; }
        public decimal DcValue3 { get; set; }
        public decimal DcValue4 { get; set; }
        public bool Actived { get; set; }
        //public int Key3 { get; set; }
        public decimal Key3 { get; set; }
        public string Value3 { get; set; }
        public int Key4 { get; set; }
        public string Value4 { get; set; }
        public string KeyStr1 { get; set; }
        public string KeyStr2 { get; set; }

        public string ValuePCO
        {
            get
            {
                return string.Format("{0}#{1}#{2}#{3}", Key, Key2, Key3, Key4);
            }
        }

        public string ValueWithDecimal
        {
            get { return string.Format("{0} | {1:n2} €", Value, DcValue); }
        }
    }

    [Serializable]
    public class KeyValueSimple
    {
        public int Key { get; set; }
        public string Value { get; set; }
        public int Key2 { get; set; }
        public string Value2 { get; set; }
        public decimal DcValue { get; set; }
        public decimal DcValue2 { get; set; }
        public bool Actived { get; set; }
    }
    
    [Serializable]
    public class Currencies
    {
        public string Name { get; set; }
        /// <summary>
        /// 现汇买入价
        /// </summary>
        public decimal BuyingRate { get; set; }
        /// <summary>
        /// 现汇卖出价
        /// </summary>
        public decimal SellingRate { get; set; }
        /// <summary>
        /// 现钞买入价
        /// </summary>
        public decimal CashBuyingRate { get; set; }
        /// <summary>
        /// 现钞卖出价
        /// </summary>
        public decimal CashSellingRate { get; set; }
        /// <summary>
        /// 折算价
        /// </summary>
        public decimal MiddleRate { get; set; }
        /// <summary>
        /// 更新时间
        /// </summary>
        public DateTime UpdateTime { get; set; }
    }
}

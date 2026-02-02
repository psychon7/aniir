using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace ERP.Entities
{
    [Serializable]
    public class PropertyValue
    {
        /// <summary>
        /// GUID
        /// </summary>
        public string PropGuid { get; set; }
        public string PropName { get; set; }
        public string PropValue { get; set; }
        /// <summary>
        /// 这个是主顺序，主顺序是没有重复项的，按照顺序来排列，相当于Id
        /// </summary>
        public int PropOrder { get; set; }
        /// <summary>
        /// 这个是父顺序，如果父顺序和主顺序一样，说明这一条是标题条
        /// </summary>
        public int PropParentOrder { get; set; }
        /// <summary>
        /// 这个是子顺序，即在一个项目内的顺序，这个是显示顺序，条目内的顺序通过小数点来排列，如2， 2.1，2.2 等
        /// </summary>
        public decimal PropSubOrder { get; set; }
        public string PropUnit { get; set; }
        public string PropDescription { get; set; }
        /// <summary>
        /// 1:String; 2:Int; 3:Decimal; 4:DateTime; 5:Boolean
        /// </summary>
        public string PropType { get; set; }
        public List<PropertyValue> SubPropValues { get; set; }
        public List<PropertyYValue> SubYPropValues { get; set; }
        /// <summary>
        /// 是否只显示标题，不显示value
        /// </summary>
        public bool PropIsTitle { get; set; }
        /// <summary>
        /// 是否出现在 Fiche Technique 中
        /// </summary>
        public bool PropIsInTechReport { get; set; }
        /// <summary>
        /// Value 是否是图片
        /// </summary>
        public bool PropIsImage { get; set; }
        /// <summary>
        /// 如果有单位，单位显示在左边还是右边
        /// </summary>
        public bool PropIsUnitRightSide { get; set; }
        /// <summary>
        /// if true，所有的商品的此属性都是一致的，否则，每个商品的该属性，可以在商品页面单独设置
        /// </summary>
        public bool PropIsSameValue { get; set; }
        /// <summary>
        /// 该项是否可为空
        /// </summary>
        public bool PropIsNullable { get; set; }
        /// <summary>
        /// 用于 search 页面
        /// </summary>
        public bool PropIsSearchField { get; set; }

        /// <summary>
        /// 用于商品价格的属性， 如Warranty, IP 等 2018-05-13
        /// </summary>
        public bool PropIsForPrice { get; set; }
    }

    public class PropertyYValue : PropertyValue
    {
        public string PropXGuid { get; set; }
        public string PropXName { get; set; }
        public string PropYGuid { get; set; }
        public int PropSubOrderY { get; set; }
    }
    [Serializable]
    public class PropertyMatrix
    {
        public string PropGuid { get; set; }
        public List<string> ListYGuids { get; set; }
    }
}

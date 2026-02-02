using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace ERP.Entities
{
    public class ProductTypeMatrix : BaseClass
    {
        public int PtmId { get; set; }
        public int PtyId { get; set; }
        /// <summary>
        /// 这里存储的是X轴的值
        /// </summary>
        public string PtmRangeX { get; set; }
        /// <summary>
        /// 这里是对应的X轴的值
        /// </summary>
        public List<PropertyValue> XPropertyNames { get; set; }
        /// <summary>
        /// Y轴只存储名称，序号和备注
        /// </summary>
        public string PtmRangeY { get; set; }
        /// <summary>
        /// 这里是对应的Y轴的值
        /// </summary>
        public List<PropertyValue> YPropertyNames { get; set; }
        /// <summary>
        /// Z轴存储需要赋值的变量的名字，这个轴将要显示在product页面，并且接受复制
        /// </summary>
        public string PtmRangeZ { get; set; }
        /// <summary>
        /// 这里是对应的Z轴的值
        /// </summary>
        public List<PropertyValue> ZPropertyNames { get; set; }
        public string PtmMatrix { get; set; }
    }
}

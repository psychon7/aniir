using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace ERP.Entities
{
    public class ProductType : BaseClass
    {
        public int PtyId { get; set; }
        //public string FId { get; set; }
        public int SocId { get; set; }
        public string PtyName { get; set; }
        public string PtyDescription { get; set; }
        public bool PtyActived { get; set; }
        public string PtyStandards { get; set; }

        public List<PropertyValue> PropertyNames { get; set; }
        public List<PropertyValue> PropertyXNames { get; set; }
        public List<PropertyValue> PropertyYNames { get; set; }
        public List<PropertyValue> PropertyZNames { get; set; }
        //public PropertyList PropertyNames2Treate { get; set; }

        public int? CorId { get; set; }
    }
    //[XmlRoot("PropertyList")]
    //public class PropertyList : List<PropertyValue> { }
}

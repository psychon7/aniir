using System;

namespace ERP.Entities
{
    /// <summary>
    /// Country entity model for TR_COU_Country table
    /// Used for geographic reference data
    /// </summary>
    [Serializable]
    public class Country : BaseClass
    {
        /// <summary>
        /// Country ID (cou_id)
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Country name (cou_name)
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Country code (cou_code) - e.g., "FR", "DE"
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// ISO country code (cou_iso_code) - e.g., "FRA", "DEU"
        /// </summary>
        public string IsoCode { get; set; }
    }
}

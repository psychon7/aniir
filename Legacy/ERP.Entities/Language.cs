using System;

namespace ERP.Entities
{
    /// <summary>
    /// Language entity model for TR_LAN_Language table
    /// Used for language reference data
    /// </summary>
    [Serializable]
    public class Language : BaseClass
    {
        /// <summary>
        /// Language ID (lan_id)
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Language label/name (lan_label) - e.g., "English", "French", "German"
        /// </summary>
        public string Label { get; set; }

        /// <summary>
        /// Language short label/code (lan_short_label) - e.g., "EN", "FR", "DE"
        /// </summary>
        public string ShortLabel { get; set; }
    }
}

using System;

namespace ERP.Entities
{
    /// <summary>
    /// Carrier entity model for TR_CAR_Carrier table
    /// Used for shipping/transport carrier reference data
    /// </summary>
    [Serializable]
    public class Carrier : BaseClass
    {
        /// <summary>
        /// Carrier ID (car_id)
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Carrier name (car_name) - e.g., "FedEx", "UPS", "DHL"
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Carrier code (car_code) - short code for the carrier
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// Carrier contact phone (car_phone)
        /// </summary>
        public string Phone { get; set; }

        /// <summary>
        /// Carrier contact email (car_email)
        /// </summary>
        public string Email { get; set; }

        /// <summary>
        /// Carrier website URL (car_website)
        /// </summary>
        public string Website { get; set; }

        /// <summary>
        /// Tracking URL template (car_tracking_url) - use {tracking_number} as placeholder
        /// </summary>
        public string TrackingUrl { get; set; }

        /// <summary>
        /// Whether the carrier is active (car_is_active)
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// Society/Company ID (soc_id) for multi-tenant support
        /// </summary>
        public int SocId { get; set; }
    }
}

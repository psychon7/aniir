using System;

namespace ERP.Entities
{
    /// <summary>
    /// Entity for storing Shopify integration credentials and metadata
    /// </summary>
    [Serializable]
    public class ShopifyIntegration : BaseClass
    {
        /// <summary>
        /// Primary key
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// The user who created/authorized this integration
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// The society (company) this integration belongs to
        /// </summary>
        public int SocietyId { get; set; }

        /// <summary>
        /// The Shopify store domain (e.g., mystore.myshopify.com)
        /// </summary>
        public string Shop { get; set; }

        /// <summary>
        /// The encrypted access token from Shopify
        /// </summary>
        public string AccessToken { get; set; }

        /// <summary>
        /// The granted OAuth scopes
        /// </summary>
        public string Scope { get; set; }

        /// <summary>
        /// Whether this integration is currently active
        /// </summary>
        public bool IsActive { get; set; }

        /// <summary>
        /// When the integration was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// When the integration was last updated
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// When the integration was last used for API calls
        /// </summary>
        public DateTime? LastUsedAt { get; set; }

        /// <summary>
        /// The associated user entity
        /// </summary>
        public User User { get; set; }

        /// <summary>
        /// The associated society entity
        /// </summary>
        public Society Society { get; set; }
    }
}

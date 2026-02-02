using System;

namespace ERP.Web.Api.Models.Integrations
{
    /// <summary>
    /// Represents the callback parameters from Shopify OAuth flow
    /// </summary>
    public class ShopifyCallbackRequest
    {
        /// <summary>
        /// Authorization code to exchange for access token
        /// </summary>
        public string Code { get; set; }

        /// <summary>
        /// HMAC signature for verifying request authenticity
        /// </summary>
        public string Hmac { get; set; }

        /// <summary>
        /// Timestamp of the request
        /// </summary>
        public string Timestamp { get; set; }

        /// <summary>
        /// State parameter for CSRF protection (contains user/society context)
        /// </summary>
        public string State { get; set; }

        /// <summary>
        /// The Shopify store domain (e.g., mystore.myshopify.com)
        /// </summary>
        public string Shop { get; set; }

        /// <summary>
        /// Host parameter from Shopify
        /// </summary>
        public string Host { get; set; }
    }

    /// <summary>
    /// Response from Shopify access token exchange
    /// </summary>
    public class ShopifyAccessTokenResponse
    {
        /// <summary>
        /// The permanent access token
        /// </summary>
        public string AccessToken { get; set; }

        /// <summary>
        /// Token type (usually "bearer")
        /// </summary>
        public string TokenType { get; set; }

        /// <summary>
        /// Granted scopes
        /// </summary>
        public string Scope { get; set; }

        /// <summary>
        /// Associated user information (for online access mode)
        /// </summary>
        public ShopifyAssociatedUser AssociatedUser { get; set; }

        /// <summary>
        /// Expiration timestamp (for online access mode)
        /// </summary>
        public long? ExpiresIn { get; set; }
    }

    /// <summary>
    /// Associated user information for online access tokens
    /// </summary>
    public class ShopifyAssociatedUser
    {
        public long Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public bool EmailVerified { get; set; }
        public bool AccountOwner { get; set; }
        public string Locale { get; set; }
        public bool Collaborator { get; set; }
    }

    /// <summary>
    /// Request body for Shopify token exchange
    /// </summary>
    public class ShopifyTokenExchangeRequest
    {
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public string Code { get; set; }
    }

    /// <summary>
    /// Response returned to the client after successful OAuth callback
    /// </summary>
    public class ShopifyCallbackResponse
    {
        /// <summary>
        /// Whether the integration was successful
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// The Shopify store name/domain
        /// </summary>
        public string Shop { get; set; }

        /// <summary>
        /// The integration ID for reference
        /// </summary>
        public int IntegrationId { get; set; }

        /// <summary>
        /// Granted scopes
        /// </summary>
        public string Scope { get; set; }

        /// <summary>
        /// When the integration was created/updated
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }

    /// <summary>
    /// State parameter structure for OAuth flow
    /// </summary>
    public class ShopifyOAuthState
    {
        /// <summary>
        /// User ID initiating the OAuth flow
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Society ID for the integration
        /// </summary>
        public int SocietyId { get; set; }

        /// <summary>
        /// Random nonce for security
        /// </summary>
        public string Nonce { get; set; }

        /// <summary>
        /// Timestamp when the state was created
        /// </summary>
        public long CreatedAt { get; set; }

        /// <summary>
        /// Optional redirect URL after successful OAuth
        /// </summary>
        public string RedirectUrl { get; set; }
    }

    /// <summary>
    /// Response for initiating Shopify OAuth
    /// </summary>
    public class ShopifyOAuthInitResponse
    {
        /// <summary>
        /// The authorization URL to redirect the user to
        /// </summary>
        public string AuthorizationUrl { get; set; }

        /// <summary>
        /// The state parameter to verify on callback
        /// </summary>
        public string State { get; set; }
    }

    /// <summary>
    /// Request to initiate Shopify OAuth
    /// </summary>
    public class ShopifyOAuthInitRequest
    {
        /// <summary>
        /// The Shopify store domain (e.g., mystore.myshopify.com)
        /// </summary>
        public string Shop { get; set; }

        /// <summary>
        /// Optional redirect URL after successful OAuth
        /// </summary>
        public string RedirectUrl { get; set; }
    }

    /// <summary>
    /// Shopify integration status response
    /// </summary>
    public class ShopifyIntegrationStatusResponse
    {
        public int Id { get; set; }
        public string Shop { get; set; }
        public string Scope { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }
}

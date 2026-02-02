using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Newtonsoft.Json;
using ERP.Web.Api.Models.Integrations;

namespace ERP.Web.Services
{
    /// <summary>
    /// Service for handling Shopify OAuth integration
    /// </summary>
    public class ShopifyIntegrationService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _apiSecret;
        private readonly string _redirectUri;
        private readonly string _scopes;

        // In-memory storage for state validation (in production, use database or distributed cache)
        private static readonly Dictionary<string, ShopifyOAuthState> _stateStore = new Dictionary<string, ShopifyOAuthState>();
        private static readonly object _stateLock = new object();

        // In-memory storage for integrations (in production, use database)
        private static readonly Dictionary<string, ShopifyIntegrationRecord> _integrationStore = new Dictionary<string, ShopifyIntegrationRecord>();
        private static readonly object _integrationLock = new object();
        private static int _integrationIdCounter = 1;

        public ShopifyIntegrationService()
        {
            _httpClient = new HttpClient();
            _apiKey = ConfigurationManager.AppSettings["ShopifyApiKey"] ?? "";
            _apiSecret = ConfigurationManager.AppSettings["ShopifyApiSecret"] ?? "";
            _redirectUri = ConfigurationManager.AppSettings["ShopifyRedirectUri"] ?? "";
            _scopes = ConfigurationManager.AppSettings["ShopifyScopes"] ?? "read_products,read_orders";
        }

        /// <summary>
        /// Validates the HMAC signature from Shopify callback
        /// </summary>
        public bool VerifyHmac(string hmac, IDictionary<string, string> queryParams)
        {
            if (string.IsNullOrEmpty(_apiSecret))
            {
                System.Diagnostics.Debug.WriteLine("Shopify API Secret is not configured");
                return false;
            }

            // Create the message string from query parameters (excluding hmac)
            var sortedParams = queryParams
                .Where(kvp => kvp.Key != "hmac" && kvp.Key != "signature")
                .OrderBy(kvp => kvp.Key)
                .Select(kvp => $"{kvp.Key}={kvp.Value}");

            var message = string.Join("&", sortedParams);

            // Compute HMAC-SHA256
            using (var hmacsha256 = new HMACSHA256(Encoding.UTF8.GetBytes(_apiSecret)))
            {
                var hash = hmacsha256.ComputeHash(Encoding.UTF8.GetBytes(message));
                var computedHmac = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

                // Use constant-time comparison to prevent timing attacks
                return SecureCompare(computedHmac, hmac?.ToLowerInvariant() ?? "");
            }
        }

        /// <summary>
        /// Validates the shop domain format
        /// </summary>
        public bool ValidateShopDomain(string shop)
        {
            if (string.IsNullOrEmpty(shop))
                return false;

            // Shopify shop domains must match the pattern: {shop}.myshopify.com
            var regex = new System.Text.RegularExpressions.Regex(
                @"^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);

            return regex.IsMatch(shop);
        }

        /// <summary>
        /// Validates the state parameter for CSRF protection
        /// </summary>
        public bool ValidateState(string state, out ShopifyOAuthState stateData)
        {
            stateData = null;

            if (string.IsNullOrEmpty(state))
                return false;

            lock (_stateLock)
            {
                if (!_stateStore.TryGetValue(state, out stateData))
                    return false;

                // Remove the state after validation (one-time use)
                _stateStore.Remove(state);
            }

            // Check if state is expired (10 minutes validity)
            var stateTime = DateTimeOffset.FromUnixTimeSeconds(stateData.CreatedAt);
            if (DateTimeOffset.UtcNow - stateTime > TimeSpan.FromMinutes(10))
                return false;

            return true;
        }

        /// <summary>
        /// Generates a state parameter for OAuth flow
        /// </summary>
        public string GenerateState(int userId, int societyId, string redirectUrl = null)
        {
            var nonce = GenerateSecureNonce();
            var stateData = new ShopifyOAuthState
            {
                UserId = userId,
                SocietyId = societyId,
                Nonce = nonce,
                CreatedAt = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                RedirectUrl = redirectUrl
            };

            // Encode state as base64 JSON
            var stateJson = JsonConvert.SerializeObject(stateData);
            var stateEncoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(stateJson));

            lock (_stateLock)
            {
                _stateStore[stateEncoded] = stateData;
            }

            return stateEncoded;
        }

        /// <summary>
        /// Generates the Shopify authorization URL
        /// </summary>
        public string GenerateAuthorizationUrl(string shop, string state)
        {
            var sanitizedShop = shop.Replace("https://", "").Replace("http://", "").TrimEnd('/');

            var authUrl = $"https://{sanitizedShop}/admin/oauth/authorize?" +
                $"client_id={HttpUtility.UrlEncode(_apiKey)}&" +
                $"scope={HttpUtility.UrlEncode(_scopes)}&" +
                $"redirect_uri={HttpUtility.UrlEncode(_redirectUri)}&" +
                $"state={HttpUtility.UrlEncode(state)}";

            return authUrl;
        }

        /// <summary>
        /// Exchanges the authorization code for an access token
        /// </summary>
        public async Task<ShopifyAccessTokenResponse> ExchangeCodeForTokenAsync(string code, string shop)
        {
            var sanitizedShop = shop.Replace("https://", "").Replace("http://", "").TrimEnd('/');
            var tokenUrl = $"https://{sanitizedShop}/admin/oauth/access_token";

            var requestBody = new Dictionary<string, string>
            {
                { "client_id", _apiKey },
                { "client_secret", _apiSecret },
                { "code", code }
            };

            var content = new FormUrlEncodedContent(requestBody);

            try
            {
                var response = await _httpClient.PostAsync(tokenUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                System.Diagnostics.Debug.WriteLine($"Shopify token exchange response: {response.StatusCode} - {responseContent}");

                if (!response.IsSuccessStatusCode)
                {
                    throw new ShopifyIntegrationException(
                        $"Failed to exchange code for token: {response.StatusCode} - {responseContent}");
                }

                var tokenResponse = JsonConvert.DeserializeObject<dynamic>(responseContent);

                return new ShopifyAccessTokenResponse
                {
                    AccessToken = tokenResponse.access_token,
                    TokenType = "bearer",
                    Scope = tokenResponse.scope
                };
            }
            catch (HttpRequestException ex)
            {
                throw new ShopifyIntegrationException($"Network error during token exchange: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Stores the integration credentials (in production, encrypt and store in database)
        /// </summary>
        public ShopifyIntegrationRecord StoreIntegration(
            int userId,
            int societyId,
            string shop,
            string accessToken,
            string scope)
        {
            var key = $"{societyId}_{shop}";

            lock (_integrationLock)
            {
                ShopifyIntegrationRecord record;

                if (_integrationStore.TryGetValue(key, out record))
                {
                    // Update existing integration
                    record.AccessToken = accessToken;
                    record.Scope = scope;
                    record.UpdatedAt = DateTime.UtcNow;
                    record.IsActive = true;
                }
                else
                {
                    // Create new integration
                    record = new ShopifyIntegrationRecord
                    {
                        Id = _integrationIdCounter++,
                        UserId = userId,
                        SocietyId = societyId,
                        Shop = shop,
                        AccessToken = accessToken,
                        Scope = scope,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _integrationStore[key] = record;
                }

                return record;
            }
        }

        /// <summary>
        /// Gets an integration by society ID and shop
        /// </summary>
        public ShopifyIntegrationRecord GetIntegration(int societyId, string shop)
        {
            var key = $"{societyId}_{shop}";

            lock (_integrationLock)
            {
                _integrationStore.TryGetValue(key, out var record);
                return record;
            }
        }

        /// <summary>
        /// Gets all integrations for a society
        /// </summary>
        public IEnumerable<ShopifyIntegrationRecord> GetIntegrationsBySociety(int societyId)
        {
            lock (_integrationLock)
            {
                return _integrationStore.Values
                    .Where(r => r.SocietyId == societyId)
                    .ToList();
            }
        }

        /// <summary>
        /// Deactivates an integration
        /// </summary>
        public bool DeactivateIntegration(int societyId, string shop)
        {
            var key = $"{societyId}_{shop}";

            lock (_integrationLock)
            {
                if (_integrationStore.TryGetValue(key, out var record))
                {
                    record.IsActive = false;
                    record.UpdatedAt = DateTime.UtcNow;
                    return true;
                }
                return false;
            }
        }

        /// <summary>
        /// Generates a secure random nonce
        /// </summary>
        private string GenerateSecureNonce()
        {
            var bytes = new byte[32];
            using (var rng = new RNGCryptoServiceProvider())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes);
        }

        /// <summary>
        /// Constant-time string comparison to prevent timing attacks
        /// </summary>
        private bool SecureCompare(string a, string b)
        {
            if (a == null || b == null || a.Length != b.Length)
                return false;

            var result = 0;
            for (int i = 0; i < a.Length; i++)
            {
                result |= a[i] ^ b[i];
            }
            return result == 0;
        }
    }

    /// <summary>
    /// Record for storing Shopify integration data
    /// </summary>
    public class ShopifyIntegrationRecord
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int SocietyId { get; set; }
        public string Shop { get; set; }
        public string AccessToken { get; set; }
        public string Scope { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }

    /// <summary>
    /// Exception for Shopify integration errors
    /// </summary>
    public class ShopifyIntegrationException : Exception
    {
        public ShopifyIntegrationException(string message) : base(message) { }
        public ShopifyIntegrationException(string message, Exception inner) : base(message, inner) { }
    }
}

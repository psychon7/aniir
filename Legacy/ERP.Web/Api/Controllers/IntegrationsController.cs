using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using ERP.Web.Api.Filters;
using ERP.Web.Api.Helpers;
using ERP.Web.Api.Models.Integrations;
using ERP.Web.Services;

namespace ERP.Web.Api.Controllers
{
    /// <summary>
    /// Controller for managing third-party integrations
    /// </summary>
    [RoutePrefix("api/v1/integrations")]
    public class IntegrationsController : BaseApiController
    {
        private readonly ShopifyIntegrationService _shopifyService;

        public IntegrationsController()
        {
            _shopifyService = new ShopifyIntegrationService();
        }

        /// <summary>
        /// Initiates Shopify OAuth flow
        /// </summary>
        /// <param name="request">The shop domain and optional redirect URL</param>
        /// <returns>Authorization URL to redirect user to</returns>
        [HttpPost]
        [Route("shopify/init")]
        [JwtAuthFilter]
        public IHttpActionResult InitShopifyOAuth([FromBody] ShopifyOAuthInitRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Shop))
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Shop domain is required"));
            }

            try
            {
                // Validate shop domain format
                if (!_shopifyService.ValidateShopDomain(request.Shop))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Invalid Shopify shop domain. Must be in format: yourstore.myshopify.com"));
                }

                var userId = GetCurrentUserId();
                var societyId = GetCurrentSocietyId();

                // Generate state parameter for CSRF protection
                var state = _shopifyService.GenerateState(userId, societyId, request.RedirectUrl);

                // Generate authorization URL
                var authUrl = _shopifyService.GenerateAuthorizationUrl(request.Shop, state);

                var response = new ShopifyOAuthInitResponse
                {
                    AuthorizationUrl = authUrl,
                    State = state
                };

                return Ok(ApiResponseHelper.CreateSuccessResponse(response, "Redirect user to authorization URL"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Shopify OAuth init error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to initiate Shopify OAuth", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Handles the Shopify OAuth callback - exchanges code for access token
        /// </summary>
        /// <param name="code">Authorization code from Shopify</param>
        /// <param name="hmac">HMAC signature for verification</param>
        /// <param name="timestamp">Request timestamp</param>
        /// <param name="state">State parameter for CSRF protection</param>
        /// <param name="shop">Shopify store domain</param>
        /// <param name="host">Shopify host parameter</param>
        /// <returns>Integration result or redirect</returns>
        [HttpGet]
        [Route("shopify/callback")]
        [AllowAnonymous]
        public async Task<IHttpActionResult> ShopifyCallback(
            [FromUri] string code = null,
            [FromUri] string hmac = null,
            [FromUri] string timestamp = null,
            [FromUri] string state = null,
            [FromUri] string shop = null,
            [FromUri] string host = null)
        {
            System.Diagnostics.Debug.WriteLine($"Shopify callback received: shop={shop}, state={state}, code={code?.Substring(0, Math.Min(10, code?.Length ?? 0))}...");

            try
            {
                // Validate required parameters
                if (string.IsNullOrEmpty(code))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Authorization code is required"));
                }

                if (string.IsNullOrEmpty(shop))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Shop parameter is required"));
                }

                if (string.IsNullOrEmpty(state))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("State parameter is required"));
                }

                // Validate shop domain format
                if (!_shopifyService.ValidateShopDomain(shop))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Invalid shop domain format"));
                }

                // Verify HMAC signature if provided
                if (!string.IsNullOrEmpty(hmac))
                {
                    var queryParams = new Dictionary<string, string>
                    {
                        { "code", code },
                        { "shop", shop },
                        { "state", state },
                        { "timestamp", timestamp ?? "" }
                    };

                    if (!string.IsNullOrEmpty(host))
                    {
                        queryParams["host"] = host;
                    }

                    if (!_shopifyService.VerifyHmac(hmac, queryParams))
                    {
                        System.Diagnostics.Debug.WriteLine("HMAC verification failed");
                        return Content(HttpStatusCode.Unauthorized,
                            ApiResponseHelper.CreateErrorResponse("HMAC verification failed", HttpStatusCode.Unauthorized));
                    }
                }

                // Validate state parameter
                ShopifyOAuthState stateData;
                if (!_shopifyService.ValidateState(state, out stateData))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Invalid or expired state parameter"));
                }

                // Exchange authorization code for access token
                var tokenResponse = await _shopifyService.ExchangeCodeForTokenAsync(code, shop);

                if (string.IsNullOrEmpty(tokenResponse.AccessToken))
                {
                    return Content(HttpStatusCode.BadGateway,
                        ApiResponseHelper.CreateErrorResponse("Failed to obtain access token from Shopify"));
                }

                // Store the integration
                var integration = _shopifyService.StoreIntegration(
                    stateData.UserId,
                    stateData.SocietyId,
                    shop,
                    tokenResponse.AccessToken,
                    tokenResponse.Scope);

                System.Diagnostics.Debug.WriteLine($"Shopify integration stored: ID={integration.Id}, Shop={shop}");

                // Check if we should redirect or return JSON
                if (!string.IsNullOrEmpty(stateData.RedirectUrl))
                {
                    // Redirect to the specified URL with success parameter
                    var redirectUrl = stateData.RedirectUrl;
                    var separator = redirectUrl.Contains("?") ? "&" : "?";
                    redirectUrl += $"{separator}shopify_integration=success&shop={HttpUtility.UrlEncode(shop)}&integration_id={integration.Id}";

                    return Redirect(redirectUrl);
                }

                // Return JSON response
                var response = new ShopifyCallbackResponse
                {
                    Success = true,
                    Shop = shop,
                    IntegrationId = integration.Id,
                    Scope = tokenResponse.Scope,
                    CreatedAt = integration.CreatedAt
                };

                return Ok(ApiResponseHelper.CreateSuccessResponse(response, "Shopify integration successful"));
            }
            catch (ShopifyIntegrationException ex)
            {
                System.Diagnostics.Debug.WriteLine($"Shopify integration error: {ex.Message}");
                return Content(HttpStatusCode.BadGateway,
                    ApiResponseHelper.CreateErrorResponse($"Shopify integration failed: {ex.Message}"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Shopify callback error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("An error occurred processing the Shopify callback", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Gets the status of Shopify integrations for the current society
        /// </summary>
        [HttpGet]
        [Route("shopify/status")]
        [JwtAuthFilter]
        public IHttpActionResult GetShopifyIntegrationStatus()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var integrations = _shopifyService.GetIntegrationsBySociety(societyId);

                var response = integrations.Select(i => new ShopifyIntegrationStatusResponse
                {
                    Id = i.Id,
                    Shop = i.Shop,
                    Scope = i.Scope,
                    IsActive = i.IsActive,
                    CreatedAt = i.CreatedAt,
                    LastUsedAt = i.LastUsedAt
                }).ToList();

                return Ok(ApiResponseHelper.CreateSuccessResponse(response));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Get Shopify status error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve integration status", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Gets a specific Shopify integration by shop domain
        /// </summary>
        [HttpGet]
        [Route("shopify/status/{shop}")]
        [JwtAuthFilter]
        public IHttpActionResult GetShopifyIntegrationByShop(string shop)
        {
            try
            {
                if (string.IsNullOrEmpty(shop))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Shop domain is required"));
                }

                var societyId = GetCurrentSocietyId();
                var integration = _shopifyService.GetIntegration(societyId, shop);

                if (integration == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Integration not found", HttpStatusCode.NotFound));
                }

                var response = new ShopifyIntegrationStatusResponse
                {
                    Id = integration.Id,
                    Shop = integration.Shop,
                    Scope = integration.Scope,
                    IsActive = integration.IsActive,
                    CreatedAt = integration.CreatedAt,
                    LastUsedAt = integration.LastUsedAt
                };

                return Ok(ApiResponseHelper.CreateSuccessResponse(response));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Get Shopify integration error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve integration", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Deactivates a Shopify integration
        /// </summary>
        [HttpDelete]
        [Route("shopify/{shop}")]
        [JwtAuthFilter]
        public IHttpActionResult DeactivateShopifyIntegration(string shop)
        {
            try
            {
                if (string.IsNullOrEmpty(shop))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Shop domain is required"));
                }

                var societyId = GetCurrentSocietyId();
                var success = _shopifyService.DeactivateIntegration(societyId, shop);

                if (!success)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Integration not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Integration deactivated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Deactivate Shopify integration error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to deactivate integration", HttpStatusCode.InternalServerError));
            }
        }
    }
}

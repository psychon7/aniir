"""
Shopify Integration API Router.

Provides REST API endpoints for Shopify OAuth installation flow with HMAC verification.

Endpoints:
- GET /integrations/shopify/install - Redirect to Shopify OAuth authorization page
- GET /integrations/shopify/callback - Handle OAuth callback with HMAC verification
"""
import logging
import secrets
import time
import urllib.parse
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, Query, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from app.config import get_settings
from app.integrations.shopify.exceptions import (
    ShopifyConfigurationError,
    ShopifyHMACVerificationError,
    ShopifyOAuthError,
)
from app.integrations.shopify.hmac_verification import (
    verify_oauth_callback_request,
    validate_shop_domain as verify_shop_domain_format,
)

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/shopify", tags=["Shopify Integration"])


# ==========================================================================
# OAuth State Storage (In-memory - use Redis in production)
# ==========================================================================

class OAuthStateEntry(BaseModel):
    """OAuth state entry for CSRF protection."""
    nonce: str
    shop: str
    timestamp: int


# In-memory storage for OAuth state (replace with Redis in production)
_oauth_states: Dict[str, OAuthStateEntry] = {}

# OAuth state expiration time in seconds (5 minutes)
OAUTH_STATE_EXPIRATION_SECONDS = 300


def store_oauth_state(nonce: str, shop: str) -> None:
    """Store OAuth state for CSRF protection."""
    _oauth_states[nonce] = OAuthStateEntry(
        nonce=nonce,
        shop=shop,
        timestamp=int(time.time()),
    )
    # Clean up expired states
    _cleanup_expired_states()


def verify_oauth_state(nonce: str, shop: str) -> bool:
    """
    Verify OAuth state for CSRF protection.

    Args:
        nonce: The state value from the callback.
        shop: The shop domain from the callback.

    Returns:
        bool: True if state is valid and matches.
    """
    state = _oauth_states.get(nonce)
    if not state:
        logger.warning(f"OAuth state not found for nonce: {nonce[:8]}...")
        return False

    # Remove used state (single-use)
    del _oauth_states[nonce]

    # Check if state is for the correct shop
    if state.shop != shop:
        logger.warning(f"OAuth state shop mismatch: expected {state.shop}, got {shop}")
        return False

    # Check if state is not expired
    if time.time() - state.timestamp > OAUTH_STATE_EXPIRATION_SECONDS:
        logger.warning(f"OAuth state expired for shop: {shop}")
        return False

    return True


def _cleanup_expired_states() -> None:
    """Remove expired OAuth states from storage."""
    current_time = time.time()
    expired_keys = [
        key for key, state in _oauth_states.items()
        if current_time - state.timestamp > OAUTH_STATE_EXPIRATION_SECONDS
    ]
    for key in expired_keys:
        del _oauth_states[key]


# Default scopes for Shopify Admin API access
DEFAULT_SCOPES = [
    "read_products",
    "write_products",
    "read_orders",
    "write_orders",
    "read_customers",
    "write_customers",
    "read_inventory",
    "write_inventory",
    "read_fulfillments",
    "write_fulfillments",
]


# ==========================================================================
# Request/Response Schemas
# ==========================================================================

class ErrorDetail(BaseModel):
    """Error detail structure."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = Field(default=False, description="Success status")
    error: ErrorDetail = Field(..., description="Error details")


class InstallQueryParams(BaseModel):
    """Query parameters for install endpoint."""
    shop: str = Field(
        ...,
        description="The Shopify shop domain (e.g., mystore.myshopify.com)",
        json_schema_extra={"example": "mystore.myshopify.com"}
    )
    redirect_uri: Optional[str] = Field(
        default=None,
        description="Custom redirect URI after OAuth completion. If not provided, uses default callback URL.",
        json_schema_extra={"example": "https://yourapp.com/api/v1/integrations/shopify/callback"}
    )
    scopes: Optional[str] = Field(
        default=None,
        description="Comma-separated list of scopes. If not provided, uses default scopes.",
        json_schema_extra={"example": "read_products,write_products,read_orders"}
    )


class OAuthCallbackResponse(BaseModel):
    """Response after successful OAuth callback."""
    success: bool = Field(..., description="Whether the OAuth flow completed successfully")
    shop_domain: str = Field(..., description="The shop domain that was authorized")
    message: str = Field(..., description="Human-readable status message")
    access_token_stored: bool = Field(
        default=False,
        description="Whether the access token was successfully stored"
    )
    scopes_granted: Optional[List[str]] = Field(
        default=None,
        description="List of scopes granted by the shop owner"
    )


# ==========================================================================
# Helper Functions
# ==========================================================================

def validate_shop_domain(shop: str) -> str:
    """
    Validate and normalize Shopify shop domain.

    Args:
        shop: The shop domain to validate (e.g., 'mystore' or 'mystore.myshopify.com')

    Returns:
        Normalized shop domain (e.g., 'mystore.myshopify.com')

    Raises:
        HTTPException: If shop domain is invalid
    """
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_SHOP_DOMAIN",
                    "message": "Shop domain is required",
                    "details": None
                }
            }
        )

    # Normalize: remove protocol if present
    shop = shop.lower().strip()
    if shop.startswith("http://"):
        shop = shop[7:]
    elif shop.startswith("https://"):
        shop = shop[8:]

    # Remove trailing slash
    shop = shop.rstrip("/")

    # Add .myshopify.com if not present
    if not shop.endswith(".myshopify.com"):
        # Check if it looks like a full domain without myshopify.com
        if "." in shop:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_SHOP_DOMAIN",
                        "message": "Shop domain must be a valid .myshopify.com domain",
                        "details": {"provided_domain": shop}
                    }
                }
            )
        shop = f"{shop}.myshopify.com"

    # Validate format: should be store-name.myshopify.com
    parts = shop.split(".")
    if len(parts) != 3 or parts[1] != "myshopify" or parts[2] != "com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_SHOP_DOMAIN",
                    "message": "Shop domain must be in format: store-name.myshopify.com",
                    "details": {"provided_domain": shop}
                }
            }
        )

    # Validate store name part (alphanumeric and hyphens only)
    store_name = parts[0]
    if not store_name or not all(c.isalnum() or c == "-" for c in store_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_SHOP_DOMAIN",
                    "message": "Store name can only contain letters, numbers, and hyphens",
                    "details": {"store_name": store_name}
                }
            }
        )

    return shop


def generate_nonce(length: int = 32) -> str:
    """Generate a cryptographically secure random nonce for OAuth state."""
    return secrets.token_urlsafe(length)


def build_shopify_oauth_url(
    shop: str,
    api_key: str,
    scopes: List[str],
    redirect_uri: str,
    state: str,
) -> str:
    """
    Build the Shopify OAuth authorization URL.

    Args:
        shop: The normalized shop domain
        api_key: The Shopify API key
        scopes: List of requested permission scopes
        redirect_uri: The callback URL after authorization
        state: A random nonce for CSRF protection

    Returns:
        The complete OAuth authorization URL
    """
    params = {
        "client_id": api_key,
        "scope": ",".join(scopes),
        "redirect_uri": redirect_uri,
        "state": state,
    }

    query_string = urllib.parse.urlencode(params)
    return f"https://{shop}/admin/oauth/authorize?{query_string}"


# ==========================================================================
# Exception Handler
# ==========================================================================

def handle_shopify_error(error: ShopifyConfigurationError) -> HTTPException:
    """Convert ShopifyConfigurationError to appropriate HTTPException."""
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        }
    )


# ==========================================================================
# Shopify OAuth Endpoints
# ==========================================================================

@router.get(
    "/install",
    summary="Initiate Shopify OAuth installation",
    description="""
    Redirects to Shopify's OAuth authorization page to begin the app installation process.

    This endpoint:
    1. Validates the shop domain
    2. Generates a secure state nonce for CSRF protection
    3. Builds the OAuth authorization URL with requested scopes
    4. Redirects the user to Shopify to authorize the app

    After the user authorizes the app on Shopify, they will be redirected back
    to the callback URL with an authorization code that can be exchanged for
    an access token.

    **Required Query Parameters:**
    - `shop`: The Shopify store domain (e.g., `mystore.myshopify.com` or just `mystore`)

    **Optional Query Parameters:**
    - `redirect_uri`: Custom callback URL (defaults to app's configured callback)
    - `scopes`: Comma-separated list of scopes (defaults to standard read/write scopes)

    **Example:**
    ```
    GET /api/v1/integrations/shopify/install?shop=mystore.myshopify.com
    ```

    **Response:**
    - `302 Redirect` to Shopify OAuth authorization page
    - `400 Bad Request` if shop domain is invalid
    - `500 Internal Server Error` if API credentials are not configured
    """,
    response_class=RedirectResponse,
    status_code=302,
    responses={
        302: {
            "description": "Redirect to Shopify OAuth authorization page",
        },
        400: {
            "description": "Invalid shop domain",
            "model": ErrorResponse
        },
        500: {
            "description": "Shopify integration not configured",
            "model": ErrorResponse
        }
    }
)
async def install_shopify_app(
    shop: str = Query(
        ...,
        description="The Shopify shop domain (e.g., mystore.myshopify.com or mystore)",
        min_length=1,
        max_length=255,
    ),
    redirect_uri: Optional[str] = Query(
        default=None,
        description="Custom callback URL after OAuth authorization",
        max_length=2048,
    ),
    scopes: Optional[str] = Query(
        default=None,
        description="Comma-separated list of scopes to request",
        max_length=1024,
    ),
) -> RedirectResponse:
    """
    Initiate Shopify OAuth flow by redirecting to Shopify's authorization page.

    This is the entry point for installing the app on a Shopify store.
    The user will be redirected to Shopify to authorize the requested permissions,
    then redirected back to the callback URL with an authorization code.
    """
    settings = get_settings()

    # Validate that Shopify credentials are configured
    if not settings.SHOPIFY_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "SHOPIFY_NOT_CONFIGURED",
                    "message": "Shopify API key is not configured",
                    "details": {"missing_config": ["SHOPIFY_API_KEY"]}
                }
            }
        )

    # Validate and normalize shop domain
    normalized_shop = validate_shop_domain(shop)

    # Determine scopes to request
    if scopes:
        # Parse comma-separated scopes
        requested_scopes = [s.strip() for s in scopes.split(",") if s.strip()]
        if not requested_scopes:
            requested_scopes = DEFAULT_SCOPES
    else:
        requested_scopes = DEFAULT_SCOPES

    # Determine redirect URI
    if not redirect_uri:
        # Use configured callback URL or build from CORS origins
        if settings.SHOPIFY_OAUTH_CALLBACK_URL:
            redirect_uri = settings.SHOPIFY_OAUTH_CALLBACK_URL
        elif settings.CORS_ORIGINS:
            # Use the first CORS origin as the base URL
            base_url = settings.CORS_ORIGINS[0].rstrip("/")
            redirect_uri = f"{base_url}/api/v1/integrations/shopify/callback"
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "success": False,
                    "error": {
                        "code": "SHOPIFY_NOT_CONFIGURED",
                        "message": "Shopify OAuth callback URL is not configured. Set SHOPIFY_OAUTH_CALLBACK_URL or CORS_ORIGINS.",
                        "details": {"missing_config": ["SHOPIFY_OAUTH_CALLBACK_URL"]}
                    }
                }
            )

    # Generate secure state nonce for CSRF protection
    state = generate_nonce()

    # Store state for verification during callback (CSRF protection)
    store_oauth_state(nonce=state, shop=normalized_shop)
    logger.info(f"OAuth state stored for shop: {normalized_shop}")

    # Build OAuth authorization URL
    oauth_url = build_shopify_oauth_url(
        shop=normalized_shop,
        api_key=settings.SHOPIFY_API_KEY,
        scopes=requested_scopes,
        redirect_uri=redirect_uri,
        state=state,
    )

    # Redirect to Shopify OAuth page
    return RedirectResponse(url=oauth_url, status_code=302)


# ==========================================================================
# OAuth Callback Endpoint with HMAC Verification
# ==========================================================================

async def exchange_code_for_token(shop: str, code: str) -> Dict[str, Any]:
    """
    Exchange authorization code for access token.

    Args:
        shop: The shop domain.
        code: The authorization code from Shopify.

    Returns:
        Dict containing access_token and scope.

    Raises:
        ShopifyOAuthError: If token exchange fails.
    """
    settings = get_settings()

    if not settings.SHOPIFY_API_KEY or not settings.SHOPIFY_API_SECRET:
        raise ShopifyOAuthError(
            message="Missing Shopify API credentials for token exchange",
            shop_domain=shop,
        )

    token_url = f"https://{shop}/admin/oauth/access_token"

    payload = {
        "client_id": settings.SHOPIFY_API_KEY,
        "client_secret": settings.SHOPIFY_API_SECRET,
        "code": code,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(token_url, json=payload)

            if response.status_code != 200:
                error_data = response.json() if response.content else {}
                raise ShopifyOAuthError(
                    message=f"Token exchange failed with status {response.status_code}",
                    error_code=error_data.get("error"),
                    error_description=error_data.get("error_description"),
                    shop_domain=shop,
                )

            data = response.json()
            access_token = data.get("access_token")
            scope = data.get("scope", "")

            if not access_token:
                raise ShopifyOAuthError(
                    message="No access token in response",
                    shop_domain=shop,
                )

            return {
                "access_token": access_token,
                "scope": scope,
                "scopes_granted": scope.split(",") if scope else [],
            }

    except httpx.RequestError as e:
        raise ShopifyOAuthError(
            message=f"Network error during token exchange: {str(e)}",
            shop_domain=shop,
        )


@router.get(
    "/callback",
    response_model=OAuthCallbackResponse,
    summary="Handle OAuth callback with HMAC verification",
    description="""
    Handles the OAuth callback from Shopify after the user authorizes the app.

    This endpoint:
    1. **Verifies HMAC signature** - Ensures the request is authentic and from Shopify
    2. **Validates OAuth state** - Protects against CSRF attacks
    3. **Validates timestamp** - Prevents replay attacks (5-minute window)
    4. **Validates shop domain** - Ensures it's a valid .myshopify.com domain
    5. **Exchanges authorization code** - Gets the access token from Shopify
    6. **Stores the access token** - Saves for future API calls

    **Security Features:**
    - HMAC-SHA256 signature verification with constant-time comparison
    - OAuth state/nonce verification for CSRF protection
    - Timestamp validation to prevent replay attacks
    - Shop domain format validation

    **Query Parameters (sent by Shopify):**
    - `code`: Authorization code to exchange for access token
    - `hmac`: HMAC signature of all other parameters
    - `shop`: The shop domain (e.g., mystore.myshopify.com)
    - `state`: OAuth state for CSRF verification
    - `timestamp`: Request timestamp for replay attack prevention

    **Responses:**
    - `200 OK`: OAuth successful, access token obtained
    - `400 Bad Request`: Invalid state or missing parameters
    - `401 Unauthorized`: HMAC verification failed
    - `500 Internal Server Error`: Configuration error
    """,
    responses={
        200: {
            "description": "OAuth callback processed successfully",
            "model": OAuthCallbackResponse
        },
        400: {
            "description": "Invalid OAuth state or request parameters",
            "model": ErrorResponse
        },
        401: {
            "description": "HMAC verification failed - request may be tampered",
            "model": ErrorResponse
        },
        500: {
            "description": "Server configuration error",
            "model": ErrorResponse
        }
    }
)
async def oauth_callback(
    request: Request,
    code: Optional[str] = Query(
        default=None,
        description="Authorization code from Shopify"
    ),
    shop: str = Query(
        ...,
        description="Shop domain from Shopify",
        min_length=1,
        max_length=255,
    ),
    state: Optional[str] = Query(
        default=None,
        description="OAuth state for CSRF protection"
    ),
    timestamp: Optional[str] = Query(
        default=None,
        description="Request timestamp from Shopify"
    ),
    hmac: str = Query(
        ...,
        description="HMAC signature from Shopify"
    ),
) -> OAuthCallbackResponse:
    """
    Handle Shopify OAuth callback with HMAC verification.

    This endpoint is called by Shopify after the user authorizes the app.
    It verifies the request authenticity using HMAC-SHA256 signatures
    and exchanges the authorization code for an access token.
    """
    # Get all query parameters for HMAC verification
    query_params = dict(request.query_params)

    logger.info(
        f"OAuth callback received for shop: {shop}",
        extra={"shop_domain": shop, "has_code": bool(code)},
    )

    # Step 1: Verify HMAC signature (most important security check)
    try:
        verification_result = verify_oauth_callback_request(
            query_params=query_params,
            validate_shop=True,
        )

        logger.info(
            "HMAC verification successful for OAuth callback",
            extra={
                "shop_domain": shop,
                "verification_type": verification_result.verification_type.value,
                "timestamp": verification_result.timestamp,
            },
        )

    except ShopifyHMACVerificationError as e:
        logger.warning(
            f"HMAC verification failed for OAuth callback: {e.message}",
            extra={
                "shop_domain": shop,
                "error_code": e.code,
                "error_details": e.details,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "HMAC_VERIFICATION_FAILED",
                    "message": e.message,
                    "details": e.details
                }
            }
        )

    except ShopifyConfigurationError as e:
        logger.error(
            f"Configuration error during OAuth callback: {e.message}",
            extra={"error_code": e.code, "error_details": e.details},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "CONFIGURATION_ERROR",
                    "message": e.message,
                    "details": e.details
                }
            }
        )

    # Step 2: Verify OAuth state for CSRF protection
    if state:
        if not verify_oauth_state(state, shop):
            logger.warning(
                f"Invalid OAuth state for shop: {shop}",
                extra={"shop_domain": shop},
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_OAUTH_STATE",
                        "message": "Invalid or expired OAuth state. Please restart the installation process.",
                        "details": {"shop_domain": shop}
                    }
                }
            )
    else:
        # State is optional but recommended - log a warning
        logger.warning(
            f"OAuth callback received without state parameter for shop: {shop}",
            extra={"shop_domain": shop},
        )

    # Step 3: Exchange authorization code for access token
    if code:
        try:
            token_data = await exchange_code_for_token(shop, code)

            # TODO: Store access token in database for the shop
            # This would involve creating/updating a ShopifyStore record
            # with the access_token and scopes_granted
            logger.info(
                f"Successfully obtained access token for shop: {shop}",
                extra={
                    "shop_domain": shop,
                    "scopes_granted": token_data.get("scopes_granted", []),
                },
            )

            return OAuthCallbackResponse(
                success=True,
                shop_domain=shop,
                message="OAuth authorization successful. Access token obtained.",
                access_token_stored=True,
                scopes_granted=token_data.get("scopes_granted"),
            )

        except ShopifyOAuthError as e:
            logger.error(
                f"OAuth token exchange failed: {e.message}",
                extra={
                    "shop_domain": shop,
                    "error_code": e.code,
                    "error_details": e.details,
                },
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "TOKEN_EXCHANGE_FAILED",
                        "message": e.message,
                        "details": e.details
                    }
                }
            )

    # No authorization code - this might be a permission denied or error callback
    logger.warning(
        f"OAuth callback received without authorization code for shop: {shop}",
        extra={"shop_domain": shop},
    )

    return OAuthCallbackResponse(
        success=False,
        shop_domain=shop,
        message="OAuth callback received but no authorization code provided. The user may have denied the request.",
        access_token_stored=False,
    )


# ==========================================================================
# HMAC Verification Test Endpoint
# ==========================================================================

@router.get(
    "/verify-hmac",
    summary="Test HMAC verification",
    description="""
    Utility endpoint to test HMAC verification with provided parameters.

    This endpoint is useful for debugging and integration testing.
    It will verify the HMAC signature of the provided query parameters
    and return detailed verification results.
    """,
    responses={
        200: {
            "description": "Verification result",
        }
    }
)
async def verify_hmac_test(request: Request) -> Dict[str, Any]:
    """
    Test endpoint for HMAC verification.

    This endpoint allows testing HMAC verification without completing
    the full OAuth flow. Useful for debugging and integration testing.
    """
    query_params = dict(request.query_params)

    if not query_params.get("hmac"):
        return {
            "success": False,
            "message": "No 'hmac' parameter provided",
            "params_received": list(query_params.keys()),
            "hint": "Provide query parameters including 'hmac', 'shop', 'timestamp' to test verification",
        }

    try:
        result = verify_oauth_callback_request(
            query_params=query_params,
            validate_shop=True,
        )
        return {
            "success": True,
            "message": "HMAC verification successful",
            "verification_result": {
                "is_valid": result.is_valid,
                "verification_type": result.verification_type.value,
                "shop_domain": result.shop_domain,
                "timestamp": result.timestamp,
            },
        }

    except ShopifyHMACVerificationError as e:
        return {
            "success": False,
            "message": "HMAC verification failed",
            "error": {
                "code": e.code,
                "message": e.message,
                "details": e.details,
            },
        }

    except ShopifyConfigurationError as e:
        return {
            "success": False,
            "message": "Configuration error - SHOPIFY_API_SECRET is required",
            "error": {
                "code": e.code,
                "message": e.message,
                "details": e.details,
            },
        }

"""
Shopify OAuth API endpoints.

Handles Shopify OAuth 2.0 authorization flow:
1. /install - Initiates OAuth by redirecting to Shopify authorization
2. /callback - Handles OAuth callback with HMAC verification
3. /webhooks - Receives and validates Shopify webhook notifications

All endpoints implement HMAC signature verification for security.
"""
import logging
import secrets
from datetime import datetime
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Request, Query, Header, Response, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import get_db
from app.models.integrations.shopify import ShopifyIntegration
from app.integrations.shopify.hmac_verification import (
    verify_oauth_callback_request,
    verify_webhook_request,
    validate_shop_domain,
    VerificationResult,
)
from app.integrations.shopify.exceptions import (
    ShopifyHMACVerificationError,
    ShopifyOAuthError,
    ShopifyConfigurationError,
    ShopifyWebhookError,
)
from app.services.shopify_webhook_service import (
    ShopifyWebhookService,
    get_shopify_webhook_service,
)
from app.schemas.shopify import (
    OrderSyncRequest,
    OrderSyncResponse,
    OrderSyncStats,
    OrderSyncError,
    OrderSyncStatusResponse,
    InventorySyncRequest,
    InventorySyncResponse,
    InventorySyncStats,
    InventorySyncError,
    InventorySyncStatusResponse,
)
from app.models.integrations.shopify import ShopifySyncLog
from app.tasks.shopify_tasks import sync_orders as sync_orders_task, sync_inventory as sync_inventory_task

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shopify", tags=["Shopify OAuth"])


# ============================================================================
# Request/Response Models
# ============================================================================


class OAuthInstallRequest(BaseModel):
    """Request to initiate OAuth installation."""
    shop: str = Field(..., description="Shopify shop domain (e.g., mystore.myshopify.com)")
    redirect_uri: Optional[str] = Field(
        None,
        description="Optional override for OAuth redirect URI",
    )


class OAuthCallbackResponse(BaseModel):
    """Response after successful OAuth callback."""
    success: bool
    shop_domain: str
    message: str
    access_token_stored: bool = False
    integration_id: Optional[int] = None
    webhooks_registered: Optional[int] = None
    webhook_registration_errors: Optional[List[str]] = None


class WebhookResponse(BaseModel):
    """Response for webhook processing."""
    success: bool
    message: str


class ShopifyOAuthState(BaseModel):
    """OAuth state for CSRF protection."""
    nonce: str
    shop: str
    timestamp: int


# ============================================================================
# In-memory state storage (replace with Redis in production)
# ============================================================================

# Temporary storage for OAuth state/nonce values
# In production, use Redis or database with expiration
_oauth_states: Dict[str, ShopifyOAuthState] = {}


def generate_oauth_state(shop: str) -> str:
    """
    Generate a secure random state/nonce for OAuth CSRF protection.

    Args:
        shop: The shop domain initiating OAuth.

    Returns:
        str: The generated state nonce.
    """
    import time

    nonce = secrets.token_urlsafe(32)
    _oauth_states[nonce] = ShopifyOAuthState(
        nonce=nonce,
        shop=shop,
        timestamp=int(time.time()),
    )
    return nonce


def verify_oauth_state(nonce: str, shop: str) -> bool:
    """
    Verify OAuth state/nonce for CSRF protection.

    Args:
        nonce: The state value from the callback.
        shop: The shop domain from the callback.

    Returns:
        bool: True if state is valid and matches.
    """
    import time

    state = _oauth_states.get(nonce)
    if not state:
        return False

    # Remove used state
    del _oauth_states[nonce]

    # Check if state is for the correct shop
    if state.shop != shop:
        return False

    # Check if state is not too old (5 minutes max)
    if time.time() - state.timestamp > 300:
        return False

    return True


# ============================================================================
# OAuth Endpoints
# ============================================================================


@router.get(
    "/install",
    summary="Initiate Shopify OAuth",
    description="Redirects to Shopify authorization page to begin OAuth flow.",
)
async def oauth_install(
    shop: str = Query(..., description="Shopify shop domain"),
) -> RedirectResponse:
    """
    Initiate Shopify OAuth installation flow.

    This endpoint:
    1. Validates the shop domain format
    2. Generates a secure state nonce for CSRF protection
    3. Redirects to Shopify's authorization URL

    Args:
        shop: The Shopify shop domain (e.g., mystore.myshopify.com).

    Returns:
        RedirectResponse: Redirect to Shopify authorization page.

    Raises:
        HTTPException: If shop domain is invalid or configuration is missing.
    """
    settings = get_settings()

    # Validate shop domain format
    if not validate_shop_domain(shop):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid shop domain format: {shop}. Expected format: mystore.myshopify.com",
        )

    # Check required configuration
    if not settings.SHOPIFY_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Shopify OAuth not configured: missing SHOPIFY_API_KEY",
        )

    # Generate state for CSRF protection
    state = generate_oauth_state(shop)

    # Build authorization URL
    # Default scopes for ERP integration
    scopes = [
        "read_orders",
        "write_orders",
        "read_products",
        "write_products",
        "read_inventory",
        "write_inventory",
        "read_customers",
        "write_customers",
        "read_fulfillments",
        "write_fulfillments",
    ]

    # Build redirect URI (callback endpoint)
    # In production, this should be configurable
    redirect_uri = f"{settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else 'http://localhost:8000'}/api/v1/integrations/shopify/callback"

    auth_params = {
        "client_id": settings.SHOPIFY_API_KEY,
        "scope": ",".join(scopes),
        "redirect_uri": redirect_uri,
        "state": state,
    }

    auth_url = f"https://{shop}/admin/oauth/authorize?{urlencode(auth_params)}"

    logger.info(
        f"Initiating Shopify OAuth for shop: {shop}",
        extra={"shop_domain": shop},
    )

    return RedirectResponse(url=auth_url, status_code=302)


@router.get(
    "/callback",
    response_model=OAuthCallbackResponse,
    summary="Handle OAuth callback",
    description="Processes Shopify OAuth callback with HMAC verification.",
)
async def oauth_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
    code: Optional[str] = Query(None, description="Authorization code"),
    shop: str = Query(..., description="Shop domain"),
    state: Optional[str] = Query(None, description="OAuth state for CSRF protection"),
    timestamp: Optional[str] = Query(None, description="Request timestamp"),
    hmac: str = Query(..., description="HMAC signature"),
    society_id: Optional[int] = Query(None, description="Society ID for the integration"),
    user_id: Optional[int] = Query(None, description="User ID who initiated the connection"),
) -> OAuthCallbackResponse:
    """
    Handle Shopify OAuth callback.

    This endpoint:
    1. Verifies the HMAC signature to ensure request authenticity
    2. Validates the OAuth state for CSRF protection
    3. Exchanges the authorization code for an access token
    4. Stores the access token in the database
    5. Registers webhooks with Shopify

    Args:
        request: The FastAPI request object.
        db: Database session.
        code: The authorization code from Shopify.
        shop: The shop domain.
        state: The OAuth state for CSRF protection.
        timestamp: The request timestamp.
        hmac: The HMAC signature.
        society_id: Society ID for the integration.
        user_id: User ID who initiated the connection.

    Returns:
        OAuthCallbackResponse: Success response with shop details and webhook status.

    Raises:
        HTTPException: If HMAC verification fails or OAuth exchange fails.
    """
    settings = get_settings()

    # Get all query parameters for HMAC verification
    query_params = dict(request.query_params)

    try:
        # Verify HMAC signature
        verification_result = verify_oauth_callback_request(
            query_params=query_params,
            validate_shop=True,
        )

        logger.info(
            f"HMAC verification successful for OAuth callback",
            extra={
                "shop_domain": shop,
                "verification_result": verification_result.to_dict(),
            },
        )

    except ShopifyHMACVerificationError as e:
        logger.warning(
            f"HMAC verification failed for OAuth callback: {e.message}",
            extra={
                "shop_domain": shop,
                "error_details": e.to_dict(),
            },
        )
        raise HTTPException(
            status_code=401,
            detail=f"HMAC verification failed: {e.message}",
        )

    except ShopifyConfigurationError as e:
        logger.error(
            f"Shopify configuration error during OAuth callback: {e.message}",
            extra={"error_details": e.to_dict()},
        )
        raise HTTPException(
            status_code=500,
            detail=f"OAuth configuration error: {e.message}",
        )

    # Verify OAuth state for CSRF protection
    if state and not verify_oauth_state(state, shop):
        logger.warning(
            f"Invalid OAuth state for shop: {shop}",
            extra={"shop_domain": shop},
        )
        raise HTTPException(
            status_code=400,
            detail="Invalid OAuth state. Please restart the installation process.",
        )

    # If we have an authorization code, exchange it for an access token
    if code:
        try:
            access_token, scopes = await exchange_code_for_token(shop, code)

            # Store access token in database
            integration = await save_store_connection(
                db=db,
                shop_domain=shop,
                access_token=access_token,
                scopes=scopes,
                society_id=society_id,
                user_id=user_id,
            )

            logger.info(
                f"Successfully stored access token for shop: {shop}",
                extra={
                    "shop_domain": shop,
                    "integration_id": integration.shp_id,
                },
            )

            # Register webhooks after OAuth completion
            webhook_service = get_shopify_webhook_service(db)
            webhook_result = await webhook_service.register_webhooks_after_oauth(
                shop_domain=shop,
                access_token=access_token,
                integration_id=integration.shp_id,
            )

            # Extract webhook registration errors for response
            webhook_errors = [
                r["error"] for r in webhook_result.get("results", [])
                if not r["success"] and r.get("error")
            ]

            return OAuthCallbackResponse(
                success=True,
                shop_domain=shop,
                message="OAuth authorization successful. Access token stored and webhooks registered.",
                access_token_stored=True,
                integration_id=integration.shp_id,
                webhooks_registered=webhook_result.get("successful", 0),
                webhook_registration_errors=webhook_errors if webhook_errors else None,
            )

        except ShopifyOAuthError as e:
            logger.error(
                f"OAuth token exchange failed: {e.message}",
                extra={
                    "shop_domain": shop,
                    "error_details": e.to_dict(),
                },
            )
            raise HTTPException(
                status_code=400,
                detail=f"OAuth token exchange failed: {e.message}",
            )

        except Exception as e:
            logger.error(
                f"Error during OAuth callback processing: {str(e)}",
                extra={"shop_domain": shop},
                exc_info=True,
            )
            raise HTTPException(
                status_code=500,
                detail=f"Error processing OAuth callback: {str(e)}",
            )

    # No authorization code - this might be a permission denied or error callback
    return OAuthCallbackResponse(
        success=False,
        shop_domain=shop,
        message="OAuth callback received but no authorization code provided.",
        access_token_stored=False,
    )


async def exchange_code_for_token(shop: str, code: str) -> tuple[str, List[str]]:
    """
    Exchange authorization code for access token.

    Args:
        shop: The shop domain.
        code: The authorization code.

    Returns:
        tuple: (access_token, list of scopes)

    Raises:
        ShopifyOAuthError: If token exchange fails.
    """
    import httpx

    settings = get_settings()

    if not settings.SHOPIFY_API_KEY or not settings.SHOPIFY_API_SECRET:
        raise ShopifyOAuthError(
            message="Missing Shopify API credentials",
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
            scope_str = data.get("scope", "")

            if not access_token:
                raise ShopifyOAuthError(
                    message="No access token in response",
                    shop_domain=shop,
                )

            # Parse scopes from comma-separated string
            scopes = [s.strip() for s in scope_str.split(",") if s.strip()]

            return access_token, scopes

    except httpx.RequestError as e:
        raise ShopifyOAuthError(
            message=f"Network error during token exchange: {str(e)}",
            shop_domain=shop,
        )


async def save_store_connection(
    db: AsyncSession,
    shop_domain: str,
    access_token: str,
    scopes: List[str],
    society_id: Optional[int] = None,
    user_id: Optional[int] = None,
) -> ShopifyIntegration:
    """
    Save or update store connection in database.

    Args:
        db: Database session
        shop_domain: Normalized shop domain
        access_token: OAuth access token
        scopes: List of granted OAuth scopes
        society_id: Associated society ID
        user_id: User who connected the store

    Returns:
        ShopifyIntegration model instance
    """
    # Check if integration already exists
    stmt = select(ShopifyIntegration).where(
        ShopifyIntegration.shp_shop == shop_domain
    )
    if society_id:
        stmt = stmt.where(ShopifyIntegration.soc_id == society_id)

    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing integration
        existing.shp_access_token = access_token
        existing.shp_scope = ",".join(scopes)
        existing.shp_is_active = True
        existing.shp_updated_at = datetime.utcnow()
        if user_id:
            existing.usr_id = user_id

        await db.commit()
        await db.refresh(existing)

        logger.info(
            f"Updated existing Shopify integration for shop: {shop_domain}",
            extra={"integration_id": existing.shp_id},
        )

        return existing

    # Create new integration
    # Use default values if society_id or user_id not provided
    new_integration = ShopifyIntegration(
        soc_id=society_id or 1,  # Default to society 1 if not provided
        usr_id=user_id or 1,  # Default to user 1 if not provided
        shp_shop=shop_domain,
        shp_access_token=access_token,
        shp_scope=",".join(scopes),
        shp_is_active=True,
    )

    db.add(new_integration)
    await db.commit()
    await db.refresh(new_integration)

    logger.info(
        f"Created new Shopify integration for shop: {shop_domain}",
        extra={"integration_id": new_integration.shp_id},
    )

    return new_integration


# ============================================================================
# Webhook Endpoint
# ============================================================================


@router.post(
    "/webhooks/{topic}",
    response_model=WebhookResponse,
    summary="Receive Shopify webhooks",
    description="Processes Shopify webhooks with HMAC verification.",
)
async def receive_webhook(
    request: Request,
    topic: str,
    db: AsyncSession = Depends(get_db),
    x_shopify_hmac_sha256: str = Header(..., alias="X-Shopify-Hmac-SHA256"),
    x_shopify_shop_domain: Optional[str] = Header(None, alias="X-Shopify-Shop-Domain"),
    x_shopify_topic: Optional[str] = Header(None, alias="X-Shopify-Topic"),
    x_shopify_api_version: Optional[str] = Header(None, alias="X-Shopify-API-Version"),
    x_shopify_webhook_id: Optional[str] = Header(None, alias="X-Shopify-Webhook-Id"),
) -> WebhookResponse:
    """
    Receive and verify Shopify webhook notifications.

    This endpoint:
    1. Verifies the HMAC signature of the webhook payload
    2. Validates the shop domain
    3. Processes the webhook based on topic

    Supported topics:
    - orders/create, orders/updated, orders/paid, orders/fulfilled, orders/cancelled
    - products/create, products/update, products/delete
    - inventory_levels/update, inventory_levels/connect, inventory_levels/disconnect
    - customers/create, customers/update, customers/delete
    - app/uninstalled

    Args:
        request: The FastAPI request object.
        topic: The webhook topic from URL path.
        db: Database session.
        x_shopify_hmac_sha256: HMAC signature header.
        x_shopify_shop_domain: Shop domain header.
        x_shopify_topic: Webhook topic header.
        x_shopify_api_version: API version header.
        x_shopify_webhook_id: Webhook ID header.

    Returns:
        WebhookResponse: Acknowledgment response.

    Raises:
        HTTPException: If HMAC verification fails.
    """
    # Read raw body for HMAC verification
    body = await request.body()

    try:
        # Verify webhook HMAC signature
        verification_result = verify_webhook_request(
            payload=body,
            hmac_header=x_shopify_hmac_sha256,
            shop_domain_header=x_shopify_shop_domain,
            validate_shop=True,
        )

        logger.info(
            f"Webhook HMAC verification successful",
            extra={
                "topic": x_shopify_topic or topic,
                "shop_domain": x_shopify_shop_domain,
                "webhook_id": x_shopify_webhook_id,
                "api_version": x_shopify_api_version,
            },
        )

    except ShopifyHMACVerificationError as e:
        logger.warning(
            f"Webhook HMAC verification failed: {e.message}",
            extra={
                "topic": x_shopify_topic or topic,
                "shop_domain": x_shopify_shop_domain,
                "error_details": e.to_dict(),
            },
        )
        raise HTTPException(
            status_code=401,
            detail=f"Webhook HMAC verification failed: {e.message}",
        )

    except ShopifyConfigurationError as e:
        logger.error(
            f"Webhook configuration error: {e.message}",
            extra={"error_details": e.to_dict()},
        )
        raise HTTPException(
            status_code=500,
            detail=f"Webhook configuration error: {e.message}",
        )

    # Parse webhook payload
    import json
    try:
        payload = json.loads(body) if body else {}
    except json.JSONDecodeError:
        logger.error("Failed to parse webhook payload as JSON")
        raise HTTPException(
            status_code=400,
            detail="Invalid JSON payload",
        )

    # Process webhook based on topic
    webhook_topic = x_shopify_topic or topic
    # Convert URL path format back to Shopify format (e.g., "app-uninstalled" -> "app/uninstalled")
    normalized_topic = webhook_topic.replace("-", "/")

    logger.info(
        f"Processing webhook: {normalized_topic}",
        extra={
            "shop_domain": x_shopify_shop_domain,
            "webhook_id": x_shopify_webhook_id,
        },
    )

    # Handle app/uninstalled webhook
    if normalized_topic == "app/uninstalled":
        webhook_service = get_shopify_webhook_service(db)
        result = await webhook_service.handle_app_uninstalled(
            shop_domain=x_shopify_shop_domain,
        )

        logger.info(
            f"App uninstalled webhook processed for shop: {x_shopify_shop_domain}",
            extra=result,
        )

        return WebhookResponse(
            success=result.get("success", True),
            message=f"App uninstall processed for {x_shopify_shop_domain}",
        )

    # For other topics, acknowledge receipt
    # In production, you would queue these for async processing via Celery
    # and handle idempotency using webhook_id

    return WebhookResponse(
        success=True,
        message=f"Webhook {normalized_topic} received and verified successfully",
    )


# ============================================================================
# Utility Endpoints
# ============================================================================


@router.get(
    "/verify-hmac",
    summary="Test HMAC verification",
    description="Utility endpoint to test HMAC verification with provided parameters.",
)
async def verify_hmac_test(request: Request) -> Dict[str, Any]:
    """
    Test endpoint for HMAC verification.

    This endpoint allows testing HMAC verification without completing
    the full OAuth flow. Useful for debugging and integration testing.

    Args:
        request: The FastAPI request object with query parameters.

    Returns:
        Dict containing verification result details.
    """
    query_params = dict(request.query_params)

    if not query_params.get("hmac"):
        return {
            "success": False,
            "message": "No 'hmac' parameter provided",
            "params_received": list(query_params.keys()),
        }

    try:
        result = verify_oauth_callback_request(
            query_params=query_params,
            validate_shop=True,
        )
        return {
            "success": True,
            "verification_result": result.to_dict(),
        }

    except ShopifyHMACVerificationError as e:
        return {
            "success": False,
            "error": e.to_dict(),
        }

    except ShopifyConfigurationError as e:
        return {
            "success": False,
            "error": e.to_dict(),
            "message": "HMAC verification requires SHOPIFY_API_SECRET to be configured",
        }


class TokenVerificationResponse(BaseModel):
    """Response for token verification."""
    success: bool
    shop_domain: str
    is_valid: bool
    scopes: Optional[List[str]] = None
    shop_info: Optional[Dict[str, Any]] = None
    message: str


@router.get(
    "/verify-token/{shop_domain}",
    response_model=TokenVerificationResponse,
    summary="Verify OAuth token",
    description="Verifies that the stored OAuth token for a shop is still valid.",
)
async def verify_token(
    shop_domain: str,
    db: AsyncSession = Depends(get_db),
) -> TokenVerificationResponse:
    """
    Verify that a stored OAuth token is still valid.

    This endpoint:
    1. Retrieves the stored access token for the shop
    2. Makes a test API call to Shopify to verify the token
    3. Optionally updates stored shop metadata

    Args:
        shop_domain: The Shopify shop domain.
        db: Database session.

    Returns:
        TokenVerificationResponse with verification status.

    Raises:
        HTTPException: If shop is not found or verification fails.
    """
    import httpx

    settings = get_settings()

    # Get stored integration
    stmt = select(ShopifyIntegration).where(
        ShopifyIntegration.shp_shop == shop_domain
    )
    result = await db.execute(stmt)
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=404,
            detail=f"Shop '{shop_domain}' not found in connected stores",
        )

    if not integration.shp_is_active:
        return TokenVerificationResponse(
            success=True,
            shop_domain=shop_domain,
            is_valid=False,
            message="Store connection is inactive",
        )

    # Verify token by making a test API call
    try:
        url = f"https://{shop_domain}/admin/api/{settings.SHOPIFY_API_VERSION}/shop.json"

        async with httpx.AsyncClient(timeout=settings.SHOPIFY_REQUEST_TIMEOUT) as client:
            response = await client.get(
                url,
                headers={"X-Shopify-Access-Token": integration.shp_access_token},
            )

            if response.status_code == 200:
                shop_data = response.json().get("shop", {})

                # Update last used timestamp
                integration.shp_last_used_at = datetime.utcnow()
                await db.commit()

                return TokenVerificationResponse(
                    success=True,
                    shop_domain=shop_domain,
                    is_valid=True,
                    scopes=integration.scopes,
                    shop_info={
                        "name": shop_data.get("name"),
                        "email": shop_data.get("email"),
                        "currency": shop_data.get("currency"),
                        "timezone": shop_data.get("iana_timezone"),
                        "plan_name": shop_data.get("plan_name"),
                    },
                    message="Token is valid",
                )

            elif response.status_code == 401:
                # Token is invalid
                return TokenVerificationResponse(
                    success=True,
                    shop_domain=shop_domain,
                    is_valid=False,
                    message="Token is invalid or has been revoked",
                )

            else:
                return TokenVerificationResponse(
                    success=True,
                    shop_domain=shop_domain,
                    is_valid=False,
                    message=f"Unexpected response from Shopify: {response.status_code}",
                )

    except httpx.RequestError as e:
        logger.error(f"Network error during token verification: {e}")
        return TokenVerificationResponse(
            success=False,
            shop_domain=shop_domain,
            is_valid=False,
            message=f"Network error during verification: {str(e)}",
        )


@router.get(
    "/stores",
    summary="List connected stores",
    description="Lists all connected Shopify stores.",
)
async def list_stores(
    db: AsyncSession = Depends(get_db),
    active_only: bool = Query(True, description="Only return active stores"),
) -> Dict[str, Any]:
    """
    List all connected Shopify stores.

    Args:
        db: Database session.
        active_only: Filter to only active connections.

    Returns:
        List of connected stores with basic info.
    """
    stmt = select(ShopifyIntegration)

    if active_only:
        stmt = stmt.where(ShopifyIntegration.shp_is_active == True)

    result = await db.execute(stmt)
    stores = result.scalars().all()

    return {
        "success": True,
        "stores": [
            {
                "id": store.shp_id,
                "shop_domain": store.shp_shop,
                "is_active": store.shp_is_active,
                "scopes": store.scopes,
                "connected_at": store.shp_created_at.isoformat() if store.shp_created_at else None,
                "last_used_at": store.shp_last_used_at.isoformat() if store.shp_last_used_at else None,
            }
            for store in stores
        ],
        "total": len(stores),
    }


@router.delete(
    "/stores/{shop_domain}",
    summary="Disconnect a store",
    description="Disconnects a Shopify store by deactivating its connection.",
)
async def disconnect_store(
    shop_domain: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Disconnect a Shopify store.

    This deactivates the store connection but preserves the record.
    The token will no longer be used for API calls.

    Args:
        shop_domain: The shop domain to disconnect.
        db: Database session.

    Returns:
        Confirmation of disconnection.

    Raises:
        HTTPException: If shop is not found.
    """
    stmt = select(ShopifyIntegration).where(
        ShopifyIntegration.shp_shop == shop_domain
    )
    result = await db.execute(stmt)
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=404,
            detail=f"Shop '{shop_domain}' not found",
        )

    integration.shp_is_active = False
    integration.shp_updated_at = datetime.utcnow()
    await db.commit()

    logger.info(f"Store disconnected: {shop_domain}")

    return {
        "success": True,
        "shop_domain": shop_domain,
        "message": "Store disconnected successfully",
    }


# ============================================================================
# Inventory Sync Endpoints
# ============================================================================


@router.post(
    "/stores/{store_id}/sync-inventory",
    response_model=InventorySyncResponse,
    summary="Sync inventory from Shopify",
    description="""
    Triggers inventory synchronization from Shopify to ERP for a specific store.

    This endpoint:
    1. Validates that the store exists and is active
    2. Creates a sync log record for tracking
    3. Triggers the inventory sync Celery task
    4. Returns immediately with task ID (async mode) or waits for completion

    The sync operation will:
    - Fetch inventory levels from all or specified Shopify locations
    - Update corresponding stock records in the ERP system
    - Track synchronization status and errors

    **Parameters:**
    - `store_id`: Internal store ID (from /stores endpoint)
    - `location_id`: Optional Shopify location ID to sync specific location
    - `force_full`: If True, performs full sync regardless of last sync time
    - `async_mode`: If True, returns immediately with task ID

    **Example:**
    ```
    POST /api/v1/integrations/shopify/stores/1/sync-inventory
    {
        "location_id": null,
        "force_full": false,
        "async_mode": true
    }
    ```
    """,
    responses={
        200: {
            "description": "Inventory sync initiated successfully",
            "model": InventorySyncResponse
        },
        404: {
            "description": "Store not found",
        },
        400: {
            "description": "Store is not active or missing required configuration",
        },
        500: {
            "description": "Internal server error",
        }
    }
)
async def sync_inventory(
    store_id: int,
    request: InventorySyncRequest = None,
    db: AsyncSession = Depends(get_db),
) -> InventorySyncResponse:
    """
    Trigger inventory synchronization from Shopify to ERP.

    This endpoint initiates an inventory sync operation that fetches current
    inventory levels from Shopify and updates the corresponding stock records
    in the ERP system.

    Args:
        store_id: Internal store ID from the database.
        request: Optional sync configuration (location_id, force_full, async_mode).
        db: Database session.

    Returns:
        InventorySyncResponse: Status of the sync operation with task ID if async.

    Raises:
        HTTPException: If store is not found, inactive, or sync fails.
    """
    # Set defaults if request is not provided
    if request is None:
        request = InventorySyncRequest()

    # Get the store integration
    stmt = select(ShopifyIntegration).where(
        ShopifyIntegration.shp_id == store_id
    )
    result = await db.execute(stmt)
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=404,
            detail=f"Store with ID {store_id} not found",
        )

    if not integration.shp_is_active:
        raise HTTPException(
            status_code=400,
            detail=f"Store '{integration.shp_shop}' is not active. Please reconnect the store.",
        )

    if not integration.shp_access_token:
        raise HTTPException(
            status_code=400,
            detail=f"Store '{integration.shp_shop}' is missing access token. Please reconnect the store.",
        )

    # Check if read_inventory scope is available
    if integration.shp_scope and "read_inventory" not in integration.shp_scope:
        raise HTTPException(
            status_code=400,
            detail=f"Store '{integration.shp_shop}' does not have 'read_inventory' scope. Please reconnect with required permissions.",
        )

    started_at = datetime.utcnow()

    # Create sync log entry
    sync_log = ShopifySyncLog(
        shp_id=store_id,
        ssl_operation="inventory_sync",
        ssl_direction="inbound",
        ssl_entity_type="inventory",
        ssl_status="started",
        ssl_started_at=started_at,
    )
    db.add(sync_log)
    await db.commit()
    await db.refresh(sync_log)

    logger.info(
        f"Starting inventory sync for store: {integration.shp_shop}",
        extra={
            "store_id": store_id,
            "shop_domain": integration.shp_shop,
            "sync_log_id": sync_log.ssl_id,
            "location_id": request.location_id,
            "force_full": request.force_full,
            "async_mode": request.async_mode,
        },
    )

    try:
        if request.async_mode:
            # Queue the task asynchronously
            task = sync_inventory_task.delay(
                location_id=request.location_id,
                force_full=request.force_full,
            )

            # Update sync log with task ID
            sync_log.ssl_request_data = f"task_id={task.id}"
            await db.commit()

            return InventorySyncResponse(
                success=True,
                store_id=store_id,
                shop_domain=integration.shp_shop,
                task_id=task.id,
                status="queued",
                message="Inventory sync task queued successfully",
                sync_log_id=sync_log.ssl_id,
                started_at=started_at,
            )

        else:
            # Run synchronously (wait for completion)
            try:
                task_result = sync_inventory_task.apply(
                    kwargs={
                        "location_id": request.location_id,
                        "force_full": request.force_full,
                    }
                ).get(timeout=300)  # 5 minute timeout

                # Update sync log with result
                completed_at = datetime.utcnow()
                sync_log.ssl_status = "success"
                sync_log.ssl_completed_at = completed_at
                sync_log.ssl_records_processed = task_result.get("synced_count", 0)
                sync_log.ssl_records_failed = len(task_result.get("errors", []))
                sync_log.ssl_response_data = str(task_result)
                await db.commit()

                # Build stats
                stats = InventorySyncStats(
                    synced_count=task_result.get("synced_count", 0),
                    updated_count=task_result.get("updated_count", 0),
                    locations_synced=task_result.get("locations_synced", 0),
                    error_count=len(task_result.get("errors", [])),
                )

                # Build error list
                errors = None
                if task_result.get("errors"):
                    errors = [
                        InventorySyncError(
                            inventory_item_id=err.get("inventory_item_id"),
                            location_id=err.get("location_id"),
                            sku=err.get("sku"),
                            error=err.get("error", "Unknown error"),
                            error_code=err.get("error_code"),
                        )
                        for err in task_result.get("errors", [])
                    ]

                return InventorySyncResponse(
                    success=True,
                    store_id=store_id,
                    shop_domain=integration.shp_shop,
                    task_id=None,
                    status="completed",
                    message="Inventory sync completed successfully",
                    sync_log_id=sync_log.ssl_id,
                    stats=stats,
                    errors=errors,
                    started_at=started_at,
                    completed_at=completed_at,
                )

            except Exception as e:
                # Update sync log with error
                sync_log.ssl_status = "error"
                sync_log.ssl_completed_at = datetime.utcnow()
                sync_log.ssl_error_message = str(e)
                await db.commit()

                logger.error(
                    f"Inventory sync failed for store {integration.shp_shop}: {e}",
                    extra={"store_id": store_id, "error": str(e)},
                    exc_info=True,
                )

                return InventorySyncResponse(
                    success=False,
                    store_id=store_id,
                    shop_domain=integration.shp_shop,
                    status="failed",
                    message=f"Inventory sync failed: {str(e)}",
                    sync_log_id=sync_log.ssl_id,
                    started_at=started_at,
                    completed_at=datetime.utcnow(),
                )

    except Exception as e:
        # Update sync log with error
        sync_log.ssl_status = "error"
        sync_log.ssl_completed_at = datetime.utcnow()
        sync_log.ssl_error_message = str(e)
        await db.commit()

        logger.error(
            f"Failed to start inventory sync for store {integration.shp_shop}: {e}",
            extra={"store_id": store_id, "error": str(e)},
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to start inventory sync: {str(e)}",
        )


@router.get(
    "/stores/{store_id}/sync-inventory/status/{task_id}",
    response_model=InventorySyncStatusResponse,
    summary="Get inventory sync task status",
    description="Check the status of an asynchronous inventory sync task.",
)
async def get_inventory_sync_status(
    store_id: int,
    task_id: str,
    db: AsyncSession = Depends(get_db),
) -> InventorySyncStatusResponse:
    """
    Get the status of an inventory sync task.

    Args:
        store_id: Internal store ID.
        task_id: Celery task ID from the sync response.
        db: Database session.

    Returns:
        InventorySyncStatusResponse: Current status of the sync task.
    """
    from celery.result import AsyncResult

    # Verify store exists
    stmt = select(ShopifyIntegration).where(
        ShopifyIntegration.shp_id == store_id
    )
    result = await db.execute(stmt)
    integration = result.scalar_one_or_none()

    if not integration:
        raise HTTPException(
            status_code=404,
            detail=f"Store with ID {store_id} not found",
        )

    # Get task result
    task_result = AsyncResult(task_id)

    status_map = {
        "PENDING": "pending",
        "STARTED": "started",
        "SUCCESS": "success",
        "FAILURE": "failure",
        "REVOKED": "revoked",
        "RETRY": "started",
    }

    status = status_map.get(task_result.status, task_result.status.lower())

    response = InventorySyncStatusResponse(
        success=True,
        task_id=task_id,
        status=status,
    )

    if task_result.successful():
        result_data = task_result.result
        if isinstance(result_data, dict):
            response.result = InventorySyncStats(
                synced_count=result_data.get("synced_count", 0),
                updated_count=result_data.get("updated_count", 0),
                locations_synced=result_data.get("locations_synced", 0),
                error_count=len(result_data.get("errors", [])),
            )
    elif task_result.failed():
        response.error = str(task_result.result) if task_result.result else "Task failed"

    return response

"""
Shopify webhook verification middleware and dependencies.

Provides FastAPI dependencies for automatic HMAC verification
of incoming Shopify webhook requests.
"""
import logging
from typing import Optional, Callable, Awaitable
from dataclasses import dataclass

from fastapi import Request, HTTPException, Header, Depends
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.integrations.shopify.hmac_verification import (
    verify_webhook_hmac,
    validate_shop_domain,
    VerificationResult,
)
from app.integrations.shopify.exceptions import (
    ShopifyHMACVerificationError,
    ShopifyConfigurationError,
)

logger = logging.getLogger(__name__)


@dataclass
class ShopifyWebhookContext:
    """
    Context object containing verified webhook metadata.

    This is injected into route handlers after successful HMAC verification.
    """
    shop_domain: str
    topic: str
    webhook_id: Optional[str]
    api_version: Optional[str]
    verification_result: VerificationResult
    raw_body: bytes


async def get_verified_webhook(
    request: Request,
    x_shopify_hmac_sha256: str = Header(..., alias="X-Shopify-Hmac-SHA256"),
    x_shopify_shop_domain: str = Header(..., alias="X-Shopify-Shop-Domain"),
    x_shopify_topic: str = Header(..., alias="X-Shopify-Topic"),
    x_shopify_api_version: Optional[str] = Header(None, alias="X-Shopify-API-Version"),
    x_shopify_webhook_id: Optional[str] = Header(None, alias="X-Shopify-Webhook-Id"),
) -> ShopifyWebhookContext:
    """
    FastAPI dependency that verifies Shopify webhook HMAC signature.

    Use this dependency in webhook route handlers to automatically:
    1. Extract and verify the HMAC signature
    2. Validate the shop domain format
    3. Return a context object with verified webhook metadata

    Example usage:
        ```python
        @router.post("/webhooks/orders")
        async def handle_order_webhook(
            webhook: ShopifyWebhookContext = Depends(get_verified_webhook)
        ):
            # webhook.shop_domain is verified
            # webhook.raw_body contains the payload
            pass
        ```

    Args:
        request: The FastAPI request object.
        x_shopify_hmac_sha256: HMAC signature header.
        x_shopify_shop_domain: Shop domain header.
        x_shopify_topic: Webhook topic header.
        x_shopify_api_version: API version header (optional).
        x_shopify_webhook_id: Webhook ID header (optional).

    Returns:
        ShopifyWebhookContext: Verified webhook context.

    Raises:
        HTTPException: If HMAC verification fails (401) or configuration error (500).
    """
    # Read raw body for HMAC verification
    body = await request.body()

    # Validate shop domain format
    if not validate_shop_domain(x_shopify_shop_domain):
        logger.warning(
            f"Invalid shop domain in webhook: {x_shopify_shop_domain}",
            extra={
                "topic": x_shopify_topic,
                "webhook_id": x_shopify_webhook_id,
            },
        )
        raise HTTPException(
            status_code=401,
            detail=f"Invalid shop domain format: {x_shopify_shop_domain}",
        )

    try:
        # Verify HMAC signature
        result = verify_webhook_hmac(
            payload=body,
            provided_signature=x_shopify_hmac_sha256,
        )

        if not result.is_valid:
            logger.warning(
                f"Webhook HMAC verification failed: {result.error_message}",
                extra={
                    "shop_domain": x_shopify_shop_domain,
                    "topic": x_shopify_topic,
                    "webhook_id": x_shopify_webhook_id,
                },
            )
            raise HTTPException(
                status_code=401,
                detail=result.error_message or "HMAC verification failed",
            )

        logger.info(
            f"Webhook HMAC verification successful",
            extra={
                "shop_domain": x_shopify_shop_domain,
                "topic": x_shopify_topic,
                "webhook_id": x_shopify_webhook_id,
            },
        )

        return ShopifyWebhookContext(
            shop_domain=x_shopify_shop_domain,
            topic=x_shopify_topic,
            webhook_id=x_shopify_webhook_id,
            api_version=x_shopify_api_version,
            verification_result=result,
            raw_body=body,
        )

    except ShopifyConfigurationError as e:
        logger.error(
            f"Webhook configuration error: {e.message}",
            extra={"error_details": e.to_dict()},
        )
        raise HTTPException(
            status_code=500,
            detail=f"Webhook verification not configured: {e.message}",
        )


class ShopifyWebhookMiddleware(BaseHTTPMiddleware):
    """
    Middleware for automatic Shopify webhook HMAC verification.

    This middleware can be applied to specific routes or route prefixes
    to automatically verify all incoming Shopify webhooks.

    The middleware:
    1. Checks if the request is a Shopify webhook (has required headers)
    2. Verifies the HMAC signature
    3. Passes verified requests through
    4. Returns 401 for failed verification

    Example usage:
        ```python
        from starlette.routing import Mount
        from app.integrations.shopify.webhook_middleware import ShopifyWebhookMiddleware

        # Apply to specific routes
        app.add_middleware(
            ShopifyWebhookMiddleware,
            webhook_paths=["/api/v1/integrations/shopify/webhooks"]
        )
        ```
    """

    def __init__(
        self,
        app,
        webhook_paths: Optional[list[str]] = None,
        verify_all_posts: bool = False,
    ):
        """
        Initialize the middleware.

        Args:
            app: The ASGI application.
            webhook_paths: List of URL path prefixes to apply verification to.
            verify_all_posts: If True, verify all POST requests (not recommended).
        """
        super().__init__(app)
        self.webhook_paths = webhook_paths or ["/api/v1/integrations/shopify/webhooks"]
        self.verify_all_posts = verify_all_posts

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        """
        Process the request and verify Shopify webhooks.

        Args:
            request: The incoming request.
            call_next: The next middleware/route handler.

        Returns:
            Response: The response from the handler or an error response.
        """
        # Check if this is a webhook path we should verify
        should_verify = any(
            request.url.path.startswith(path) for path in self.webhook_paths
        )

        if not should_verify and not self.verify_all_posts:
            return await call_next(request)

        # Only verify POST requests with Shopify headers
        if request.method != "POST":
            return await call_next(request)

        hmac_header = request.headers.get("X-Shopify-Hmac-SHA256")
        if not hmac_header:
            # Not a Shopify webhook, pass through
            return await call_next(request)

        # Read the body for verification
        body = await request.body()

        try:
            result = verify_webhook_hmac(
                payload=body,
                provided_signature=hmac_header,
            )

            if not result.is_valid:
                logger.warning(
                    f"Middleware: Webhook HMAC verification failed",
                    extra={
                        "path": request.url.path,
                        "error": result.error_message,
                    },
                )
                return Response(
                    content='{"detail": "HMAC verification failed"}',
                    status_code=401,
                    media_type="application/json",
                )

        except ShopifyConfigurationError as e:
            logger.error(
                f"Middleware: Webhook configuration error: {e.message}",
                extra={"error_details": e.to_dict()},
            )
            return Response(
                content='{"detail": "Webhook verification not configured"}',
                status_code=500,
                media_type="application/json",
            )

        # Verification successful, continue to handler
        return await call_next(request)


def create_webhook_verification_dependency(
    require_shop_domain: bool = True,
    require_topic: bool = True,
) -> Callable:
    """
    Factory function to create customized webhook verification dependencies.

    Args:
        require_shop_domain: Whether to require and validate shop domain header.
        require_topic: Whether to require topic header.

    Returns:
        Callable: A FastAPI dependency function.
    """

    async def verify_webhook(
        request: Request,
        x_shopify_hmac_sha256: str = Header(..., alias="X-Shopify-Hmac-SHA256"),
        x_shopify_shop_domain: Optional[str] = Header(
            None if not require_shop_domain else ...,
            alias="X-Shopify-Shop-Domain",
        ),
        x_shopify_topic: Optional[str] = Header(
            None if not require_topic else ...,
            alias="X-Shopify-Topic",
        ),
        x_shopify_webhook_id: Optional[str] = Header(None, alias="X-Shopify-Webhook-Id"),
    ) -> ShopifyWebhookContext:
        """Inner verification function."""
        body = await request.body()

        # Validate shop domain if provided
        if require_shop_domain and x_shopify_shop_domain:
            if not validate_shop_domain(x_shopify_shop_domain):
                raise HTTPException(
                    status_code=401,
                    detail=f"Invalid shop domain: {x_shopify_shop_domain}",
                )

        try:
            result = verify_webhook_hmac(
                payload=body,
                provided_signature=x_shopify_hmac_sha256,
            )

            if not result.is_valid:
                raise HTTPException(
                    status_code=401,
                    detail=result.error_message or "HMAC verification failed",
                )

            return ShopifyWebhookContext(
                shop_domain=x_shopify_shop_domain or "unknown",
                topic=x_shopify_topic or "unknown",
                webhook_id=x_shopify_webhook_id,
                api_version=None,
                verification_result=result,
                raw_body=body,
            )

        except ShopifyConfigurationError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Verification not configured: {e.message}",
            )

    return verify_webhook


# Pre-configured dependencies for common use cases
verify_webhook_strict = create_webhook_verification_dependency(
    require_shop_domain=True,
    require_topic=True,
)

verify_webhook_relaxed = create_webhook_verification_dependency(
    require_shop_domain=False,
    require_topic=False,
)

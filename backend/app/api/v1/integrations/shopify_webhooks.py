"""
Shopify Webhooks API Router.

Provides REST API endpoints for receiving and processing Shopify webhooks.

Endpoints:
- POST /webhooks/shopify/{store_id} - Receive and process Shopify webhook events
- POST /webhooks/shopify/orders - Handle order-related webhooks (topic-based)
- POST /webhooks/shopify/products - Handle product-related webhooks (topic-based)
- POST /webhooks/shopify/customers - Handle customer-related webhooks (topic-based)
- POST /webhooks/shopify/inventory - Handle inventory-related webhooks (topic-based)
- POST /webhooks/shopify/app - Handle app lifecycle webhooks (topic-based)
- POST /webhooks/shopify/gdpr/* - Handle GDPR compliance webhooks
- GET /webhooks/shopify/health - Health check endpoint
"""
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Path, Request, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import get_settings
from app.models.integrations.shopify import ShopifyIntegration, ShopifySyncLog
from app.integrations.shopify.webhook_middleware import (
    get_verified_webhook,
    ShopifyWebhookContext,
)
from app.integrations.shopify.exceptions import ShopifyWebhookError
from app.tasks.shopify_tasks import (
    process_order_webhook,
    process_product_webhook,
    process_inventory_webhook,
    process_customer_webhook,
    create_or_update_order_task,
    process_webhook_event_task,
)
from app.services.webhook_idempotency_service import (
    webhook_idempotency,
    WebhookCheckResult,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/shopify", tags=["Shopify Webhooks"])


# ==========================================================================
# Response Schemas
# ==========================================================================

class WebhookSuccessResponse(BaseModel):
    """Success response for webhook processing."""
    success: bool = Field(default=True, description="Operation success status")
    message: str = Field(default="Webhook received", description="Status message")
    webhook_id: Optional[str] = Field(None, description="Shopify webhook ID")
    topic: Optional[str] = Field(None, description="Webhook topic")
    task_id: Optional[str] = Field(None, description="Background task ID if queued")
    is_duplicate: bool = Field(default=False, description="Whether this webhook was a duplicate")


class WebhookErrorDetail(BaseModel):
    """Error detail for webhook failures."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(None, description="Additional error details")


class WebhookErrorResponse(BaseModel):
    """Error response for webhook processing."""
    success: bool = Field(default=False, description="Operation success status")
    error: WebhookErrorDetail = Field(..., description="Error details")


# ==========================================================================
# Helper Functions
# ==========================================================================

async def get_integration_by_store_id(
    store_id: int,
    db: AsyncSession,
) -> Optional[ShopifyIntegration]:
    """
    Get Shopify integration by store ID.

    Args:
        store_id: The internal store/integration ID.
        db: Database session.

    Returns:
        ShopifyIntegration if found, None otherwise.
    """
    result = await db.execute(
        select(ShopifyIntegration).where(
            ShopifyIntegration.shp_id == store_id,
            ShopifyIntegration.shp_is_active == True,
        )
    )
    return result.scalar_one_or_none()


async def log_webhook_event(
    db: AsyncSession,
    integration_id: int,
    topic: str,
    webhook_id: Optional[str],
    status: str,
    request_data: Optional[str] = None,
    error_message: Optional[str] = None,
) -> ShopifySyncLog:
    """
    Log a webhook event to the sync log.

    Args:
        db: Database session.
        integration_id: Shopify integration ID.
        topic: Webhook topic (e.g., 'orders/create').
        webhook_id: Shopify webhook ID.
        status: Processing status ('pending', 'success', 'error').
        request_data: Raw webhook payload (optional).
        error_message: Error message if failed (optional).

    Returns:
        Created ShopifySyncLog record.
    """
    sync_log = ShopifySyncLog(
        shp_id=integration_id,
        ssl_operation=f"webhook:{topic}",
        ssl_direction="inbound",
        ssl_entity_type="webhook",
        ssl_entity_id=webhook_id,
        ssl_status=status,
        ssl_request_data=request_data,
        ssl_error_message=error_message,
        ssl_started_at=datetime.utcnow(),
        ssl_completed_at=datetime.utcnow() if status in ("success", "error") else None,
    )
    db.add(sync_log)
    await db.flush()
    return sync_log


def get_topic_handler(topic: str) -> tuple[Any, str]:
    """
    Get the appropriate Celery task handler for a webhook topic.

    Args:
        topic: The Shopify webhook topic.

    Returns:
        Tuple of (celery_task, entity_type).
    """
    # Order-related topics
    order_topics = {
        "orders/create",
        "orders/updated",
        "orders/paid",
        "orders/fulfilled",
        "orders/cancelled",
        "orders/partially_fulfilled",
    }

    # Product-related topics
    product_topics = {
        "products/create",
        "products/update",
        "products/delete",
    }

    # Inventory-related topics
    inventory_topics = {
        "inventory_levels/update",
        "inventory_levels/connect",
        "inventory_levels/disconnect",
    }

    # Customer-related topics
    customer_topics = {
        "customers/create",
        "customers/update",
        "customers/delete",
        "customers/enable",
        "customers/disable",
    }

    if topic in order_topics:
        # Use specialized order task for create/updated
        if topic in ("orders/create", "orders/updated"):
            return create_or_update_order_task, "order"
        return process_order_webhook, "order"
    elif topic in product_topics:
        return process_product_webhook, "product"
    elif topic in inventory_topics:
        return process_inventory_webhook, "inventory"
    elif topic in customer_topics:
        return process_customer_webhook, "customer"
    else:
        return None, "unknown"


# ==========================================================================
# Webhook Endpoints
# ==========================================================================

@router.post(
    "/{store_id}",
    summary="Receive Shopify webhook",
    description="""
    Receives and processes webhook events from Shopify.

    This endpoint:
    1. Verifies the HMAC signature from Shopify headers
    2. Validates the store_id matches an active integration
    3. Routes the webhook to the appropriate handler based on topic
    4. Queues background processing via Celery
    5. Returns immediately with acknowledgment

    **Shopify Headers Required:**
    - `X-Shopify-Hmac-SHA256`: HMAC signature for verification
    - `X-Shopify-Shop-Domain`: Shop domain
    - `X-Shopify-Topic`: Webhook topic (e.g., 'orders/create')
    - `X-Shopify-Webhook-Id`: Unique webhook ID (optional)
    - `X-Shopify-API-Version`: API version (optional)

    **Supported Webhook Topics:**

    Orders:
    - `orders/create` - New order placed
    - `orders/updated` - Order modified
    - `orders/paid` - Payment received
    - `orders/fulfilled` - Order shipped
    - `orders/cancelled` - Order cancelled
    - `orders/partially_fulfilled` - Partial shipment

    Products:
    - `products/create` - New product created
    - `products/update` - Product modified
    - `products/delete` - Product deleted

    Inventory:
    - `inventory_levels/update` - Inventory changed
    - `inventory_levels/connect` - Location connected
    - `inventory_levels/disconnect` - Location disconnected

    Customers:
    - `customers/create` - New customer
    - `customers/update` - Customer modified
    - `customers/delete` - Customer deleted

    **Response:**
    - `200 OK` - Webhook received and queued for processing
    - `400 Bad Request` - Invalid payload
    - `401 Unauthorized` - HMAC verification failed
    - `404 Not Found` - Store not found or inactive
    - `500 Internal Server Error` - Processing error
    """,
    response_model=WebhookSuccessResponse,
    responses={
        200: {
            "description": "Webhook received and queued for processing",
            "model": WebhookSuccessResponse,
        },
        400: {
            "description": "Invalid webhook payload",
            "model": WebhookErrorResponse,
        },
        401: {
            "description": "HMAC verification failed",
            "model": WebhookErrorResponse,
        },
        404: {
            "description": "Store not found or inactive",
            "model": WebhookErrorResponse,
        },
        500: {
            "description": "Internal server error",
            "model": WebhookErrorResponse,
        },
    },
)
async def receive_shopify_webhook(
    store_id: int = Path(
        ...,
        description="Internal store/integration ID",
        ge=1,
    ),
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """
    Receive and process Shopify webhook.

    This endpoint is called by Shopify when webhook events occur.
    The HMAC signature is verified automatically via the dependency.
    """
    logger.info(
        f"Received Shopify webhook",
        extra={
            "store_id": store_id,
            "topic": webhook.topic,
            "shop_domain": webhook.shop_domain,
            "webhook_id": webhook.webhook_id,
        },
    )

    # Validate the store exists and is active
    integration = await get_integration_by_store_id(store_id, db)
    if not integration:
        logger.warning(
            f"Webhook received for unknown or inactive store",
            extra={"store_id": store_id, "shop_domain": webhook.shop_domain},
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "STORE_NOT_FOUND",
                    "message": f"Store with ID {store_id} not found or inactive",
                    "details": {"store_id": store_id},
                },
            },
        )

    # Verify the shop domain matches (security check)
    if integration.shp_shop != webhook.shop_domain:
        logger.warning(
            f"Shop domain mismatch in webhook",
            extra={
                "store_id": store_id,
                "expected_shop": integration.shp_shop,
                "received_shop": webhook.shop_domain,
            },
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "error": {
                    "code": "SHOP_DOMAIN_MISMATCH",
                    "message": "Shop domain does not match registered store",
                    "details": {
                        "store_id": store_id,
                        "received_shop": webhook.shop_domain,
                    },
                },
            },
        )

    # Idempotency check - detect duplicate webhook deliveries
    idempotency_result = await webhook_idempotency.check_and_mark(
        webhook_id=webhook.webhook_id,
        integration_id=integration.shp_id,
        topic=webhook.topic,
        db=db,
    )

    if idempotency_result.is_duplicate:
        logger.info(
            f"Skipping duplicate webhook",
            extra={
                "store_id": store_id,
                "topic": webhook.topic,
                "webhook_id": webhook.webhook_id,
                "duplicate_source": idempotency_result.source,
            },
        )

        # Log as skipped for audit trail
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="skipped",
            request_data=webhook.raw_body.decode("utf-8")[:1000],  # Limited for duplicates
            error_message=f"Duplicate webhook detected via {idempotency_result.source}",
        )
        await db.commit()

        # Return 200 to Shopify (acknowledge receipt, but skip processing)
        return WebhookSuccessResponse(
            success=True,
            message="Webhook received (duplicate, skipped processing)",
            webhook_id=webhook.webhook_id,
            topic=webhook.topic,
            is_duplicate=True,
        )

    # Parse the webhook payload
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(
            f"Failed to parse webhook payload",
            extra={
                "store_id": store_id,
                "topic": webhook.topic,
                "error": str(e),
            },
        )

        # Log the error
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="error",
            error_message=f"Invalid JSON payload: {str(e)}",
        )
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_PAYLOAD",
                    "message": "Failed to parse webhook payload as JSON",
                    "details": {"error": str(e)},
                },
            },
        )

    # Get the appropriate handler for this topic
    handler, entity_type = get_topic_handler(webhook.topic)
    task_id = None

    if handler is None:
        # Unknown topic - log but accept (Shopify expects 200 response)
        logger.warning(
            f"Received webhook for unsupported topic",
            extra={
                "store_id": store_id,
                "topic": webhook.topic,
            },
        )

        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="ignored",
            request_data=webhook.raw_body.decode("utf-8")[:10000],  # Limit size
        )
        await db.commit()

        return WebhookSuccessResponse(
            success=True,
            message=f"Webhook received (topic '{webhook.topic}' not processed)",
            webhook_id=webhook.webhook_id,
            topic=webhook.topic,
        )

    # Log the webhook event as pending
    sync_log = await log_webhook_event(
        db=db,
        integration_id=integration.shp_id,
        topic=webhook.topic,
        webhook_id=webhook.webhook_id,
        status="pending",
        request_data=webhook.raw_body.decode("utf-8")[:10000],  # Limit size
    )

    # Queue the webhook for processing
    try:
        if handler == create_or_update_order_task:
            # Special handling for order create/update - pass full payload
            result = handler.delay(
                webhook_payload=payload,
                default_client_id=1,  # TODO: Get from integration settings
                default_currency_id=1,  # TODO: Get from integration settings
            )
        else:
            # Standard webhook processing
            result = handler.delay(
                webhook_topic=webhook.topic,
                **{f"{entity_type}_data": payload},
            )
        task_id = result.id

        logger.info(
            f"Webhook queued for processing",
            extra={
                "store_id": store_id,
                "topic": webhook.topic,
                "task_id": task_id,
            },
        )

    except Exception as e:
        logger.error(
            f"Failed to queue webhook for processing",
            extra={
                "store_id": store_id,
                "topic": webhook.topic,
                "error": str(e),
            },
            exc_info=True,
        )

        # Update sync log with error
        sync_log.ssl_status = "error"
        sync_log.ssl_error_message = f"Failed to queue task: {str(e)}"
        sync_log.ssl_completed_at = datetime.utcnow()
        await db.commit()

        # Still return 200 to Shopify (we logged the error, will retry later)
        return WebhookSuccessResponse(
            success=True,
            message="Webhook received (queuing failed, will retry)",
            webhook_id=webhook.webhook_id,
            topic=webhook.topic,
        )

    # Update the integration's last_used timestamp
    integration.shp_last_used_at = datetime.utcnow()
    await db.commit()

    return WebhookSuccessResponse(
        success=True,
        message="Webhook received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic=webhook.topic,
        task_id=task_id,
    )


@router.post(
    "/{store_id}/test",
    summary="Test webhook endpoint (development only)",
    description="""
    Test endpoint for webhook processing without HMAC verification.

    **WARNING: This endpoint should be disabled in production!**

    Use this endpoint during development to test webhook processing
    without requiring valid HMAC signatures from Shopify.
    """,
    response_model=WebhookSuccessResponse,
    include_in_schema=False,  # Hide from OpenAPI docs in production
)
async def test_shopify_webhook(
    store_id: int = Path(..., description="Internal store/integration ID", ge=1),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """
    Test webhook endpoint without HMAC verification.

    For development and testing purposes only.
    """
    from app.config import get_settings

    settings = get_settings()
    if not settings.DEBUG:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "error": {
                    "code": "TEST_ENDPOINT_DISABLED",
                    "message": "Test endpoint is only available in debug mode",
                    "details": None,
                },
            },
        )

    # Get required headers
    topic = request.headers.get("X-Shopify-Topic", "test/ping")
    webhook_id = request.headers.get("X-Shopify-Webhook-Id", "test-webhook-id")
    shop_domain = request.headers.get("X-Shopify-Shop-Domain", "test.myshopify.com")

    # Read and parse body
    body = await request.body()
    try:
        payload = json.loads(body.decode("utf-8")) if body else {}
    except (json.JSONDecodeError, UnicodeDecodeError):
        payload = {}

    # Validate the store exists
    integration = await get_integration_by_store_id(store_id, db)
    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "STORE_NOT_FOUND",
                    "message": f"Store with ID {store_id} not found or inactive",
                    "details": {"store_id": store_id},
                },
            },
        )

    # Log the test webhook
    await log_webhook_event(
        db=db,
        integration_id=integration.shp_id,
        topic=topic,
        webhook_id=webhook_id,
        status="test",
        request_data=body.decode("utf-8")[:10000] if body else None,
    )
    await db.commit()

    logger.info(
        f"Test webhook received",
        extra={
            "store_id": store_id,
            "topic": topic,
            "shop_domain": shop_domain,
        },
    )

    return WebhookSuccessResponse(
        success=True,
        message="Test webhook received successfully",
        webhook_id=webhook_id,
        topic=topic,
    )


# ==========================================================================
# Topic-Based Webhook Endpoints (Alternative routing pattern)
# ==========================================================================

async def _get_integration_by_shop_domain(
    shop_domain: str,
    db: AsyncSession,
) -> Optional[ShopifyIntegration]:
    """
    Get Shopify integration by shop domain.

    Args:
        shop_domain: The Shopify shop domain.
        db: Database session.

    Returns:
        ShopifyIntegration if found, None otherwise.
    """
    result = await db.execute(
        select(ShopifyIntegration).where(
            ShopifyIntegration.shp_shop == shop_domain,
            ShopifyIntegration.shp_is_active == True,
        )
    )
    return result.scalar_one_or_none()


@router.post(
    "/orders",
    response_model=WebhookSuccessResponse,
    summary="Handle order webhook events",
    description="""
    Receives Shopify order webhook events and queues them for processing.

    Supported topics:
    - `orders/create`: New order placed
    - `orders/updated`: Order modified
    - `orders/paid`: Payment received
    - `orders/fulfilled`: Order fulfilled
    - `orders/partially_fulfilled`: Order partially fulfilled
    - `orders/cancelled`: Order cancelled
    - `orders/delete`: Order deleted

    The endpoint:
    1. Verifies the HMAC signature
    2. Parses the webhook payload
    3. Queues the order for async processing via Celery
    4. Returns immediately with acknowledgment

    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Webhook received successfully", "model": WebhookSuccessResponse},
        400: {"description": "Invalid payload", "model": WebhookErrorResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_order_webhook(
    background_tasks: BackgroundTasks,
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """
    Handle Shopify order webhook events.

    This endpoint receives order-related webhooks from Shopify,
    verifies the HMAC signature, and queues the order for async processing.
    """
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(f"Failed to parse order webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_PAYLOAD",
                    "message": "Failed to parse webhook payload as JSON",
                    "details": {"error": str(e)}
                }
            }
        )

    order_id = payload.get("id") or payload.get("admin_graphql_api_id")
    order_number = payload.get("name") or payload.get("order_number")

    logger.info(
        f"Received order webhook: topic={webhook.topic}, "
        f"order_id={order_id}, order_number={order_number}, "
        f"shop={webhook.shop_domain}"
    )

    # Find the integration
    integration = await _get_integration_by_shop_domain(webhook.shop_domain, db)

    # Idempotency check - detect duplicate webhook deliveries
    if integration and webhook.webhook_id:
        idempotency_result = await webhook_idempotency.check_and_mark(
            webhook_id=webhook.webhook_id,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            db=db,
        )

        if idempotency_result.is_duplicate:
            logger.info(
                f"Skipping duplicate order webhook",
                extra={
                    "topic": webhook.topic,
                    "webhook_id": webhook.webhook_id,
                    "order_id": order_id,
                },
            )
            await log_webhook_event(
                db=db,
                integration_id=integration.shp_id,
                topic=webhook.topic,
                webhook_id=webhook.webhook_id,
                status="skipped",
                error_message=f"Duplicate webhook detected via {idempotency_result.source}",
            )
            await db.commit()
            return WebhookSuccessResponse(
                success=True,
                message="Order webhook received (duplicate, skipped)",
                webhook_id=webhook.webhook_id,
                topic=webhook.topic,
                is_duplicate=True,
            )

    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="pending",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )

    # Queue for async processing based on topic
    task_id = None
    if webhook.topic in ("orders/create", "orders/updated"):
        result = create_or_update_order_task.delay(webhook_payload=payload)
        task_id = result.id
    else:
        result = process_order_webhook.delay(
            webhook_topic=webhook.topic,
            order_data=payload,
        )
        task_id = result.id

    await db.commit()

    return WebhookSuccessResponse(
        success=True,
        message=f"Order webhook ({webhook.topic}) received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic=webhook.topic,
        task_id=task_id,
    )


@router.post(
    "/products",
    response_model=WebhookSuccessResponse,
    summary="Handle product webhook events",
    description="""
    Receives Shopify product webhook events and queues them for processing.

    Supported topics:
    - `products/create`: New product created
    - `products/update`: Product modified
    - `products/delete`: Product deleted

    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Webhook received successfully", "model": WebhookSuccessResponse},
        400: {"description": "Invalid payload", "model": WebhookErrorResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_product_webhook(
    background_tasks: BackgroundTasks,
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """Handle Shopify product webhook events."""
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(f"Failed to parse product webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_PAYLOAD",
                    "message": "Failed to parse webhook payload as JSON",
                    "details": {"error": str(e)}
                }
            }
        )

    product_id = payload.get("id") or payload.get("admin_graphql_api_id")
    product_title = payload.get("title")

    logger.info(
        f"Received product webhook: topic={webhook.topic}, "
        f"product_id={product_id}, title={product_title}, "
        f"shop={webhook.shop_domain}"
    )

    # Find the integration and log
    integration = await _get_integration_by_shop_domain(webhook.shop_domain, db)

    # Idempotency check
    if integration and webhook.webhook_id:
        idempotency_result = await webhook_idempotency.check_and_mark(
            webhook_id=webhook.webhook_id,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            db=db,
        )

        if idempotency_result.is_duplicate:
            logger.info(
                f"Skipping duplicate product webhook",
                extra={
                    "topic": webhook.topic,
                    "webhook_id": webhook.webhook_id,
                    "product_id": product_id,
                },
            )
            await log_webhook_event(
                db=db,
                integration_id=integration.shp_id,
                topic=webhook.topic,
                webhook_id=webhook.webhook_id,
                status="skipped",
                error_message=f"Duplicate webhook detected via {idempotency_result.source}",
            )
            await db.commit()
            return WebhookSuccessResponse(
                success=True,
                message="Product webhook received (duplicate, skipped)",
                webhook_id=webhook.webhook_id,
                topic=webhook.topic,
                is_duplicate=True,
            )

    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="pending",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )

    # Queue for async processing
    result = process_product_webhook.delay(
        webhook_topic=webhook.topic,
        product_data=payload,
    )

    await db.commit()

    return WebhookSuccessResponse(
        success=True,
        message=f"Product webhook ({webhook.topic}) received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic=webhook.topic,
        task_id=result.id,
    )


@router.post(
    "/customers",
    response_model=WebhookSuccessResponse,
    summary="Handle customer webhook events",
    description="""
    Receives Shopify customer webhook events and queues them for processing.

    Supported topics:
    - `customers/create`: New customer registered
    - `customers/update`: Customer info updated
    - `customers/delete`: Customer deleted
    - `customers/enable`: Customer account enabled
    - `customers/disable`: Customer account disabled

    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Webhook received successfully", "model": WebhookSuccessResponse},
        400: {"description": "Invalid payload", "model": WebhookErrorResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_customer_webhook(
    background_tasks: BackgroundTasks,
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """Handle Shopify customer webhook events."""
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(f"Failed to parse customer webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_PAYLOAD",
                    "message": "Failed to parse webhook payload as JSON",
                    "details": {"error": str(e)}
                }
            }
        )

    customer_id = payload.get("id") or payload.get("admin_graphql_api_id")
    customer_email = payload.get("email")

    logger.info(
        f"Received customer webhook: topic={webhook.topic}, "
        f"customer_id={customer_id}, email={customer_email}, "
        f"shop={webhook.shop_domain}"
    )

    # Find the integration and log
    integration = await _get_integration_by_shop_domain(webhook.shop_domain, db)

    # Idempotency check
    if integration and webhook.webhook_id:
        idempotency_result = await webhook_idempotency.check_and_mark(
            webhook_id=webhook.webhook_id,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            db=db,
        )

        if idempotency_result.is_duplicate:
            logger.info(
                f"Skipping duplicate customer webhook",
                extra={
                    "topic": webhook.topic,
                    "webhook_id": webhook.webhook_id,
                    "customer_id": customer_id,
                },
            )
            await log_webhook_event(
                db=db,
                integration_id=integration.shp_id,
                topic=webhook.topic,
                webhook_id=webhook.webhook_id,
                status="skipped",
                error_message=f"Duplicate webhook detected via {idempotency_result.source}",
            )
            await db.commit()
            return WebhookSuccessResponse(
                success=True,
                message="Customer webhook received (duplicate, skipped)",
                webhook_id=webhook.webhook_id,
                topic=webhook.topic,
                is_duplicate=True,
            )

    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="pending",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )

    # Queue for async processing
    result = process_customer_webhook.delay(
        webhook_topic=webhook.topic,
        customer_data=payload,
    )

    await db.commit()

    return WebhookSuccessResponse(
        success=True,
        message=f"Customer webhook ({webhook.topic}) received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic=webhook.topic,
        task_id=result.id,
    )


@router.post(
    "/inventory",
    response_model=WebhookSuccessResponse,
    summary="Handle inventory webhook events",
    description="""
    Receives Shopify inventory webhook events and queues them for processing.

    Supported topics:
    - `inventory_levels/update`: Inventory quantity changed
    - `inventory_levels/connect`: Inventory item connected to location
    - `inventory_levels/disconnect`: Inventory item disconnected from location
    - `inventory_items/create`: New inventory item created
    - `inventory_items/update`: Inventory item updated
    - `inventory_items/delete`: Inventory item deleted

    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Webhook received successfully", "model": WebhookSuccessResponse},
        400: {"description": "Invalid payload", "model": WebhookErrorResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_inventory_webhook(
    background_tasks: BackgroundTasks,
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """Handle Shopify inventory webhook events."""
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(f"Failed to parse inventory webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_PAYLOAD",
                    "message": "Failed to parse webhook payload as JSON",
                    "details": {"error": str(e)}
                }
            }
        )

    inventory_item_id = payload.get("inventory_item_id")
    location_id = payload.get("location_id")
    available = payload.get("available")

    logger.info(
        f"Received inventory webhook: topic={webhook.topic}, "
        f"inventory_item_id={inventory_item_id}, location_id={location_id}, "
        f"available={available}, shop={webhook.shop_domain}"
    )

    # Find the integration and log
    integration = await _get_integration_by_shop_domain(webhook.shop_domain, db)

    # Idempotency check
    if integration and webhook.webhook_id:
        idempotency_result = await webhook_idempotency.check_and_mark(
            webhook_id=webhook.webhook_id,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            db=db,
        )

        if idempotency_result.is_duplicate:
            logger.info(
                f"Skipping duplicate inventory webhook",
                extra={
                    "topic": webhook.topic,
                    "webhook_id": webhook.webhook_id,
                    "inventory_item_id": inventory_item_id,
                },
            )
            await log_webhook_event(
                db=db,
                integration_id=integration.shp_id,
                topic=webhook.topic,
                webhook_id=webhook.webhook_id,
                status="skipped",
                error_message=f"Duplicate webhook detected via {idempotency_result.source}",
            )
            await db.commit()
            return WebhookSuccessResponse(
                success=True,
                message="Inventory webhook received (duplicate, skipped)",
                webhook_id=webhook.webhook_id,
                topic=webhook.topic,
                is_duplicate=True,
            )

    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="pending",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )

    # Queue for async processing
    result = process_inventory_webhook.delay(
        webhook_topic=webhook.topic,
        inventory_data=payload,
    )

    await db.commit()

    return WebhookSuccessResponse(
        success=True,
        message=f"Inventory webhook ({webhook.topic}) received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic=webhook.topic,
        task_id=result.id,
    )


@router.post(
    "/app",
    response_model=WebhookSuccessResponse,
    summary="Handle app lifecycle webhook events",
    description="""
    Receives Shopify app lifecycle webhook events.

    Supported topics:
    - `app/uninstalled`: App was uninstalled from the store
    - `shop/update`: Shop information was updated

    These webhooks are critical for:
    - Cleaning up data when app is uninstalled
    - Revoking access tokens
    - Updating stored shop information

    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Webhook received successfully", "model": WebhookSuccessResponse},
        400: {"description": "Invalid payload", "model": WebhookErrorResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_app_webhook(
    background_tasks: BackgroundTasks,
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """
    Handle Shopify app lifecycle webhook events.

    App uninstall will mark the integration as inactive and revoke the access token.
    """
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        logger.error(f"Failed to parse app webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_PAYLOAD",
                    "message": "Failed to parse webhook payload as JSON",
                    "details": {"error": str(e)}
                }
            }
        )

    logger.info(
        f"Received app webhook: topic={webhook.topic}, shop={webhook.shop_domain}"
    )

    # Handle app uninstall
    if webhook.topic == "app/uninstalled":
        try:
            # Mark the integration as inactive
            stmt = (
                update(ShopifyIntegration)
                .where(
                    ShopifyIntegration.shp_shop == webhook.shop_domain,
                )
                .values(
                    shp_is_active=False,
                    shp_access_token="",  # Clear the access token
                    shp_updated_at=datetime.utcnow(),
                )
            )
            await db.execute(stmt)
            await db.commit()

            logger.info(
                f"App uninstalled: Deactivated integration for shop {webhook.shop_domain}"
            )

        except Exception as e:
            logger.error(f"Failed to handle app uninstall: {e}")
            await db.rollback()

    elif webhook.topic == "shop/update":
        # Log the shop update for reference
        logger.info(
            f"Shop update received for {webhook.shop_domain}: "
            f"name={payload.get('name')}, email={payload.get('email')}"
        )

    # Find the integration and log
    integration = await _get_integration_by_shop_domain(webhook.shop_domain, db)
    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic=webhook.topic,
            webhook_id=webhook.webhook_id,
            status="success",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )
        await db.commit()

    return WebhookSuccessResponse(
        success=True,
        message=f"App webhook ({webhook.topic}) processed successfully",
        webhook_id=webhook.webhook_id,
        topic=webhook.topic,
    )


# ==========================================================================
# GDPR Webhooks (Mandatory for Shopify Apps)
# ==========================================================================

@router.post(
    "/gdpr/customers/redact",
    response_model=WebhookSuccessResponse,
    summary="Handle GDPR customer data redaction request",
    description="""
    Receives GDPR customer data redaction requests from Shopify.

    This webhook is triggered when a customer requests their data to be deleted.
    The app must delete all stored customer data within 48 hours.

    **Required for Shopify App Store compliance.**
    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Request received", "model": WebhookSuccessResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_gdpr_customer_redact(
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """
    Handle GDPR customer data redaction request.

    Shopify sends this webhook when a store owner requests deletion
    of customer data on behalf of a customer.
    """
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        payload = {}

    customer_id = payload.get("customer", {}).get("id")
    customer_email = payload.get("customer", {}).get("email")
    shop_domain = payload.get("shop_domain") or webhook.shop_domain

    logger.info(
        f"GDPR customer redact request: shop={shop_domain}, "
        f"customer_id={customer_id}, email={customer_email}"
    )

    # Find the integration and log
    integration = await _get_integration_by_shop_domain(shop_domain, db)
    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic="gdpr/customers/redact",
            webhook_id=webhook.webhook_id,
            status="pending",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )
        await db.commit()

    # TODO: Implement customer data deletion logic
    # 1. Find all orders associated with this customer
    # 2. Anonymize/delete customer PII from orders
    # 3. Delete any stored customer records
    # 4. Log the deletion for compliance

    return WebhookSuccessResponse(
        success=True,
        message="GDPR customer redact request received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic="customers/redact",
    )


@router.post(
    "/gdpr/shop/redact",
    response_model=WebhookSuccessResponse,
    summary="Handle GDPR shop data redaction request",
    description="""
    Receives GDPR shop data redaction requests from Shopify.

    This webhook is triggered 48 hours after an app is uninstalled,
    requesting deletion of all shop data stored by the app.

    **Required for Shopify App Store compliance.**
    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Request received", "model": WebhookSuccessResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_gdpr_shop_redact(
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """
    Handle GDPR shop data redaction request.

    Shopify sends this webhook 48 hours after an app is uninstalled,
    requiring deletion of all stored shop data.
    """
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        payload = {}

    shop_domain = payload.get("shop_domain") or webhook.shop_domain
    shop_id = payload.get("shop_id")

    logger.info(
        f"GDPR shop redact request: shop={shop_domain}, shop_id={shop_id}"
    )

    # Find the integration and log
    integration = await _get_integration_by_shop_domain(shop_domain, db)
    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic="gdpr/shop/redact",
            webhook_id=webhook.webhook_id,
            status="pending",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )
        await db.commit()

    # TODO: Implement shop data deletion logic
    # 1. Find the integration for this shop
    # 2. Delete all related data (orders, products, customers, sync logs)
    # 3. Delete the integration record
    # 4. Log the deletion for compliance

    return WebhookSuccessResponse(
        success=True,
        message="GDPR shop redact request received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic="shop/redact",
    )


@router.post(
    "/gdpr/customers/data_request",
    response_model=WebhookSuccessResponse,
    summary="Handle GDPR customer data request",
    description="""
    Receives GDPR customer data requests from Shopify.

    This webhook is triggered when a customer requests a copy of their data.
    The app must provide the data within 48 hours.

    **Required for Shopify App Store compliance.**
    **Security:** Requires valid `X-Shopify-Hmac-SHA256` header.
    """,
    responses={
        200: {"description": "Request received", "model": WebhookSuccessResponse},
        401: {"description": "HMAC verification failed", "model": WebhookErrorResponse},
    },
)
async def handle_gdpr_customer_data_request(
    webhook: ShopifyWebhookContext = Depends(get_verified_webhook),
    db: AsyncSession = Depends(get_db),
) -> WebhookSuccessResponse:
    """
    Handle GDPR customer data request.

    Shopify sends this webhook when a customer requests a copy of their data.
    """
    try:
        payload = json.loads(webhook.raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        payload = {}

    customer_id = payload.get("customer", {}).get("id")
    customer_email = payload.get("customer", {}).get("email")
    shop_domain = payload.get("shop_domain") or webhook.shop_domain

    logger.info(
        f"GDPR customer data request: shop={shop_domain}, "
        f"customer_id={customer_id}, email={customer_email}"
    )

    # Find the integration and log
    integration = await _get_integration_by_shop_domain(shop_domain, db)
    if integration:
        await log_webhook_event(
            db=db,
            integration_id=integration.shp_id,
            topic="gdpr/customers/data_request",
            webhook_id=webhook.webhook_id,
            status="pending",
            request_data=webhook.raw_body.decode("utf-8")[:10000],
        )
        await db.commit()

    # TODO: Implement customer data export logic
    # 1. Find all data associated with this customer
    # 2. Compile into a structured format
    # 3. Send to the provided destination or store for retrieval

    return WebhookSuccessResponse(
        success=True,
        message="GDPR customer data request received and queued for processing",
        webhook_id=webhook.webhook_id,
        topic="customers/data_request",
    )


# ==========================================================================
# Webhook Health/Status Endpoint
# ==========================================================================

@router.get(
    "/health",
    summary="Webhook endpoint health check",
    description="Returns the health status of the webhook endpoint.",
    responses={
        200: {"description": "Healthy"},
    },
)
async def webhook_health() -> Dict[str, Any]:
    """
    Health check endpoint for webhook monitoring.

    Can be used by external monitoring services to verify
    the webhook endpoint is operational.
    """
    settings = get_settings()
    return {
        "status": "healthy",
        "webhook_verification": "enabled" if settings.SHOPIFY_WEBHOOK_SECRET or settings.SHOPIFY_API_SECRET else "disabled",
        "celery_broker": "configured" if settings.CELERY_BROKER_URL else "not_configured",
        "timestamp": datetime.utcnow().isoformat(),
    }

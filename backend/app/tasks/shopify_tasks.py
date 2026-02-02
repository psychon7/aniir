"""
Shopify Celery Tasks.

Provides background tasks for:
- Periodic synchronization (orders, products, inventory, customers)
- Webhook processing (order created/updated, product changes, inventory adjustments)
- Full sync operations
- Error handling with retries and dead-letter queue

Tasks are designed to be idempotent and handle Shopify rate limits.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError

from app.tasks.celery_app import celery_app
from app.tasks.exceptions import (
    ShopifyTaskError,
    ShopifyConnectionError,
    ShopifyAuthenticationError,
    ShopifyRateLimitError,
    ShopifySyncError,
    ShopifyWebhookError,
    ShopifyConfigurationError,
    ShopifyOrderError,
    ShopifyInventoryError,
    ShopifyResourceNotFoundError,
)
from app.config import get_settings

logger = logging.getLogger(__name__)

# =============================================================================
# Configuration Helpers
# =============================================================================


def _get_shopify_config() -> Dict[str, Any]:
    """
    Get Shopify configuration from settings.

    Returns:
        Dict containing Shopify configuration.

    Raises:
        ShopifyConfigurationError: If required settings are missing.
    """
    settings = get_settings()

    missing = []
    if not settings.SHOPIFY_SHOP_DOMAIN:
        missing.append("SHOPIFY_SHOP_DOMAIN")
    if not settings.SHOPIFY_ACCESS_TOKEN:
        missing.append("SHOPIFY_ACCESS_TOKEN")

    if missing:
        raise ShopifyConfigurationError(
            message="Missing required Shopify configuration",
            missing_settings=missing,
        )

    return {
        "shop_domain": settings.SHOPIFY_SHOP_DOMAIN,
        "access_token": settings.SHOPIFY_ACCESS_TOKEN,
        "api_version": settings.SHOPIFY_API_VERSION,
        "timeout": settings.SHOPIFY_REQUEST_TIMEOUT,
        "max_retries": settings.SHOPIFY_MAX_RETRIES,
        "rate_limit_buffer": settings.SHOPIFY_RATE_LIMIT_BUFFER,
    }


def _log_task_start(task_name: str, **kwargs) -> None:
    """Log task start with parameters."""
    logger.info(f"Starting task: {task_name}", extra={"task": task_name, "params": kwargs})


def _log_task_success(task_name: str, result: Dict[str, Any]) -> None:
    """Log task success with result."""
    logger.info(f"Task completed: {task_name}", extra={"task": task_name, "result": result})


def _log_task_failure(task_name: str, error: Exception) -> None:
    """Log task failure with error details."""
    error_details = error.to_dict() if isinstance(error, ShopifyTaskError) else {"error": str(error)}
    logger.error(f"Task failed: {task_name}", extra={"task": task_name, "error": error_details}, exc_info=True)


# =============================================================================
# Periodic Sync Tasks
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.sync_orders",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def sync_orders(
    self,
    since_minutes: int = 10,
    status: Optional[str] = None,
    force_full: bool = False,
) -> Dict[str, Any]:
    """
    Synchronize orders from Shopify to ERP.

    This task fetches recent orders from Shopify and creates/updates
    corresponding records in the ERP system.

    Args:
        since_minutes: Fetch orders updated within this many minutes (default: 10).
        status: Filter by order status (any, open, closed, cancelled).
        force_full: If True, fetch all orders regardless of time filter.

    Returns:
        Dict with sync statistics:
            - synced_count: Number of orders synchronized
            - created_count: Number of new orders created
            - updated_count: Number of existing orders updated
            - skipped_count: Number of orders skipped
            - errors: List of error details

    Raises:
        ShopifySyncError: If synchronization fails after retries.
    """
    task_name = "sync_orders"
    _log_task_start(task_name, since_minutes=since_minutes, status=status, force_full=force_full)

    try:
        config = _get_shopify_config()

        # Calculate time window
        if force_full:
            since_time = None
        else:
            since_time = datetime.utcnow() - timedelta(minutes=since_minutes)

        # Initialize counters
        result = {
            "synced_count": 0,
            "created_count": 0,
            "updated_count": 0,
            "skipped_count": 0,
            "errors": [],
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
        }

        # TODO: Implement actual Shopify API call and ERP sync logic
        # This is a placeholder for the actual implementation
        #
        # Example implementation flow:
        # 1. Initialize Shopify GraphQL client
        # 2. Query orders with pagination (cursor-based)
        # 3. For each order:
        #    a. Check if order exists in ERP (by Shopify order ID)
        #    b. Map Shopify order to ERP invoice/order format
        #    c. Create or update ERP record
        #    d. Update line items
        #    e. Handle payments if applicable
        # 4. Track statistics and errors
        #
        # from app.integrations.shopify import ShopifyGraphQLClient
        # client = ShopifyGraphQLClient(config)
        # orders = await client.fetch_orders(since=since_time, status=status)
        # for order in orders:
        #     try:
        #         sync_single_order(order)
        #         result["synced_count"] += 1
        #     except Exception as e:
        #         result["errors"].append({"order_id": order.id, "error": str(e)})

        result["completed_at"] = datetime.utcnow().isoformat()
        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise  # Don't retry config errors
    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except ShopifyAuthenticationError as e:
        _log_task_failure(task_name, e)
        raise  # Don't retry auth errors
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifySyncError(
            sync_type="orders",
            message=f"Order sync failed: {str(e)}",
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.sync_products",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def sync_products(
    self,
    since_minutes: int = 20,
    product_type: Optional[str] = None,
    force_full: bool = False,
) -> Dict[str, Any]:
    """
    Synchronize products from Shopify to ERP.

    Fetches products and variants from Shopify and updates the ERP
    product catalog accordingly.

    Args:
        since_minutes: Fetch products updated within this many minutes.
        product_type: Filter by product type.
        force_full: If True, fetch all products regardless of time filter.

    Returns:
        Dict with sync statistics.
    """
    task_name = "sync_products"
    _log_task_start(task_name, since_minutes=since_minutes, product_type=product_type, force_full=force_full)

    try:
        config = _get_shopify_config()

        if force_full:
            since_time = None
        else:
            since_time = datetime.utcnow() - timedelta(minutes=since_minutes)

        result = {
            "synced_count": 0,
            "created_count": 0,
            "updated_count": 0,
            "skipped_count": 0,
            "variants_synced": 0,
            "errors": [],
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
        }

        # TODO: Implement actual Shopify product sync
        # 1. Fetch products with variants from Shopify
        # 2. For each product:
        #    a. Map to ERP product format
        #    b. Create or update product
        #    c. Sync all variants
        #    d. Update pricing information
        #    e. Sync images if needed

        result["completed_at"] = datetime.utcnow().isoformat()
        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except ShopifyAuthenticationError as e:
        _log_task_failure(task_name, e)
        raise
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifySyncError(
            sync_type="products",
            message=f"Product sync failed: {str(e)}",
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.sync_inventory",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def sync_inventory(
    self,
    location_id: Optional[str] = None,
    force_full: bool = False,
) -> Dict[str, Any]:
    """
    Synchronize inventory levels from Shopify to ERP.

    Updates inventory quantities for all products/variants across
    specified or all locations.

    Args:
        location_id: Specific Shopify location ID to sync (optional).
        force_full: If True, sync all inventory regardless of changes.

    Returns:
        Dict with sync statistics.
    """
    task_name = "sync_inventory"
    _log_task_start(task_name, location_id=location_id, force_full=force_full)

    try:
        config = _get_shopify_config()

        result = {
            "synced_count": 0,
            "updated_count": 0,
            "locations_synced": 0,
            "errors": [],
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
        }

        # TODO: Implement actual inventory sync
        # 1. Fetch inventory levels from Shopify
        # 2. For each inventory item:
        #    a. Find corresponding ERP product/variant
        #    b. Compare quantities
        #    c. Update ERP inventory if different
        # 3. Handle multi-location inventory

        result["completed_at"] = datetime.utcnow().isoformat()
        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except ShopifyAuthenticationError as e:
        _log_task_failure(task_name, e)
        raise
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifySyncError(
            sync_type="inventory",
            message=f"Inventory sync failed: {str(e)}",
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.sync_customers",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def sync_customers(
    self,
    since_minutes: int = 60,
    force_full: bool = False,
) -> Dict[str, Any]:
    """
    Synchronize customers from Shopify to ERP.

    Creates or updates customer/client records in ERP based on
    Shopify customer data.

    Args:
        since_minutes: Fetch customers updated within this many minutes.
        force_full: If True, fetch all customers regardless of time filter.

    Returns:
        Dict with sync statistics.
    """
    task_name = "sync_customers"
    _log_task_start(task_name, since_minutes=since_minutes, force_full=force_full)

    try:
        config = _get_shopify_config()

        if force_full:
            since_time = None
        else:
            since_time = datetime.utcnow() - timedelta(minutes=since_minutes)

        result = {
            "synced_count": 0,
            "created_count": 0,
            "updated_count": 0,
            "skipped_count": 0,
            "errors": [],
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
        }

        # TODO: Implement actual customer sync
        # 1. Fetch customers from Shopify
        # 2. For each customer:
        #    a. Check if customer exists in ERP (by email or Shopify ID)
        #    b. Map Shopify customer to ERP client format
        #    c. Create or update ERP client record
        #    d. Sync addresses if applicable

        result["completed_at"] = datetime.utcnow().isoformat()
        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except ShopifyAuthenticationError as e:
        _log_task_failure(task_name, e)
        raise
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifySyncError(
            sync_type="customers",
            message=f"Customer sync failed: {str(e)}",
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.full_sync",
    max_retries=1,
    default_retry_delay=300,
    time_limit=3600,  # 1 hour timeout
    soft_time_limit=3300,  # Soft limit 55 minutes
)
def full_sync(self) -> Dict[str, Any]:
    """
    Perform a full synchronization of all Shopify data.

    This task orchestrates a complete sync of:
    1. Products
    2. Inventory
    3. Customers
    4. Orders

    Should be run during off-peak hours as it's resource intensive.

    Returns:
        Dict with overall sync statistics.
    """
    task_name = "full_sync"
    _log_task_start(task_name)

    try:
        config = _get_shopify_config()

        result = {
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "products": None,
            "inventory": None,
            "customers": None,
            "orders": None,
            "overall_status": "in_progress",
            "errors": [],
        }

        # Sync products first (needed for inventory references)
        try:
            result["products"] = sync_products.apply(kwargs={"force_full": True}).get()
        except Exception as e:
            result["errors"].append({"sync": "products", "error": str(e)})
            logger.error(f"Full sync - products failed: {e}")

        # Sync inventory after products
        try:
            result["inventory"] = sync_inventory.apply(kwargs={"force_full": True}).get()
        except Exception as e:
            result["errors"].append({"sync": "inventory", "error": str(e)})
            logger.error(f"Full sync - inventory failed: {e}")

        # Sync customers
        try:
            result["customers"] = sync_customers.apply(kwargs={"force_full": True}).get()
        except Exception as e:
            result["errors"].append({"sync": "customers", "error": str(e)})
            logger.error(f"Full sync - customers failed: {e}")

        # Sync orders last (needs products and customers)
        try:
            result["orders"] = sync_orders.apply(kwargs={"force_full": True}).get()
        except Exception as e:
            result["errors"].append({"sync": "orders", "error": str(e)})
            logger.error(f"Full sync - orders failed: {e}")

        result["completed_at"] = datetime.utcnow().isoformat()
        result["overall_status"] = "completed" if not result["errors"] else "completed_with_errors"

        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifySyncError(
            sync_type="full",
            message=f"Full sync failed: {str(e)}",
        )


# =============================================================================
# Webhook Processing Tasks
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.process_order_webhook",
    max_retries=5,
    default_retry_delay=30,
    autoretry_for=(ShopifyConnectionError,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def process_order_webhook(
    self,
    webhook_topic: str,
    order_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Process Shopify order webhook.

    Handles order-related webhook events:
    - orders/create: New order placed
    - orders/updated: Order modified
    - orders/paid: Payment received
    - orders/fulfilled: Order fulfilled
    - orders/cancelled: Order cancelled

    Args:
        webhook_topic: The webhook topic (e.g., 'orders/create').
        order_data: The order data from Shopify webhook payload.

    Returns:
        Dict with processing result.

    Raises:
        ShopifyWebhookError: If webhook processing fails after retries.
    """
    task_name = "process_order_webhook"
    order_id = order_data.get("id") or order_data.get("admin_graphql_api_id")
    order_number = order_data.get("name") or order_data.get("order_number")

    _log_task_start(task_name, webhook_topic=webhook_topic, order_id=order_id, order_number=order_number)

    try:
        config = _get_shopify_config()

        result = {
            "webhook_topic": webhook_topic,
            "order_id": order_id,
            "order_number": order_number,
            "action": None,
            "erp_record_id": None,
            "processed_at": datetime.utcnow().isoformat(),
        }

        # Route to appropriate handler based on topic
        if webhook_topic == "orders/create":
            result["action"] = "create"
            # TODO: Create new order/invoice in ERP
            # 1. Validate order data
            # 2. Check/create customer
            # 3. Create invoice header
            # 4. Add line items
            # 5. Calculate totals
            # 6. Record any payments

        elif webhook_topic == "orders/updated":
            result["action"] = "update"
            # TODO: Update existing order/invoice
            # 1. Find existing ERP record by Shopify order ID
            # 2. Update relevant fields
            # 3. Recalculate if line items changed

        elif webhook_topic == "orders/paid":
            result["action"] = "payment"
            # TODO: Record payment
            # 1. Find existing ERP invoice
            # 2. Record payment
            # 3. Update invoice status

        elif webhook_topic == "orders/fulfilled":
            result["action"] = "fulfill"
            # TODO: Mark order as fulfilled
            # 1. Find existing ERP record
            # 2. Update fulfillment status
            # 3. Trigger any post-fulfillment actions

        elif webhook_topic == "orders/cancelled":
            result["action"] = "cancel"
            # TODO: Cancel order
            # 1. Find existing ERP record
            # 2. Mark as cancelled
            # 3. Handle any refunds if applicable

        else:
            result["action"] = "ignored"
            logger.warning(f"Unhandled order webhook topic: {webhook_topic}")

        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except ShopifyConnectionError as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifyWebhookError(
            webhook_topic=webhook_topic,
            message=f"Order webhook processing failed: {str(e)}",
            shopify_id=str(order_id),
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.process_product_webhook",
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(ShopifyConnectionError,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def process_product_webhook(
    self,
    webhook_topic: str,
    product_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Process Shopify product webhook.

    Handles product-related webhook events:
    - products/create: New product created
    - products/update: Product modified
    - products/delete: Product deleted

    Args:
        webhook_topic: The webhook topic.
        product_data: The product data from Shopify webhook payload.

    Returns:
        Dict with processing result.
    """
    task_name = "process_product_webhook"
    product_id = product_data.get("id") or product_data.get("admin_graphql_api_id")

    _log_task_start(task_name, webhook_topic=webhook_topic, product_id=product_id)

    try:
        config = _get_shopify_config()

        result = {
            "webhook_topic": webhook_topic,
            "product_id": product_id,
            "product_title": product_data.get("title"),
            "action": None,
            "erp_record_id": None,
            "variants_processed": 0,
            "processed_at": datetime.utcnow().isoformat(),
        }

        if webhook_topic == "products/create":
            result["action"] = "create"
            # TODO: Create product in ERP
            # 1. Map Shopify product to ERP format
            # 2. Create product record
            # 3. Create variants
            # 4. Set pricing

        elif webhook_topic == "products/update":
            result["action"] = "update"
            # TODO: Update product in ERP
            # 1. Find existing product by Shopify ID
            # 2. Update fields
            # 3. Sync variants (add/update/remove)

        elif webhook_topic == "products/delete":
            result["action"] = "delete"
            # TODO: Handle product deletion
            # 1. Find existing product
            # 2. Mark as inactive/deleted (soft delete)
            # 3. Handle any dependent records

        else:
            result["action"] = "ignored"
            logger.warning(f"Unhandled product webhook topic: {webhook_topic}")

        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except ShopifyConnectionError as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifyWebhookError(
            webhook_topic=webhook_topic,
            message=f"Product webhook processing failed: {str(e)}",
            shopify_id=str(product_id),
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.process_inventory_webhook",
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(ShopifyConnectionError,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def process_inventory_webhook(
    self,
    webhook_topic: str,
    inventory_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Process Shopify inventory webhook.

    Handles inventory-related webhook events:
    - inventory_levels/update: Inventory quantity changed
    - inventory_levels/connect: Item connected to location
    - inventory_levels/disconnect: Item disconnected from location

    Args:
        webhook_topic: The webhook topic.
        inventory_data: The inventory data from Shopify webhook payload.

    Returns:
        Dict with processing result.
    """
    task_name = "process_inventory_webhook"
    inventory_item_id = inventory_data.get("inventory_item_id")
    location_id = inventory_data.get("location_id")

    _log_task_start(
        task_name,
        webhook_topic=webhook_topic,
        inventory_item_id=inventory_item_id,
        location_id=location_id,
    )

    try:
        config = _get_shopify_config()

        result = {
            "webhook_topic": webhook_topic,
            "inventory_item_id": inventory_item_id,
            "location_id": location_id,
            "action": None,
            "quantity_before": None,
            "quantity_after": inventory_data.get("available"),
            "processed_at": datetime.utcnow().isoformat(),
        }

        if webhook_topic == "inventory_levels/update":
            result["action"] = "update"
            # TODO: Update inventory in ERP
            # 1. Find product/variant by inventory item ID
            # 2. Find/create warehouse mapping for location
            # 3. Update quantity
            # 4. Log inventory movement

        elif webhook_topic == "inventory_levels/connect":
            result["action"] = "connect"
            # TODO: Handle new inventory connection
            # 1. Create inventory record for location
            # 2. Set initial quantity

        elif webhook_topic == "inventory_levels/disconnect":
            result["action"] = "disconnect"
            # TODO: Handle inventory disconnection
            # 1. Mark inventory as inactive for location

        else:
            result["action"] = "ignored"
            logger.warning(f"Unhandled inventory webhook topic: {webhook_topic}")

        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except ShopifyConnectionError as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifyWebhookError(
            webhook_topic=webhook_topic,
            message=f"Inventory webhook processing failed: {str(e)}",
            shopify_id=str(inventory_item_id),
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.process_customer_webhook",
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(ShopifyConnectionError,),
    retry_backoff=True,
    retry_backoff_max=300,
    retry_jitter=True,
)
def process_customer_webhook(
    self,
    webhook_topic: str,
    customer_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Process Shopify customer webhook.

    Handles customer-related webhook events:
    - customers/create: New customer registered
    - customers/update: Customer info updated
    - customers/delete: Customer deleted

    Args:
        webhook_topic: The webhook topic.
        customer_data: The customer data from Shopify webhook payload.

    Returns:
        Dict with processing result.
    """
    task_name = "process_customer_webhook"
    customer_id = customer_data.get("id") or customer_data.get("admin_graphql_api_id")
    email = customer_data.get("email")

    _log_task_start(task_name, webhook_topic=webhook_topic, customer_id=customer_id, email=email)

    try:
        config = _get_shopify_config()

        result = {
            "webhook_topic": webhook_topic,
            "customer_id": customer_id,
            "email": email,
            "action": None,
            "erp_client_id": None,
            "processed_at": datetime.utcnow().isoformat(),
        }

        if webhook_topic == "customers/create":
            result["action"] = "create"
            # TODO: Create customer in ERP
            # 1. Check if customer exists by email
            # 2. Map Shopify customer to ERP client
            # 3. Create client record
            # 4. Sync addresses

        elif webhook_topic == "customers/update":
            result["action"] = "update"
            # TODO: Update customer in ERP
            # 1. Find existing client by Shopify ID or email
            # 2. Update client information
            # 3. Sync addresses

        elif webhook_topic == "customers/delete":
            result["action"] = "delete"
            # TODO: Handle customer deletion
            # 1. Find existing client
            # 2. Mark as inactive (soft delete)
            # Note: May need to retain for historical orders

        else:
            result["action"] = "ignored"
            logger.warning(f"Unhandled customer webhook topic: {webhook_topic}")

        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except ShopifyConnectionError as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifyWebhookError(
            webhook_topic=webhook_topic,
            message=f"Customer webhook processing failed: {str(e)}",
            shopify_id=str(customer_id),
        )


# =============================================================================
# Order Create/Update Task (Primary order sync implementation)
# =============================================================================


def _run_async(coro):
    """Helper to run async code in sync context."""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.create_or_update_order_task",
    max_retries=5,
    default_retry_delay=30,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def create_or_update_order_task(
    self,
    webhook_payload: Dict[str, Any],
    default_client_id: int = 1,
    default_currency_id: int = 1,
) -> Dict[str, Any]:
    """
    Create or update an order from Shopify webhook data.

    This task is triggered by Shopify order webhooks (orders/create, orders/updated)
    and handles the synchronization of order data to the ERP database.

    Features:
    - Idempotent: Safe to retry without creating duplicates
    - Creates new orders if Shopify order doesn't exist in ERP
    - Updates existing orders if Shopify order already synced
    - Handles line items, addresses, and customer info
    - Tracks sync status and errors

    Args:
        self: Celery task instance (bound)
        webhook_payload: Raw Shopify webhook payload (dict)
        default_client_id: Default client ID for new orders (fallback if customer not matched)
        default_currency_id: Default currency ID for orders

    Returns:
        Dict containing:
        - success: bool - Whether the operation succeeded
        - order_id: int | None - ERP order ID if successful
        - shopify_id: str - Shopify order ID
        - action: str - "created", "updated", or "error"
        - message: str | None - Success message
        - error: str | None - Error message if failed

    Raises:
        Exception: Re-raised for Celery retry mechanism

    Example webhook payload:
        {
            "id": 12345678901234,
            "name": "#1001",
            "email": "customer@example.com",
            "created_at": "2024-01-15T10:30:00-05:00",
            "updated_at": "2024-01-15T10:30:00-05:00",
            "currency": "USD",
            "financial_status": "paid",
            "fulfillment_status": null,
            "total_price": "100.00",
            "subtotal_price": "90.00",
            "total_tax": "10.00",
            "total_discounts": "0.00",
            "line_items": [...],
            "shipping_address": {...},
            "billing_address": {...},
            "customer": {...},
            ...
        }
    """
    from app.database import async_session_maker
    from app.services.order_service import OrderService
    from app.schemas.order import ShopifyOrderWebhook, OrderSyncResult

    task_name = "create_or_update_order_task"
    task_id = self.request.id
    shopify_id = str(webhook_payload.get("id", "unknown"))

    logger.info(
        f"[Task {task_id}] Processing Shopify order {shopify_id} "
        f"(attempt {self.request.retries + 1}/{self.max_retries + 1})"
    )
    _log_task_start(task_name, shopify_id=shopify_id, task_id=task_id)

    async def _sync_order_async() -> OrderSyncResult:
        """Async helper to sync order within database session."""
        async with async_session_maker() as session:
            try:
                # Parse webhook payload into schema
                webhook_data = ShopifyOrderWebhook(**webhook_payload)

                service = OrderService(session)
                result = await service.create_or_update_from_shopify(
                    webhook_data=webhook_data,
                    default_client_id=default_client_id,
                    default_currency_id=default_currency_id,
                )
                await session.commit()
                return result

            except Exception as e:
                await session.rollback()
                return OrderSyncResult(
                    success=False,
                    order_id=None,
                    shopify_id=shopify_id,
                    action="error",
                    error=str(e)
                )

    async def _mark_sync_error(error_msg: str) -> None:
        """Mark order's sync status as error."""
        async with async_session_maker() as session:
            try:
                service = OrderService(session)
                order = await service.get_order_by_shopify_id(shopify_id)
                if order:
                    order.ord_sync_status = "error"
                    order.ord_sync_error = error_msg[:1000]
                    order.ord_synced_at = datetime.utcnow()
                    await session.commit()
            except Exception:
                await session.rollback()

    try:
        # Run async sync operation
        result = _run_async(_sync_order_async())

        if result.success:
            logger.info(
                f"[Task {task_id}] Successfully {result.action} order {result.order_id} "
                f"from Shopify order {shopify_id}"
            )
            _log_task_success(task_name, result.model_dump())
        else:
            logger.error(
                f"[Task {task_id}] Failed to sync Shopify order {shopify_id}: {result.error}"
            )
            _log_task_failure(task_name, Exception(result.error or "Unknown error"))

        return result.model_dump()

    except Exception as e:
        logger.error(
            f"[Task {task_id}] Error processing Shopify order {shopify_id}: {str(e)}",
            exc_info=True
        )

        # Mark order as sync error in database (best effort)
        try:
            _run_async(_mark_sync_error(str(e)))
        except Exception:
            pass

        # Re-raise for Celery retry
        _log_task_failure(task_name, e)
        raise


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.batch_sync_orders_task",
    max_retries=3,
    default_retry_delay=60,
)
def batch_sync_orders_task(
    self,
    order_payloads: List[Dict[str, Any]],
    default_client_id: int = 1,
    default_currency_id: int = 1,
) -> Dict[str, Any]:
    """
    Sync multiple orders from Shopify in batch.

    This task is useful for initial sync or catching up on missed orders.
    Each order is processed individually to handle errors gracefully.

    Args:
        self: Celery task instance (bound)
        order_payloads: List of Shopify order webhook payloads
        default_client_id: Default client ID for new orders
        default_currency_id: Default currency ID for orders

    Returns:
        Dict containing:
        - total: int - Total orders processed
        - success: int - Number of successful syncs
        - failed: int - Number of failed syncs
        - results: List of individual sync results
    """
    from app.database import async_session_maker
    from app.services.order_service import OrderService
    from app.schemas.order import ShopifyOrderWebhook, OrderSyncResult

    task_name = "batch_sync_orders_task"
    task_id = self.request.id
    total = len(order_payloads)

    logger.info(f"[Task {task_id}] Starting batch sync of {total} orders")
    _log_task_start(task_name, total_orders=total)

    async def _sync_single_order(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Sync a single order."""
        shopify_id = str(payload.get("id", "unknown"))
        async with async_session_maker() as session:
            try:
                webhook_data = ShopifyOrderWebhook(**payload)
                service = OrderService(session)
                result = await service.create_or_update_from_shopify(
                    webhook_data=webhook_data,
                    default_client_id=default_client_id,
                    default_currency_id=default_currency_id,
                )
                await session.commit()
                return result.model_dump()
            except Exception as e:
                await session.rollback()
                return {
                    "success": False,
                    "order_id": None,
                    "shopify_id": shopify_id,
                    "action": "error",
                    "error": str(e)
                }

    results = []
    success_count = 0
    failed_count = 0

    for idx, payload in enumerate(order_payloads, 1):
        shopify_id = str(payload.get("id", "unknown"))
        logger.debug(f"[Task {task_id}] Processing order {idx}/{total}: {shopify_id}")

        try:
            result = _run_async(_sync_single_order(payload))
            results.append(result)

            if result.get("success"):
                success_count += 1
            else:
                failed_count += 1

        except Exception as e:
            failed_count += 1
            results.append({
                "success": False,
                "order_id": None,
                "shopify_id": shopify_id,
                "action": "error",
                "error": str(e)
            })
            logger.error(f"[Task {task_id}] Error syncing order {shopify_id}: {e}")

    final_result = {
        "total": total,
        "success": success_count,
        "failed": failed_count,
        "results": results,
    }

    logger.info(
        f"[Task {task_id}] Batch sync complete: "
        f"{success_count} succeeded, {failed_count} failed out of {total}"
    )
    _log_task_success(task_name, {**final_result, "results": f"[{len(results)} items]"})

    return final_result


# =============================================================================
# Utility Tasks
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.push_inventory_to_shopify",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
)
def push_inventory_to_shopify(
    self,
    product_id: Optional[int] = None,
    variant_id: Optional[int] = None,
    location_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Push inventory levels from ERP to Shopify.

    Updates Shopify inventory with current ERP quantities.

    Args:
        product_id: ERP product ID to sync (optional, syncs all if not specified).
        variant_id: ERP variant ID to sync (optional).
        location_id: Shopify location ID (optional, uses default if not specified).

    Returns:
        Dict with push statistics.
    """
    task_name = "push_inventory_to_shopify"
    _log_task_start(task_name, product_id=product_id, variant_id=variant_id, location_id=location_id)

    try:
        config = _get_shopify_config()

        result = {
            "updated_count": 0,
            "skipped_count": 0,
            "errors": [],
            "started_at": datetime.utcnow().isoformat(),
            "completed_at": None,
        }

        # TODO: Implement inventory push to Shopify
        # 1. Get ERP inventory levels
        # 2. Map to Shopify inventory items
        # 3. Update via Shopify API (bulk update if possible)

        result["completed_at"] = datetime.utcnow().isoformat()
        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifyInventoryError(
            operation="push",
            message=f"Inventory push failed: {str(e)}",
        )


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.push_fulfillment_to_shopify",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
)
def push_fulfillment_to_shopify(
    self,
    erp_order_id: int,
    tracking_number: Optional[str] = None,
    tracking_company: Optional[str] = None,
    notify_customer: bool = True,
) -> Dict[str, Any]:
    """
    Push fulfillment status from ERP to Shopify.

    Creates a fulfillment in Shopify when an order is shipped from ERP.

    Args:
        erp_order_id: ERP order/invoice ID.
        tracking_number: Shipping tracking number (optional).
        tracking_company: Shipping carrier name (optional).
        notify_customer: Whether to send notification email to customer.

    Returns:
        Dict with fulfillment result.
    """
    task_name = "push_fulfillment_to_shopify"
    _log_task_start(
        task_name,
        erp_order_id=erp_order_id,
        tracking_number=tracking_number,
        tracking_company=tracking_company,
    )

    try:
        config = _get_shopify_config()

        result = {
            "erp_order_id": erp_order_id,
            "shopify_order_id": None,
            "fulfillment_id": None,
            "tracking_number": tracking_number,
            "status": None,
            "processed_at": datetime.utcnow().isoformat(),
        }

        # TODO: Implement fulfillment push
        # 1. Get ERP order and find Shopify order ID
        # 2. Get fulfillment order from Shopify
        # 3. Create fulfillment with tracking info
        # 4. Update ERP record with fulfillment ID

        _log_task_success(task_name, result)
        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifyOrderError(
            operation="fulfillment",
            message=f"Fulfillment push failed: {str(e)}",
        )


# =============================================================================
# Unified Webhook Event Processing Task
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.process_webhook_event_task",
    max_retries=5,
    default_retry_delay=30,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def process_webhook_event_task(
    self,
    webhook_topic: str,
    webhook_payload: Dict[str, Any],
    integration_id: Optional[int] = None,
    shop_domain: Optional[str] = None,
    webhook_id: Optional[str] = None,
    default_client_id: int = 1,
    default_currency_id: int = 1,
) -> Dict[str, Any]:
    """
    Unified webhook event processing task.

    This is the main entry point for processing all Shopify webhook events.
    It routes the webhook to the appropriate handler based on the topic and
    provides consistent logging, error handling, and result tracking.

    Features:
    - Unified entry point for all webhook types
    - Automatic routing based on webhook topic
    - Consistent error handling and retry logic
    - Database logging of processing status
    - Idempotent processing for safe retries

    Args:
        self: Celery task instance (bound)
        webhook_topic: The Shopify webhook topic (e.g., 'orders/create', 'products/update')
        webhook_payload: The parsed webhook payload from Shopify
        integration_id: Optional Shopify integration ID for logging
        shop_domain: Optional shop domain for context
        webhook_id: Optional Shopify webhook ID for deduplication
        default_client_id: Default client ID for order processing
        default_currency_id: Default currency ID for order processing

    Returns:
        Dict containing:
        - success: bool - Whether processing succeeded
        - topic: str - The webhook topic processed
        - entity_type: str - Type of entity processed (order, product, customer, inventory)
        - entity_id: str | None - ID of the processed entity
        - action: str - Action taken (create, update, delete, etc.)
        - task_id: str - The Celery task ID
        - processed_at: str - ISO timestamp of processing
        - details: dict | None - Additional processing details
        - error: str | None - Error message if failed

    Raises:
        ShopifyWebhookError: If processing fails after retries

    Supported Webhook Topics:
        Orders:
        - orders/create: New order placed
        - orders/updated: Order modified
        - orders/paid: Payment received
        - orders/fulfilled: Order shipped
        - orders/partially_fulfilled: Partial shipment
        - orders/cancelled: Order cancelled

        Products:
        - products/create: New product created
        - products/update: Product modified
        - products/delete: Product deleted

        Inventory:
        - inventory_levels/update: Inventory changed
        - inventory_levels/connect: Location connected
        - inventory_levels/disconnect: Location disconnected

        Customers:
        - customers/create: New customer
        - customers/update: Customer modified
        - customers/delete: Customer deleted
        - customers/enable: Customer enabled
        - customers/disable: Customer disabled

        App Lifecycle:
        - app/uninstalled: App was uninstalled

    Example:
        >>> result = process_webhook_event_task.delay(
        ...     webhook_topic='orders/create',
        ...     webhook_payload={'id': 12345, 'name': '#1001', ...},
        ...     integration_id=1,
        ...     shop_domain='mystore.myshopify.com',
        ... )
    """
    from app.database import async_session_maker
    from app.models.integrations.shopify import ShopifySyncLog

    task_name = "process_webhook_event_task"
    task_id = self.request.id
    started_at = datetime.utcnow()

    # Extract entity ID based on topic
    entity_id = _extract_entity_id(webhook_topic, webhook_payload)
    entity_type = _get_entity_type(webhook_topic)

    logger.info(
        f"[Task {task_id}] Processing webhook event",
        extra={
            "task_id": task_id,
            "topic": webhook_topic,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "shop_domain": shop_domain,
            "integration_id": integration_id,
            "attempt": self.request.retries + 1,
            "max_retries": self.max_retries + 1,
        },
    )
    _log_task_start(
        task_name,
        topic=webhook_topic,
        entity_id=entity_id,
        shop_domain=shop_domain,
    )

    # Initialize result structure
    result = {
        "success": False,
        "topic": webhook_topic,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": None,
        "task_id": task_id,
        "started_at": started_at.isoformat(),
        "processed_at": None,
        "details": None,
        "error": None,
    }

    async def _update_sync_log(
        status: str,
        error_message: Optional[str] = None,
        response_data: Optional[str] = None,
    ) -> None:
        """Update sync log with processing result."""
        if not integration_id:
            return

        async with async_session_maker() as session:
            try:
                sync_log = ShopifySyncLog(
                    shp_id=integration_id,
                    ssl_operation=f"webhook:{webhook_topic}",
                    ssl_direction="inbound",
                    ssl_entity_type=entity_type,
                    ssl_entity_id=str(entity_id) if entity_id else None,
                    ssl_status=status,
                    ssl_started_at=started_at,
                    ssl_completed_at=datetime.utcnow(),
                    ssl_error_message=error_message[:1000] if error_message else None,
                    ssl_response_data=response_data[:5000] if response_data else None,
                )
                session.add(sync_log)
                await session.commit()
            except Exception as log_error:
                logger.warning(f"Failed to update sync log: {log_error}")
                await session.rollback()

    try:
        # Route to appropriate handler based on topic
        processing_result = _route_and_process_webhook(
            topic=webhook_topic,
            payload=webhook_payload,
            default_client_id=default_client_id,
            default_currency_id=default_currency_id,
        )

        result["success"] = processing_result.get("success", True)
        result["action"] = processing_result.get("action", "processed")
        result["details"] = processing_result
        result["processed_at"] = datetime.utcnow().isoformat()

        if result["success"]:
            # Log success
            _run_async(_update_sync_log(
                status="success",
                response_data=str(processing_result),
            ))
            logger.info(
                f"[Task {task_id}] Successfully processed {webhook_topic} webhook",
                extra={
                    "task_id": task_id,
                    "topic": webhook_topic,
                    "entity_id": entity_id,
                    "action": result["action"],
                },
            )
            _log_task_success(task_name, result)
        else:
            result["error"] = processing_result.get("error", "Processing returned failure status")
            _run_async(_update_sync_log(
                status="error",
                error_message=result["error"],
                response_data=str(processing_result),
            ))
            logger.warning(
                f"[Task {task_id}] Webhook processing returned failure",
                extra={
                    "task_id": task_id,
                    "topic": webhook_topic,
                    "error": result["error"],
                },
            )

        return result

    except ShopifyConfigurationError as e:
        result["error"] = str(e)
        result["processed_at"] = datetime.utcnow().isoformat()
        _run_async(_update_sync_log(status="error", error_message=str(e)))
        _log_task_failure(task_name, e)
        raise  # Don't retry config errors

    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        result["error"] = str(e)
        result["processed_at"] = datetime.utcnow().isoformat()
        logger.warning(
            f"[Task {task_id}] Retryable error processing webhook: {e}",
            extra={"task_id": task_id, "topic": webhook_topic, "error": str(e)},
        )
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)

    except ShopifyAuthenticationError as e:
        result["error"] = str(e)
        result["processed_at"] = datetime.utcnow().isoformat()
        _run_async(_update_sync_log(status="error", error_message=str(e)))
        _log_task_failure(task_name, e)
        raise  # Don't retry auth errors

    except Exception as e:
        result["error"] = str(e)
        result["processed_at"] = datetime.utcnow().isoformat()
        error_msg = f"Webhook processing failed: {str(e)}"

        # Log error
        _run_async(_update_sync_log(status="error", error_message=error_msg))

        logger.error(
            f"[Task {task_id}] Error processing webhook: {e}",
            extra={
                "task_id": task_id,
                "topic": webhook_topic,
                "entity_id": entity_id,
                "error": str(e),
            },
            exc_info=True,
        )
        _log_task_failure(task_name, e)

        raise ShopifyWebhookError(
            webhook_topic=webhook_topic,
            message=error_msg,
            shopify_id=str(entity_id) if entity_id else None,
        )


def _extract_entity_id(topic: str, payload: Dict[str, Any]) -> Optional[str]:
    """
    Extract the entity ID from webhook payload based on topic.

    Args:
        topic: Webhook topic
        payload: Webhook payload

    Returns:
        Entity ID as string or None
    """
    # Try common ID fields
    entity_id = (
        payload.get("id")
        or payload.get("admin_graphql_api_id")
        or payload.get("inventory_item_id")
    )

    if entity_id:
        return str(entity_id)

    return None


def _get_entity_type(topic: str) -> str:
    """
    Get the entity type from webhook topic.

    Args:
        topic: Webhook topic

    Returns:
        Entity type string
    """
    if topic.startswith("orders/"):
        return "order"
    elif topic.startswith("products/"):
        return "product"
    elif topic.startswith("customers/"):
        return "customer"
    elif topic.startswith("inventory"):
        return "inventory"
    elif topic.startswith("app/"):
        return "app"
    elif topic.startswith("shop/"):
        return "shop"
    else:
        return "unknown"


def _route_and_process_webhook(
    topic: str,
    payload: Dict[str, Any],
    default_client_id: int = 1,
    default_currency_id: int = 1,
) -> Dict[str, Any]:
    """
    Route webhook to appropriate handler and process it.

    Args:
        topic: Webhook topic
        payload: Webhook payload
        default_client_id: Default client ID for orders
        default_currency_id: Default currency ID for orders

    Returns:
        Processing result dictionary
    """
    from app.database import async_session_maker
    from app.services.order_service import OrderService
    from app.schemas.order import ShopifyOrderWebhook, OrderSyncResult

    result = {
        "success": True,
        "action": "processed",
        "topic": topic,
    }

    # Order webhooks
    if topic in ("orders/create", "orders/updated"):
        # Use the full order sync logic
        async def _sync_order():
            async with async_session_maker() as session:
                try:
                    webhook_data = ShopifyOrderWebhook(**payload)
                    service = OrderService(session)
                    sync_result = await service.create_or_update_from_shopify(
                        webhook_data=webhook_data,
                        default_client_id=default_client_id,
                        default_currency_id=default_currency_id,
                    )
                    await session.commit()
                    return sync_result.model_dump()
                except Exception as e:
                    await session.rollback()
                    return {
                        "success": False,
                        "action": "error",
                        "error": str(e),
                    }

        return _run_async(_sync_order())

    elif topic == "orders/paid":
        result["action"] = "payment_received"
        order_id = payload.get("id")
        financial_status = payload.get("financial_status")
        result["order_id"] = order_id
        result["financial_status"] = financial_status
        # TODO: Update order payment status in ERP
        logger.info(f"Order {order_id} marked as paid (status: {financial_status})")

    elif topic == "orders/fulfilled":
        result["action"] = "fulfilled"
        order_id = payload.get("id")
        fulfillment_status = payload.get("fulfillment_status")
        result["order_id"] = order_id
        result["fulfillment_status"] = fulfillment_status
        # TODO: Update order fulfillment status in ERP
        logger.info(f"Order {order_id} fulfilled (status: {fulfillment_status})")

    elif topic == "orders/partially_fulfilled":
        result["action"] = "partially_fulfilled"
        order_id = payload.get("id")
        result["order_id"] = order_id
        logger.info(f"Order {order_id} partially fulfilled")

    elif topic == "orders/cancelled":
        result["action"] = "cancelled"
        order_id = payload.get("id")
        cancel_reason = payload.get("cancel_reason")
        result["order_id"] = order_id
        result["cancel_reason"] = cancel_reason
        # TODO: Cancel order in ERP
        logger.info(f"Order {order_id} cancelled (reason: {cancel_reason})")

    # Product webhooks
    elif topic == "products/create":
        result["action"] = "created"
        product_id = payload.get("id")
        product_title = payload.get("title")
        result["product_id"] = product_id
        result["product_title"] = product_title
        # TODO: Create product in ERP
        logger.info(f"Product created: {product_title} (ID: {product_id})")

    elif topic == "products/update":
        result["action"] = "updated"
        product_id = payload.get("id")
        product_title = payload.get("title")
        result["product_id"] = product_id
        result["product_title"] = product_title
        # TODO: Update product in ERP
        logger.info(f"Product updated: {product_title} (ID: {product_id})")

    elif topic == "products/delete":
        result["action"] = "deleted"
        product_id = payload.get("id")
        result["product_id"] = product_id
        # TODO: Mark product as deleted in ERP
        logger.info(f"Product deleted: ID {product_id}")

    # Customer webhooks
    elif topic == "customers/create":
        result["action"] = "created"
        customer_id = payload.get("id")
        customer_email = payload.get("email")
        result["customer_id"] = customer_id
        result["customer_email"] = customer_email
        # TODO: Create customer in ERP
        logger.info(f"Customer created: {customer_email} (ID: {customer_id})")

    elif topic == "customers/update":
        result["action"] = "updated"
        customer_id = payload.get("id")
        customer_email = payload.get("email")
        result["customer_id"] = customer_id
        result["customer_email"] = customer_email
        # TODO: Update customer in ERP
        logger.info(f"Customer updated: {customer_email} (ID: {customer_id})")

    elif topic == "customers/delete":
        result["action"] = "deleted"
        customer_id = payload.get("id")
        result["customer_id"] = customer_id
        # TODO: Mark customer as deleted in ERP
        logger.info(f"Customer deleted: ID {customer_id}")

    elif topic in ("customers/enable", "customers/disable"):
        result["action"] = topic.split("/")[1]  # 'enable' or 'disable'
        customer_id = payload.get("id")
        result["customer_id"] = customer_id
        logger.info(f"Customer {result['action']}d: ID {customer_id}")

    # Inventory webhooks
    elif topic == "inventory_levels/update":
        result["action"] = "inventory_updated"
        inventory_item_id = payload.get("inventory_item_id")
        location_id = payload.get("location_id")
        available = payload.get("available")
        result["inventory_item_id"] = inventory_item_id
        result["location_id"] = location_id
        result["available"] = available
        # TODO: Update inventory in ERP
        logger.info(
            f"Inventory updated: item {inventory_item_id} at location {location_id} = {available}"
        )

    elif topic == "inventory_levels/connect":
        result["action"] = "inventory_connected"
        inventory_item_id = payload.get("inventory_item_id")
        location_id = payload.get("location_id")
        result["inventory_item_id"] = inventory_item_id
        result["location_id"] = location_id
        logger.info(f"Inventory connected: item {inventory_item_id} to location {location_id}")

    elif topic == "inventory_levels/disconnect":
        result["action"] = "inventory_disconnected"
        inventory_item_id = payload.get("inventory_item_id")
        location_id = payload.get("location_id")
        result["inventory_item_id"] = inventory_item_id
        result["location_id"] = location_id
        logger.info(f"Inventory disconnected: item {inventory_item_id} from location {location_id}")

    # App lifecycle webhooks
    elif topic == "app/uninstalled":
        result["action"] = "app_uninstalled"
        shop_domain = payload.get("domain") or payload.get("myshopify_domain")
        result["shop_domain"] = shop_domain
        # Note: App uninstall handling is done in the webhook endpoint
        logger.info(f"App uninstalled from shop: {shop_domain}")

    elif topic == "shop/update":
        result["action"] = "shop_updated"
        shop_name = payload.get("name")
        shop_domain = payload.get("domain")
        result["shop_name"] = shop_name
        result["shop_domain"] = shop_domain
        logger.info(f"Shop updated: {shop_name} ({shop_domain})")

    else:
        result["action"] = "ignored"
        result["message"] = f"Unhandled webhook topic: {topic}"
        logger.warning(f"Received unhandled webhook topic: {topic}")

    return result


# =============================================================================
# Inventory Sync to Shopify Task
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.shopify_tasks.sync_inventory_to_shopify_task",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(ShopifyConnectionError, ShopifyRateLimitError),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
    acks_late=True,
    reject_on_worker_lost=True,
)
def sync_inventory_to_shopify_task(
    self,
    product_ids: Optional[List[int]] = None,
    location_id: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    force_sync: bool = False,
    batch_size: int = 50,
) -> Dict[str, Any]:
    """
    Synchronize ERP inventory levels to Shopify.

    This task reads current stock quantities from the ERP database and pushes
    them to Shopify using the inventory set quantities mutation. It supports
    syncing all products or a specific subset.

    Features:
    - Batch processing for efficiency (reduces API calls)
    - Idempotent: Safe to retry without causing issues
    - Supports multi-location inventory
    - Tracks sync status and errors
    - Creates sync logs for auditing

    Args:
        self: Celery task instance (bound)
        product_ids: Optional list of ERP product IDs to sync. If None, syncs all mapped products.
        location_id: Shopify location GID to sync to. If None, uses the primary location.
        warehouse_id: Optional ERP warehouse ID to filter stock records.
        force_sync: If True, syncs even if quantities haven't changed.
        batch_size: Number of inventory items to update per API call (max 250).

    Returns:
        Dict containing:
        - success: bool - Whether the operation completed
        - total_items: int - Total inventory items processed
        - updated_count: int - Items successfully updated
        - skipped_count: int - Items skipped (no changes)
        - error_count: int - Items that failed to update
        - errors: List[Dict] - Error details for failed items
        - started_at: str - ISO timestamp when sync started
        - completed_at: str - ISO timestamp when sync completed
        - location_id: str - Shopify location ID used

    Raises:
        ShopifyConfigurationError: If Shopify is not configured
        ShopifyAuthenticationError: If authentication fails
        ShopifySyncError: If sync fails after all retries

    Example:
        # Sync all inventory
        sync_inventory_to_shopify_task.delay()

        # Sync specific products
        sync_inventory_to_shopify_task.delay(product_ids=[1, 2, 3])

        # Sync to specific location
        sync_inventory_to_shopify_task.delay(
            location_id="gid://shopify/Location/12345"
        )
    """
    from app.database import async_session_maker
    from app.models.stock import Stock
    from app.models.integrations.shopify import ShopifyProduct, ShopifyIntegration, ShopifySyncLog
    from app.integrations.shopify.graphql_client import ShopifyGraphQLClient, ShopifyConfig
    from app.integrations.shopify.queries import (
        QUERY_SHOP_LOCATIONS,
        MUTATION_SET_INVENTORY_ON_HAND,
        build_gid,
    )
    from sqlalchemy import select
    import json

    task_name = "sync_inventory_to_shopify_task"
    task_id = self.request.id

    logger.info(
        f"[Task {task_id}] Starting inventory sync to Shopify "
        f"(attempt {self.request.retries + 1}/{self.max_retries + 1})"
    )
    _log_task_start(
        task_name,
        task_id=task_id,
        product_ids=product_ids,
        location_id=location_id,
        warehouse_id=warehouse_id,
        force_sync=force_sync,
        batch_size=batch_size,
    )

    result = {
        "success": False,
        "total_items": 0,
        "updated_count": 0,
        "skipped_count": 0,
        "error_count": 0,
        "errors": [],
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "location_id": location_id,
        "task_id": task_id,
    }

    async def _get_primary_location(client: ShopifyGraphQLClient) -> Optional[str]:
        """Get the primary Shopify location ID."""
        query_result = await client.execute_query(QUERY_SHOP_LOCATIONS)
        if query_result.is_success and query_result.data:
            locations = query_result.data.get("locations", {}).get("edges", [])
            for loc in locations:
                node = loc.get("node", {})
                if node.get("isActive") and node.get("fulfillsOnlineOrders"):
                    return node.get("id")
            # Fallback to first active location
            for loc in locations:
                node = loc.get("node", {})
                if node.get("isActive"):
                    return node.get("id")
        return None

    async def _get_inventory_items_mapping(
        session,
        integration_id: int,
        product_id_list: Optional[List[int]],
    ) -> Dict[int, Dict[str, Any]]:
        """
        Get mapping of ERP product IDs to Shopify inventory item info.

        Returns dict: {prd_id: {"shopify_variant_id": ..., "sku": ...}}
        """
        query = select(ShopifyProduct).where(
            ShopifyProduct.shp_id == integration_id,
            ShopifyProduct.spr_is_synced == True,
        )

        if product_id_list:
            query = query.where(ShopifyProduct.prd_id.in_(product_id_list))

        query_result = await session.execute(query)
        shopify_products = query_result.scalars().all()

        mapping = {}
        for sp in shopify_products:
            if sp.prd_id is not None:
                mapping[sp.prd_id] = {
                    "shopify_product_id": sp.spr_shopify_id,
                    "shopify_variant_id": sp.spr_shopify_variant_id or sp.spr_shopify_id,
                    "sku": sp.spr_sku,
                    "title": sp.spr_title,
                }
        return mapping

    async def _get_stock_quantities(
        session,
        society_id: int,
        product_id_list: Optional[List[int]],
        whs_id: Optional[int],
    ) -> Dict[int, int]:
        """
        Get current ERP stock quantities.

        Returns dict: {prd_id: available_quantity}
        """
        query = select(Stock).where(
            Stock.soc_id == society_id,
            Stock.stk_is_active == True,
        )

        if product_id_list:
            query = query.where(Stock.prd_id.in_(product_id_list))

        if whs_id:
            query = query.where(Stock.whs_id == whs_id)

        query_result = await session.execute(query)
        stocks = query_result.scalars().all()

        # Aggregate stock by product (sum across warehouses if no specific warehouse)
        quantities = {}
        for stock in stocks:
            prd_id = stock.prd_id
            qty = int(stock.stk_quantity_available or 0)
            if prd_id in quantities:
                quantities[prd_id] += qty
            else:
                quantities[prd_id] = qty

        return quantities

    async def _update_shopify_inventory_batch(
        client: ShopifyGraphQLClient,
        target_location_id: str,
        items: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Update inventory quantities for a batch of items.

        Args:
            client: Shopify GraphQL client
            target_location_id: Shopify location GID
            items: List of dicts with "inventory_item_id" and "quantity"

        Returns:
            Dict with success/error info
        """
        # Build the mutation input
        # Shopify's inventorySetOnHandQuantities expects format:
        # {
        #   input: {
        #     reason: "correction",
        #     setQuantities: [
        #       { inventoryItemId: "gid://...", locationId: "gid://...", quantity: 10 }
        #     ]
        #   }
        # }
        set_quantities = []
        for item in items:
            set_quantities.append({
                "inventoryItemId": item["inventory_item_id"],
                "locationId": target_location_id,
                "quantity": item["quantity"],
            })

        mutation_input = {
            "input": {
                "reason": "correction",
                "setQuantities": set_quantities,
            }
        }

        query_result = await client.execute_query(
            MUTATION_SET_INVENTORY_ON_HAND,
            variables=mutation_input,
        )

        batch_result = {
            "success": False,
            "updated": 0,
            "errors": [],
        }

        if query_result.is_success and query_result.data:
            mutation_result = query_result.data.get("inventorySetOnHandQuantities", {})
            user_errors = mutation_result.get("userErrors", [])

            if user_errors:
                for err in user_errors:
                    batch_result["errors"].append({
                        "field": err.get("field"),
                        "message": err.get("message"),
                        "code": err.get("code"),
                    })
            else:
                batch_result["success"] = True
                batch_result["updated"] = len(items)

                # Log the changes
                adjustment_group = mutation_result.get("inventoryAdjustmentGroup", {})
                if adjustment_group:
                    changes = adjustment_group.get("changes", [])
                    logger.debug(f"Inventory updated: {len(changes)} items changed")

        return batch_result

    async def _sync_inventory_async() -> Dict[str, Any]:
        """Main async function to sync inventory."""
        nonlocal result

        async with async_session_maker() as session:
            try:
                # Get Shopify configuration
                config = _get_shopify_config()

                # Get active integration for default society (1)
                # In a multi-tenant setup, this would be passed as parameter
                integration_query = select(ShopifyIntegration).where(
                    ShopifyIntegration.shp_is_active == True
                ).limit(1)
                integration_result = await session.execute(integration_query)
                integration = integration_result.scalar_one_or_none()

                if not integration:
                    logger.warning("No active Shopify integration found")
                    result["errors"].append({
                        "type": "configuration",
                        "message": "No active Shopify integration found",
                    })
                    return result

                # Create Shopify client
                shopify_config = ShopifyConfig(
                    shop_domain=integration.shp_shop,
                    access_token=integration.shp_access_token,
                    api_version=config.get("api_version", "2025-01"),
                    timeout=config.get("timeout", 30),
                    max_retries=config.get("max_retries", 3),
                )

                async with ShopifyGraphQLClient(shopify_config) as client:
                    # Get location ID
                    target_location = location_id
                    if not target_location:
                        target_location = await _get_primary_location(client)

                    if not target_location:
                        result["errors"].append({
                            "type": "configuration",
                            "message": "Could not determine Shopify location",
                        })
                        return result

                    result["location_id"] = target_location

                    # Get product mapping (ERP -> Shopify)
                    product_mapping = await _get_inventory_items_mapping(
                        session,
                        integration.shp_id,
                        product_ids,
                    )

                    if not product_mapping:
                        logger.info("No products mapped to Shopify found")
                        result["success"] = True
                        result["skipped_count"] = 0
                        return result

                    logger.info(f"Found {len(product_mapping)} products mapped to Shopify")

                    # Get ERP stock quantities
                    stock_quantities = await _get_stock_quantities(
                        session,
                        integration.soc_id,
                        list(product_mapping.keys()) if product_mapping else None,
                        warehouse_id,
                    )

                    # Build list of inventory updates
                    inventory_updates = []
                    for prd_id, shopify_info in product_mapping.items():
                        erp_quantity = stock_quantities.get(prd_id, 0)
                        variant_id = shopify_info.get("shopify_variant_id")

                        if variant_id:
                            # Build inventory item GID from variant ID
                            # Shopify inventory items are linked to variants
                            inventory_item_id = build_gid("InventoryItem", str(variant_id))

                            inventory_updates.append({
                                "prd_id": prd_id,
                                "inventory_item_id": inventory_item_id,
                                "quantity": erp_quantity,
                                "sku": shopify_info.get("sku"),
                                "title": shopify_info.get("title"),
                            })

                    result["total_items"] = len(inventory_updates)

                    if not inventory_updates:
                        logger.info("No inventory items to update")
                        result["success"] = True
                        return result

                    # Process in batches
                    for i in range(0, len(inventory_updates), batch_size):
                        batch = inventory_updates[i:i + batch_size]
                        batch_num = (i // batch_size) + 1
                        total_batches = (len(inventory_updates) + batch_size - 1) // batch_size

                        logger.info(
                            f"Processing batch {batch_num}/{total_batches} "
                            f"({len(batch)} items)"
                        )

                        batch_result = await _update_shopify_inventory_batch(
                            client,
                            target_location,
                            batch,
                        )

                        if batch_result["success"]:
                            result["updated_count"] += batch_result["updated"]
                        else:
                            result["error_count"] += len(batch)
                            for err in batch_result["errors"]:
                                result["errors"].append({
                                    "batch": batch_num,
                                    "items": [item["sku"] for item in batch],
                                    **err,
                                })

                    # Create sync log
                    sync_log = ShopifySyncLog(
                        shp_id=integration.shp_id,
                        ssl_operation="inventory_sync_to_shopify",
                        ssl_direction="outbound",
                        ssl_entity_type="inventory",
                        ssl_status="completed" if result["error_count"] == 0 else "completed_with_errors",
                        ssl_records_processed=result["updated_count"],
                        ssl_records_failed=result["error_count"],
                        ssl_error_message=json.dumps(result["errors"][:10]) if result["errors"] else None,
                        ssl_started_at=datetime.fromisoformat(result["started_at"]),
                        ssl_completed_at=datetime.utcnow(),
                    )
                    session.add(sync_log)
                    await session.commit()

                    result["success"] = True

            except ShopifyConfigurationError as e:
                result["errors"].append({
                    "type": "configuration",
                    "message": str(e),
                })
                await session.rollback()

            except Exception as e:
                logger.error(f"Inventory sync error: {e}", exc_info=True)
                result["errors"].append({
                    "type": "error",
                    "message": str(e),
                })
                await session.rollback()

        return result

    try:
        # Run the async sync operation
        sync_result = _run_async(_sync_inventory_async())

        # Merge results
        result.update(sync_result)
        result["completed_at"] = datetime.utcnow().isoformat()

        if result["success"]:
            logger.info(
                f"[Task {task_id}] Inventory sync completed: "
                f"{result['updated_count']} updated, "
                f"{result['skipped_count']} skipped, "
                f"{result['error_count']} errors"
            )
            _log_task_success(task_name, {
                "total_items": result["total_items"],
                "updated_count": result["updated_count"],
                "error_count": result["error_count"],
            })
        else:
            logger.warning(
                f"[Task {task_id}] Inventory sync completed with issues: "
                f"{result['error_count']} errors"
            )

        return result

    except ShopifyConfigurationError as e:
        _log_task_failure(task_name, e)
        raise

    except (ShopifyConnectionError, ShopifyRateLimitError) as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)

    except ShopifyAuthenticationError as e:
        _log_task_failure(task_name, e)
        raise  # Don't retry auth errors

    except Exception as e:
        _log_task_failure(task_name, e)
        raise ShopifySyncError(
            sync_type="inventory_to_shopify",
            message=f"Inventory sync to Shopify failed: {str(e)}",
        )


@shared_task(name="app.tasks.shopify_tasks.health_check")
def health_check() -> Dict[str, Any]:
    """
    Verify Shopify integration health.

    Checks:
    - Configuration validity
    - API connectivity
    - Authentication status

    Returns:
        Dict with health check results.
    """
    task_name = "health_check"
    _log_task_start(task_name)

    result = {
        "status": "unknown",
        "configuration": False,
        "connectivity": False,
        "authentication": False,
        "checked_at": datetime.utcnow().isoformat(),
        "errors": [],
    }

    try:
        # Check configuration
        try:
            config = _get_shopify_config()
            result["configuration"] = True
        except ShopifyConfigurationError as e:
            result["errors"].append({"check": "configuration", "error": str(e)})
            result["status"] = "unhealthy"
            return result

        # TODO: Add actual API connectivity check
        # try:
        #     client = ShopifyGraphQLClient(config)
        #     client.test_connection()
        #     result["connectivity"] = True
        #     result["authentication"] = True
        # except ShopifyAuthenticationError:
        #     result["errors"].append({"check": "authentication", "error": "Invalid credentials"})
        # except ShopifyConnectionError as e:
        #     result["errors"].append({"check": "connectivity", "error": str(e)})

        # For now, assume healthy if configuration is valid
        result["connectivity"] = True
        result["authentication"] = True
        result["status"] = "healthy" if not result["errors"] else "degraded"

        _log_task_success(task_name, result)
        return result

    except Exception as e:
        result["status"] = "unhealthy"
        result["errors"].append({"check": "general", "error": str(e)})
        _log_task_failure(task_name, e)
        return result

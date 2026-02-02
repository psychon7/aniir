"""
Shopify integration schemas.

Provides Pydantic models for Shopify OAuth flow and store management.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ==========================================================================
# OAuth Flow Schemas
# ==========================================================================

class ShopifyOAuthInitRequest(BaseModel):
    """Request to initiate Shopify OAuth flow."""
    shop_domain: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Shopify store domain (e.g., 'mystore.myshopify.com')",
        json_schema_extra={"example": "mystore.myshopify.com"}
    )
    redirect_uri: Optional[str] = Field(
        None,
        description="Custom redirect URI after OAuth (defaults to configured callback)",
        json_schema_extra={"example": "https://myapp.com/shopify/callback"}
    )
    scopes: Optional[List[str]] = Field(
        None,
        description="Requested OAuth scopes (defaults to configured scopes)",
        json_schema_extra={"example": ["read_products", "write_orders", "read_inventory"]}
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "shop_domain": "mystore.myshopify.com"
            }
        }
    }


class ShopifyOAuthInitResponse(BaseModel):
    """Response containing OAuth authorization URL."""
    success: bool = Field(default=True, description="Operation success status")
    authorization_url: str = Field(
        ...,
        description="URL to redirect user for Shopify authorization",
        json_schema_extra={"example": "https://mystore.myshopify.com/admin/oauth/authorize?client_id=..."}
    )
    state: str = Field(
        ...,
        description="OAuth state parameter for CSRF protection",
        json_schema_extra={"example": "abc123def456"}
    )


class ShopifyOAuthCallbackRequest(BaseModel):
    """Request model for OAuth callback validation."""
    code: str = Field(
        ...,
        min_length=1,
        description="Authorization code from Shopify"
    )
    shop: str = Field(
        ...,
        min_length=1,
        description="Shop domain from callback"
    )
    state: str = Field(
        ...,
        min_length=1,
        description="State parameter for CSRF validation"
    )
    timestamp: Optional[str] = Field(
        None,
        description="Timestamp from Shopify callback"
    )
    hmac: Optional[str] = Field(
        None,
        description="HMAC signature for request verification"
    )


class ShopifyOAuthCallbackResponse(BaseModel):
    """Response after successful OAuth callback."""
    success: bool = Field(default=True, description="Operation success status")
    shop_domain: str = Field(
        ...,
        description="Connected shop domain"
    )
    store_id: int = Field(
        ...,
        description="Internal store ID for the connected shop"
    )
    message: str = Field(
        default="Shopify store connected successfully",
        description="Status message"
    )


class ShopifyTokenRefreshResponse(BaseModel):
    """Response after token refresh."""
    success: bool = Field(default=True)
    shop_domain: str = Field(...)
    message: str = Field(default="Token refreshed successfully")


# ==========================================================================
# Store Management Schemas
# ==========================================================================

class ShopifyStoreInfo(BaseModel):
    """Information about a connected Shopify store."""
    id: int = Field(..., description="Internal store ID")
    shop_domain: str = Field(..., description="Shopify store domain")
    shop_name: Optional[str] = Field(None, description="Store display name")
    email: Optional[str] = Field(None, description="Store owner email")
    currency: Optional[str] = Field(None, description="Store currency")
    timezone: Optional[str] = Field(None, description="Store timezone")
    is_active: bool = Field(default=True, description="Whether connection is active")
    scopes: Optional[List[str]] = Field(None, description="Granted OAuth scopes")
    connected_at: Optional[datetime] = Field(None, description="When store was connected")
    last_sync_at: Optional[datetime] = Field(None, description="Last sync timestamp")

    model_config = {
        "from_attributes": True
    }


class ShopifyStoreListResponse(BaseModel):
    """Response containing list of connected stores."""
    success: bool = Field(default=True)
    items: List[ShopifyStoreInfo] = Field(default_factory=list)
    total: int = Field(default=0)


class ShopifyStoreStatusResponse(BaseModel):
    """Response for store connection status check."""
    success: bool = Field(default=True)
    shop_domain: str = Field(...)
    is_connected: bool = Field(...)
    is_active: bool = Field(...)
    token_valid: bool = Field(...)
    scopes: Optional[List[str]] = Field(None)
    last_verified_at: Optional[datetime] = Field(None)


class ShopifyDisconnectResponse(BaseModel):
    """Response after disconnecting a store."""
    success: bool = Field(default=True)
    shop_domain: str = Field(...)
    message: str = Field(default="Store disconnected successfully")


# ==========================================================================
# Error Schemas
# ==========================================================================

class ShopifyErrorDetail(BaseModel):
    """Shopify error detail structure."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(None, description="Additional error details")


class ShopifyErrorResponse(BaseModel):
    """Standard Shopify error response."""
    success: bool = Field(default=False)
    error: ShopifyErrorDetail = Field(...)


# ==========================================================================
# Webhook Schemas
# ==========================================================================

class ShopifyWebhookPayload(BaseModel):
    """Base webhook payload from Shopify."""
    topic: str = Field(..., description="Webhook topic (e.g., 'orders/create')")
    shop_domain: str = Field(..., description="Shop that sent the webhook")
    api_version: str = Field(..., description="API version used")
    webhook_id: Optional[str] = Field(None, description="Webhook ID")

    model_config = {
        "extra": "allow"  # Allow extra fields from webhook payload
    }


class ShopifyWebhookResponse(BaseModel):
    """Response for webhook processing."""
    success: bool = Field(default=True)
    message: str = Field(default="Webhook processed successfully")
    webhook_id: Optional[str] = Field(None)


# ==========================================================================
# Order Sync Schemas
# ==========================================================================

class OrderSyncRequest(BaseModel):
    """Request body for triggering order synchronization."""
    since_minutes: Optional[int] = Field(
        default=60,
        ge=1,
        le=43200,  # Max 30 days
        description="Sync orders updated within this many minutes (1-43200, default: 60)",
        json_schema_extra={"example": 60}
    )
    status: Optional[str] = Field(
        default=None,
        description="Filter by order status: 'any', 'open', 'closed', 'cancelled'",
        json_schema_extra={"example": "any"}
    )
    force_full: bool = Field(
        default=False,
        description="If True, ignores since_minutes and syncs all orders"
    )
    async_mode: bool = Field(
        default=True,
        description="If True, queues task and returns immediately. If False, waits for completion."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "since_minutes": 60,
                "status": "any",
                "force_full": False,
                "async_mode": True
            }
        }
    }


class OrderSyncStats(BaseModel):
    """Statistics from an order sync operation."""
    synced_count: int = Field(default=0, description="Total orders synchronized")
    created_count: int = Field(default=0, description="New orders created")
    updated_count: int = Field(default=0, description="Existing orders updated")
    skipped_count: int = Field(default=0, description="Orders skipped (no changes)")
    error_count: int = Field(default=0, description="Orders that failed to sync")


class OrderSyncError(BaseModel):
    """Details of an order sync error."""
    order_id: Optional[str] = Field(None, description="Shopify order ID")
    order_number: Optional[str] = Field(None, description="Shopify order number")
    error: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code if available")


class OrderSyncResponse(BaseModel):
    """Response for order sync operation."""
    success: bool = Field(..., description="Whether the sync operation was successful")
    store_id: int = Field(..., description="Store ID that was synced")
    shop_domain: str = Field(..., description="Shop domain that was synced")
    task_id: Optional[str] = Field(
        None,
        description="Celery task ID if async_mode=True"
    )
    status: str = Field(
        ...,
        description="Sync status: 'queued', 'in_progress', 'completed', 'failed'"
    )
    message: str = Field(..., description="Human-readable status message")
    sync_log_id: Optional[int] = Field(
        None,
        description="ID of the sync log record for tracking"
    )
    stats: Optional[OrderSyncStats] = Field(
        None,
        description="Sync statistics (only available when sync completes)"
    )
    errors: Optional[List[OrderSyncError]] = Field(
        None,
        description="List of errors encountered during sync"
    )
    started_at: Optional[datetime] = Field(None, description="When sync started")
    completed_at: Optional[datetime] = Field(None, description="When sync completed")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "store_id": 1,
                "shop_domain": "mystore.myshopify.com",
                "task_id": "abc123-def456-ghi789",
                "status": "queued",
                "message": "Order sync task queued successfully",
                "sync_log_id": 42,
                "stats": None,
                "errors": None,
                "started_at": "2025-01-31T10:00:00Z",
                "completed_at": None
            }
        }
    }


class OrderSyncStatusResponse(BaseModel):
    """Response for checking sync task status."""
    success: bool = Field(default=True)
    task_id: str = Field(..., description="Celery task ID")
    status: str = Field(
        ...,
        description="Task status: 'pending', 'started', 'success', 'failure', 'revoked'"
    )
    result: Optional[OrderSyncStats] = Field(
        None,
        description="Sync result if task completed successfully"
    )
    error: Optional[str] = Field(
        None,
        description="Error message if task failed"
    )
    progress: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Progress percentage (0-100) if available"
    )


# ==========================================================================
# Inventory Sync Schemas
# ==========================================================================

class InventorySyncRequest(BaseModel):
    """Request body for triggering inventory synchronization."""
    location_id: Optional[str] = Field(
        default=None,
        description="Specific Shopify location ID to sync. If not provided, syncs all locations.",
        json_schema_extra={"example": "gid://shopify/Location/123456789"}
    )
    force_full: bool = Field(
        default=False,
        description="If True, performs a full sync regardless of last sync time"
    )
    async_mode: bool = Field(
        default=True,
        description="If True, queues task and returns immediately. If False, waits for completion."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "location_id": None,
                "force_full": False,
                "async_mode": True
            }
        }
    }


class InventorySyncStats(BaseModel):
    """Statistics from an inventory sync operation."""
    synced_count: int = Field(default=0, description="Total inventory items synchronized")
    updated_count: int = Field(default=0, description="Inventory items updated")
    locations_synced: int = Field(default=0, description="Number of locations synced")
    error_count: int = Field(default=0, description="Items that failed to sync")


class InventorySyncError(BaseModel):
    """Details of an inventory sync error."""
    inventory_item_id: Optional[str] = Field(None, description="Shopify inventory item ID")
    location_id: Optional[str] = Field(None, description="Shopify location ID")
    sku: Optional[str] = Field(None, description="Product SKU")
    error: str = Field(..., description="Error message")
    error_code: Optional[str] = Field(None, description="Error code if available")


class InventorySyncResponse(BaseModel):
    """Response for inventory sync operation."""
    success: bool = Field(..., description="Whether the sync operation was successful")
    store_id: int = Field(..., description="Store ID that was synced")
    shop_domain: str = Field(..., description="Shop domain that was synced")
    task_id: Optional[str] = Field(
        None,
        description="Celery task ID if async_mode=True"
    )
    status: str = Field(
        ...,
        description="Sync status: 'queued', 'in_progress', 'completed', 'failed'"
    )
    message: str = Field(..., description="Human-readable status message")
    sync_log_id: Optional[int] = Field(
        None,
        description="ID of the sync log record for tracking"
    )
    stats: Optional[InventorySyncStats] = Field(
        None,
        description="Sync statistics (only available when sync completes)"
    )
    errors: Optional[List[InventorySyncError]] = Field(
        None,
        description="List of errors encountered during sync"
    )
    started_at: Optional[datetime] = Field(None, description="When sync started")
    completed_at: Optional[datetime] = Field(None, description="When sync completed")

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "store_id": 1,
                "shop_domain": "mystore.myshopify.com",
                "task_id": "abc123-def456-ghi789",
                "status": "queued",
                "message": "Inventory sync task queued successfully",
                "sync_log_id": 43,
                "stats": None,
                "errors": None,
                "started_at": "2025-01-31T10:00:00Z",
                "completed_at": None
            }
        }
    }


class InventorySyncStatusResponse(BaseModel):
    """Response for checking inventory sync task status."""
    success: bool = Field(default=True)
    task_id: str = Field(..., description="Celery task ID")
    status: str = Field(
        ...,
        description="Task status: 'pending', 'started', 'success', 'failure', 'revoked'"
    )
    result: Optional[InventorySyncStats] = Field(
        None,
        description="Sync result if task completed successfully"
    )
    error: Optional[str] = Field(
        None,
        description="Error message if task failed"
    )
    progress: Optional[int] = Field(
        None,
        ge=0,
        le=100,
        description="Progress percentage (0-100) if available"
    )

"""
Shopify Admin API Router.

Provides REST API endpoints for Shopify store administration and management.
These endpoints require admin authentication and are used for:
- Managing connected Shopify stores
- Viewing and configuring sync settings
- Triggering manual sync operations
- Managing registered webhooks
- Viewing sync logs and statistics

Endpoints:
- GET /admin/shopify/stores - List all connected stores
- GET /admin/shopify/stores/{store_id} - Get store details
- PUT /admin/shopify/stores/{store_id} - Update store settings
- DELETE /admin/shopify/stores/{store_id} - Disconnect a store
- POST /admin/shopify/stores/{store_id}/sync - Trigger manual sync
- GET /admin/shopify/stores/{store_id}/webhooks - List registered webhooks
- POST /admin/shopify/stores/{store_id}/webhooks - Register webhooks
- DELETE /admin/shopify/stores/{store_id}/webhooks/{webhook_id} - Delete a webhook
- GET /admin/shopify/stores/{store_id}/logs - Get sync logs
- GET /admin/shopify/stores/{store_id}/stats - Get sync statistics
- POST /admin/shopify/stores/{store_id}/test-connection - Test store connection
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.config import get_settings
from app.models.integrations.shopify import (
    ShopifyIntegration,
    ShopifyWebhook,
    ShopifySyncLog,
    ShopifyProduct,
    ShopifyOrder,
)
from app.dependencies import get_current_admin_user
from app.models.user import User
from app.integrations.shopify.graphql_client import ShopifyGraphQLClient, ShopifyConfig
from app.integrations.shopify.exceptions import (
    ShopifyError,
    ShopifyAuthenticationError,
    ShopifyConfigurationError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/shopify", tags=["Shopify Admin"])


# ==========================================================================
# Request/Response Schemas
# ==========================================================================


class StoreInfo(BaseModel):
    """Store information response."""
    id: int = Field(..., description="Internal store ID")
    shop_domain: str = Field(..., description="Shopify shop domain")
    is_active: bool = Field(..., description="Whether the store is active")
    scopes: List[str] = Field(default_factory=list, description="Granted OAuth scopes")
    connected_at: Optional[str] = Field(None, description="When the store was connected")
    last_used_at: Optional[str] = Field(None, description="Last API activity")
    society_id: int = Field(..., description="Associated society ID")
    user_id: int = Field(..., description="User who connected the store")
    products_count: Optional[int] = Field(None, description="Number of synced products")
    orders_count: Optional[int] = Field(None, description="Number of synced orders")


class StoreListResponse(BaseModel):
    """Response for listing stores."""
    success: bool = Field(default=True)
    stores: List[StoreInfo] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=20)


class StoreDetailResponse(BaseModel):
    """Detailed store information response."""
    success: bool = Field(default=True)
    store: StoreInfo
    shop_info: Optional[Dict[str, Any]] = Field(None, description="Live shop info from Shopify")
    webhooks: List[Dict[str, Any]] = Field(default_factory=list)
    recent_syncs: List[Dict[str, Any]] = Field(default_factory=list)


class StoreUpdateRequest(BaseModel):
    """Request to update store settings."""
    is_active: Optional[bool] = Field(None, description="Enable/disable the store")


class StoreUpdateResponse(BaseModel):
    """Response after updating store settings."""
    success: bool = Field(default=True)
    store: StoreInfo
    message: str = Field(..., description="Status message")


class WebhookInfo(BaseModel):
    """Webhook information."""
    id: int = Field(..., description="Internal webhook ID")
    shopify_id: Optional[int] = Field(None, description="Shopify webhook ID")
    topic: str = Field(..., description="Webhook topic")
    address: str = Field(..., description="Callback URL")
    is_active: bool = Field(..., description="Whether the webhook is active")
    created_at: str = Field(..., description="Creation timestamp")


class WebhookListResponse(BaseModel):
    """Response for listing webhooks."""
    success: bool = Field(default=True)
    webhooks: List[WebhookInfo] = Field(default_factory=list)
    total: int = Field(default=0)


class WebhookRegisterRequest(BaseModel):
    """Request to register webhooks."""
    topics: List[str] = Field(
        ...,
        description="List of webhook topics to register",
        json_schema_extra={
            "example": ["orders/create", "orders/updated", "products/create", "products/update"]
        }
    )


class WebhookRegisterResponse(BaseModel):
    """Response after registering webhooks."""
    success: bool = Field(default=True)
    registered: int = Field(default=0)
    failed: int = Field(default=0)
    results: List[Dict[str, Any]] = Field(default_factory=list)
    message: str = Field(..., description="Status message")


class SyncTriggerRequest(BaseModel):
    """Request to trigger manual sync."""
    sync_type: str = Field(
        default="full",
        description="Type of sync: 'full', 'products', 'orders', 'inventory'",
        json_schema_extra={"example": "products"}
    )
    since: Optional[str] = Field(
        None,
        description="ISO datetime to sync changes since (for incremental sync)",
        json_schema_extra={"example": "2024-01-01T00:00:00Z"}
    )


class SyncTriggerResponse(BaseModel):
    """Response after triggering sync."""
    success: bool = Field(default=True)
    task_id: Optional[str] = Field(None, description="Celery task ID if async")
    sync_type: str = Field(..., description="Type of sync triggered")
    message: str = Field(..., description="Status message")


class SyncLogInfo(BaseModel):
    """Sync log entry information."""
    id: int = Field(..., description="Log entry ID")
    operation: str = Field(..., description="Sync operation type")
    direction: str = Field(..., description="Sync direction (inbound/outbound)")
    entity_type: Optional[str] = Field(None, description="Entity type synced")
    status: str = Field(..., description="Sync status")
    records_processed: Optional[int] = Field(None, description="Number of records processed")
    records_failed: Optional[int] = Field(None, description="Number of records failed")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    started_at: str = Field(..., description="Sync start time")
    completed_at: Optional[str] = Field(None, description="Sync completion time")
    duration_seconds: Optional[float] = Field(None, description="Duration in seconds")


class SyncLogsResponse(BaseModel):
    """Response for sync logs."""
    success: bool = Field(default=True)
    logs: List[SyncLogInfo] = Field(default_factory=list)
    total: int = Field(default=0)
    page: int = Field(default=1)
    page_size: int = Field(default=20)


class SyncStatsResponse(BaseModel):
    """Response for sync statistics."""
    success: bool = Field(default=True)
    store_id: int = Field(..., description="Store ID")
    period_days: int = Field(default=30, description="Statistics period in days")
    total_syncs: int = Field(default=0, description="Total sync operations")
    successful_syncs: int = Field(default=0, description="Successful syncs")
    failed_syncs: int = Field(default=0, description="Failed syncs")
    success_rate: float = Field(default=0.0, description="Success rate percentage")
    records_processed: int = Field(default=0, description="Total records processed")
    last_sync_at: Optional[str] = Field(None, description="Last sync timestamp")
    products_synced: int = Field(default=0, description="Products in database")
    orders_synced: int = Field(default=0, description="Orders in database")
    by_operation: Dict[str, int] = Field(default_factory=dict, description="Counts by operation type")
    by_status: Dict[str, int] = Field(default_factory=dict, description="Counts by status")


class ConnectionTestResponse(BaseModel):
    """Response for connection test."""
    success: bool = Field(default=True)
    is_connected: bool = Field(..., description="Whether connection is working")
    shop_name: Optional[str] = Field(None, description="Shop name from Shopify")
    shop_email: Optional[str] = Field(None, description="Shop email")
    currency: Optional[str] = Field(None, description="Shop currency")
    plan: Optional[str] = Field(None, description="Shopify plan")
    scopes_valid: bool = Field(default=True, description="Whether OAuth scopes are sufficient")
    message: str = Field(..., description="Status message")
    latency_ms: Optional[int] = Field(None, description="API response time in ms")


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = Field(default=False)
    error: Dict[str, Any] = Field(..., description="Error details")


# ==========================================================================
# Helper Functions
# ==========================================================================


async def get_store_by_id(
    store_id: int,
    db: AsyncSession,
    require_active: bool = False,
) -> ShopifyIntegration:
    """
    Get Shopify integration by ID.

    Args:
        store_id: The store/integration ID.
        db: Database session.
        require_active: If True, raise error if store is inactive.

    Returns:
        ShopifyIntegration instance.

    Raises:
        HTTPException: If store not found or inactive when required.
    """
    result = await db.execute(
        select(ShopifyIntegration)
        .options(selectinload(ShopifyIntegration.society))
        .options(selectinload(ShopifyIntegration.user))
        .where(ShopifyIntegration.shp_id == store_id)
    )
    store = result.scalar_one_or_none()

    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "STORE_NOT_FOUND",
                    "message": f"Store with ID {store_id} not found",
                    "details": {"store_id": store_id}
                }
            }
        )

    if require_active and not store.shp_is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "STORE_INACTIVE",
                    "message": f"Store {store.shp_shop} is inactive",
                    "details": {"store_id": store_id, "shop_domain": store.shp_shop}
                }
            }
        )

    return store


def build_store_info(
    store: ShopifyIntegration,
    products_count: int = 0,
    orders_count: int = 0,
) -> StoreInfo:
    """Build StoreInfo from model."""
    return StoreInfo(
        id=store.shp_id,
        shop_domain=store.shp_shop,
        is_active=store.shp_is_active,
        scopes=store.scopes,
        connected_at=store.shp_created_at.isoformat() if store.shp_created_at else None,
        last_used_at=store.shp_last_used_at.isoformat() if store.shp_last_used_at else None,
        society_id=store.soc_id,
        user_id=store.usr_id,
        products_count=products_count,
        orders_count=orders_count,
    )


async def get_shopify_client(store: ShopifyIntegration) -> ShopifyGraphQLClient:
    """
    Create a Shopify GraphQL client for a store.

    Args:
        store: ShopifyIntegration instance with access token.

    Returns:
        Configured ShopifyGraphQLClient.

    Raises:
        HTTPException: If store credentials are invalid.
    """
    settings = get_settings()

    if not store.shp_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "MISSING_ACCESS_TOKEN",
                    "message": "Store does not have a valid access token",
                    "details": {"store_id": store.shp_id}
                }
            }
        )

    config = ShopifyConfig(
        shop_domain=store.shp_shop,
        access_token=store.shp_access_token,
        api_version=settings.SHOPIFY_API_VERSION,
        timeout=settings.SHOPIFY_REQUEST_TIMEOUT,
        max_retries=settings.SHOPIFY_MAX_RETRIES,
    )

    return ShopifyGraphQLClient(config)


# ==========================================================================
# Store Management Endpoints
# ==========================================================================


@router.get(
    "/stores",
    response_model=StoreListResponse,
    summary="List connected stores",
    description="""
    Lists all connected Shopify stores with pagination.

    **Requires admin authentication.**

    Query Parameters:
    - `page`: Page number (default: 1)
    - `page_size`: Items per page (default: 20, max: 100)
    - `active_only`: Only show active stores (default: False)
    - `search`: Search by shop domain
    - `society_id`: Filter by society ID
    """,
    responses={
        200: {"description": "List of stores", "model": StoreListResponse},
        401: {"description": "Unauthorized", "model": ErrorResponse},
        403: {"description": "Forbidden - Admin required", "model": ErrorResponse},
    },
)
async def list_stores(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    active_only: bool = Query(False, description="Only return active stores"),
    search: Optional[str] = Query(None, description="Search by shop domain"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> StoreListResponse:
    """
    List all connected Shopify stores.

    Returns paginated list of stores with basic information.
    """
    # Build query
    query = select(ShopifyIntegration)

    # Apply filters
    conditions = []
    if active_only:
        conditions.append(ShopifyIntegration.shp_is_active == True)
    if search:
        conditions.append(ShopifyIntegration.shp_shop.ilike(f"%{search}%"))
    if society_id:
        conditions.append(ShopifyIntegration.soc_id == society_id)

    if conditions:
        query = query.where(and_(*conditions))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(desc(ShopifyIntegration.shp_created_at))

    result = await db.execute(query)
    stores = result.scalars().all()

    # Get counts for each store
    store_infos = []
    for store in stores:
        # Get products count
        products_count_result = await db.execute(
            select(func.count()).where(ShopifyProduct.shp_id == store.shp_id)
        )
        products_count = products_count_result.scalar() or 0

        # Get orders count
        orders_count_result = await db.execute(
            select(func.count()).where(ShopifyOrder.shp_id == store.shp_id)
        )
        orders_count = orders_count_result.scalar() or 0

        store_infos.append(build_store_info(store, products_count, orders_count))

    logger.info(
        f"Listed {len(store_infos)} stores (page {page}/{(total + page_size - 1) // page_size})",
        extra={"user_id": current_user.usr_id, "total": total}
    )

    return StoreListResponse(
        success=True,
        stores=store_infos,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/stores/{store_id}",
    response_model=StoreDetailResponse,
    summary="Get store details",
    description="""
    Get detailed information about a specific store.

    **Requires admin authentication.**

    Returns:
    - Store configuration and status
    - Live shop info from Shopify API (if connected)
    - Registered webhooks
    - Recent sync activity
    """,
    responses={
        200: {"description": "Store details", "model": StoreDetailResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def get_store_details(
    store_id: int = Path(..., description="Store ID", ge=1),
    include_shop_info: bool = Query(True, description="Fetch live shop info from Shopify"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> StoreDetailResponse:
    """
    Get detailed information about a specific store.
    """
    store = await get_store_by_id(store_id, db)

    # Get counts
    products_count_result = await db.execute(
        select(func.count()).where(ShopifyProduct.shp_id == store.shp_id)
    )
    products_count = products_count_result.scalar() or 0

    orders_count_result = await db.execute(
        select(func.count()).where(ShopifyOrder.shp_id == store.shp_id)
    )
    orders_count = orders_count_result.scalar() or 0

    store_info = build_store_info(store, products_count, orders_count)

    # Get webhooks
    webhooks_result = await db.execute(
        select(ShopifyWebhook).where(ShopifyWebhook.shp_id == store.shp_id)
    )
    webhooks = webhooks_result.scalars().all()
    webhook_list = [
        {
            "id": wh.swh_id,
            "shopify_id": wh.swh_shopify_id,
            "topic": wh.swh_topic,
            "address": wh.swh_address,
            "is_active": wh.swh_is_active,
            "created_at": wh.swh_created_at.isoformat() if wh.swh_created_at else None,
        }
        for wh in webhooks
    ]

    # Get recent sync logs
    logs_result = await db.execute(
        select(ShopifySyncLog)
        .where(ShopifySyncLog.shp_id == store.shp_id)
        .order_by(desc(ShopifySyncLog.ssl_started_at))
        .limit(10)
    )
    logs = logs_result.scalars().all()
    recent_syncs = [
        {
            "id": log.ssl_id,
            "operation": log.ssl_operation,
            "status": log.ssl_status,
            "started_at": log.ssl_started_at.isoformat() if log.ssl_started_at else None,
            "completed_at": log.ssl_completed_at.isoformat() if log.ssl_completed_at else None,
        }
        for log in logs
    ]

    # Optionally fetch live shop info
    shop_info = None
    if include_shop_info and store.shp_is_active and store.shp_access_token:
        try:
            client = await get_shopify_client(store)
            async with client:
                result = await client.get_shop_info()
                if result.is_success and result.data:
                    shop_data = result.data.get("shop", {})
                    shop_info = {
                        "name": shop_data.get("name"),
                        "email": shop_data.get("email"),
                        "currency": shop_data.get("currencyCode"),
                        "domain": shop_data.get("primaryDomain", {}).get("url"),
                        "plan": shop_data.get("plan", {}).get("displayName"),
                    }
        except Exception as e:
            logger.warning(f"Failed to fetch shop info for store {store_id}: {e}")
            shop_info = {"error": str(e)}

    logger.info(
        f"Retrieved store details for {store.shp_shop}",
        extra={"store_id": store_id, "user_id": current_user.usr_id}
    )

    return StoreDetailResponse(
        success=True,
        store=store_info,
        shop_info=shop_info,
        webhooks=webhook_list,
        recent_syncs=recent_syncs,
    )


@router.put(
    "/stores/{store_id}",
    response_model=StoreUpdateResponse,
    summary="Update store settings",
    description="""
    Update settings for a connected store.

    **Requires admin authentication.**

    Currently supports:
    - `is_active`: Enable or disable the store connection
    """,
    responses={
        200: {"description": "Store updated", "model": StoreUpdateResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def update_store(
    store_id: int = Path(..., description="Store ID", ge=1),
    request: StoreUpdateRequest = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> StoreUpdateResponse:
    """
    Update store settings.
    """
    store = await get_store_by_id(store_id, db)

    changes = []

    if request and request.is_active is not None:
        old_status = store.shp_is_active
        store.shp_is_active = request.is_active
        store.shp_updated_at = datetime.utcnow()
        changes.append(f"is_active: {old_status} -> {request.is_active}")

    if changes:
        await db.commit()
        await db.refresh(store)
        message = f"Store updated: {', '.join(changes)}"
    else:
        message = "No changes made"

    logger.info(
        f"Updated store {store.shp_shop}: {message}",
        extra={"store_id": store_id, "user_id": current_user.usr_id, "changes": changes}
    )

    return StoreUpdateResponse(
        success=True,
        store=build_store_info(store),
        message=message,
    )


@router.delete(
    "/stores/{store_id}",
    summary="Disconnect a store",
    description="""
    Disconnect a Shopify store.

    **Requires admin authentication.**

    This operation:
    - Marks the store as inactive
    - Clears the access token (optional)
    - Does NOT delete synced data (products, orders)

    Use `permanent=true` to completely remove the store record.
    """,
    responses={
        200: {"description": "Store disconnected"},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def disconnect_store(
    store_id: int = Path(..., description="Store ID", ge=1),
    permanent: bool = Query(False, description="Permanently delete the store record"),
    clear_token: bool = Query(True, description="Clear the access token"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Disconnect a Shopify store.
    """
    store = await get_store_by_id(store_id, db)
    shop_domain = store.shp_shop

    if permanent:
        await db.delete(store)
        await db.commit()
        message = f"Store {shop_domain} permanently deleted"
    else:
        store.shp_is_active = False
        store.shp_updated_at = datetime.utcnow()
        if clear_token:
            store.shp_access_token = ""
        await db.commit()
        message = f"Store {shop_domain} disconnected"

    logger.info(
        message,
        extra={
            "store_id": store_id,
            "shop_domain": shop_domain,
            "user_id": current_user.usr_id,
            "permanent": permanent,
        }
    )

    return {
        "success": True,
        "store_id": store_id,
        "shop_domain": shop_domain,
        "permanent": permanent,
        "message": message,
    }


# ==========================================================================
# Sync Endpoints
# ==========================================================================


@router.post(
    "/stores/{store_id}/sync",
    response_model=SyncTriggerResponse,
    summary="Trigger manual sync",
    description="""
    Trigger a manual synchronization for a store.

    **Requires admin authentication.**

    Sync types:
    - `full`: Sync all data (products, orders, inventory)
    - `products`: Sync only products
    - `orders`: Sync only orders
    - `inventory`: Sync only inventory levels

    Optional `since` parameter for incremental sync.
    """,
    responses={
        200: {"description": "Sync triggered", "model": SyncTriggerResponse},
        400: {"description": "Store inactive", "model": ErrorResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def trigger_sync(
    store_id: int = Path(..., description="Store ID", ge=1),
    request: SyncTriggerRequest = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> SyncTriggerResponse:
    """
    Trigger a manual sync operation.
    """
    store = await get_store_by_id(store_id, db, require_active=True)

    sync_type = request.sync_type if request else "full"

    # Log the sync request
    sync_log = ShopifySyncLog(
        shp_id=store.shp_id,
        ssl_operation=f"manual_sync:{sync_type}",
        ssl_direction="inbound",
        ssl_entity_type=sync_type if sync_type != "full" else "all",
        ssl_status="pending",
        ssl_started_at=datetime.utcnow(),
    )
    db.add(sync_log)
    await db.commit()

    # TODO: Queue the sync task via Celery
    # For now, we'll just return that the sync was requested
    # In production, this would call:
    # task = sync_shopify_data.delay(store_id=store_id, sync_type=sync_type, since=request.since)

    logger.info(
        f"Manual sync triggered for store {store.shp_shop}",
        extra={
            "store_id": store_id,
            "sync_type": sync_type,
            "user_id": current_user.usr_id,
        }
    )

    return SyncTriggerResponse(
        success=True,
        task_id=None,  # Would be task.id in production
        sync_type=sync_type,
        message=f"Sync ({sync_type}) queued for store {store.shp_shop}",
    )


@router.get(
    "/stores/{store_id}/logs",
    response_model=SyncLogsResponse,
    summary="Get sync logs",
    description="""
    Get synchronization logs for a store.

    **Requires admin authentication.**

    Query Parameters:
    - `page`: Page number
    - `page_size`: Items per page
    - `status`: Filter by status (pending, success, error)
    - `operation`: Filter by operation type
    """,
    responses={
        200: {"description": "Sync logs", "model": SyncLogsResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def get_sync_logs(
    store_id: int = Path(..., description="Store ID", ge=1),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    operation: Optional[str] = Query(None, description="Filter by operation type"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> SyncLogsResponse:
    """
    Get sync logs for a store.
    """
    store = await get_store_by_id(store_id, db)

    # Build query
    query = select(ShopifySyncLog).where(ShopifySyncLog.shp_id == store.shp_id)

    if status_filter:
        query = query.where(ShopifySyncLog.ssl_status == status_filter)
    if operation:
        query = query.where(ShopifySyncLog.ssl_operation.ilike(f"%{operation}%"))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(desc(ShopifySyncLog.ssl_started_at))

    result = await db.execute(query)
    logs = result.scalars().all()

    log_infos = []
    for log in logs:
        duration = None
        if log.ssl_started_at and log.ssl_completed_at:
            duration = (log.ssl_completed_at - log.ssl_started_at).total_seconds()

        log_infos.append(SyncLogInfo(
            id=log.ssl_id,
            operation=log.ssl_operation,
            direction=log.ssl_direction,
            entity_type=log.ssl_entity_type,
            status=log.ssl_status,
            records_processed=log.ssl_records_processed,
            records_failed=log.ssl_records_failed,
            error_message=log.ssl_error_message,
            started_at=log.ssl_started_at.isoformat() if log.ssl_started_at else "",
            completed_at=log.ssl_completed_at.isoformat() if log.ssl_completed_at else None,
            duration_seconds=duration,
        ))

    return SyncLogsResponse(
        success=True,
        logs=log_infos,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/stores/{store_id}/stats",
    response_model=SyncStatsResponse,
    summary="Get sync statistics",
    description="""
    Get synchronization statistics for a store.

    **Requires admin authentication.**

    Returns aggregated statistics over a configurable period.
    """,
    responses={
        200: {"description": "Sync statistics", "model": SyncStatsResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def get_sync_stats(
    store_id: int = Path(..., description="Store ID", ge=1),
    days: int = Query(30, ge=1, le=365, description="Statistics period in days"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> SyncStatsResponse:
    """
    Get sync statistics for a store.
    """
    store = await get_store_by_id(store_id, db)

    # Calculate date range
    since_date = datetime.utcnow() - timedelta(days=days)

    # Get total syncs
    total_result = await db.execute(
        select(func.count()).where(
            and_(
                ShopifySyncLog.shp_id == store.shp_id,
                ShopifySyncLog.ssl_started_at >= since_date,
            )
        )
    )
    total_syncs = total_result.scalar() or 0

    # Get successful syncs
    success_result = await db.execute(
        select(func.count()).where(
            and_(
                ShopifySyncLog.shp_id == store.shp_id,
                ShopifySyncLog.ssl_started_at >= since_date,
                ShopifySyncLog.ssl_status == "success",
            )
        )
    )
    successful_syncs = success_result.scalar() or 0

    # Get failed syncs
    failed_result = await db.execute(
        select(func.count()).where(
            and_(
                ShopifySyncLog.shp_id == store.shp_id,
                ShopifySyncLog.ssl_started_at >= since_date,
                ShopifySyncLog.ssl_status == "error",
            )
        )
    )
    failed_syncs = failed_result.scalar() or 0

    # Get total records processed
    records_result = await db.execute(
        select(func.sum(ShopifySyncLog.ssl_records_processed)).where(
            and_(
                ShopifySyncLog.shp_id == store.shp_id,
                ShopifySyncLog.ssl_started_at >= since_date,
            )
        )
    )
    records_processed = records_result.scalar() or 0

    # Get last sync time
    last_sync_result = await db.execute(
        select(ShopifySyncLog.ssl_started_at)
        .where(ShopifySyncLog.shp_id == store.shp_id)
        .order_by(desc(ShopifySyncLog.ssl_started_at))
        .limit(1)
    )
    last_sync_row = last_sync_result.scalar_one_or_none()
    last_sync_at = last_sync_row.isoformat() if last_sync_row else None

    # Get counts by operation
    operation_counts_result = await db.execute(
        select(ShopifySyncLog.ssl_operation, func.count())
        .where(
            and_(
                ShopifySyncLog.shp_id == store.shp_id,
                ShopifySyncLog.ssl_started_at >= since_date,
            )
        )
        .group_by(ShopifySyncLog.ssl_operation)
    )
    by_operation = dict(operation_counts_result.all())

    # Get counts by status
    status_counts_result = await db.execute(
        select(ShopifySyncLog.ssl_status, func.count())
        .where(
            and_(
                ShopifySyncLog.shp_id == store.shp_id,
                ShopifySyncLog.ssl_started_at >= since_date,
            )
        )
        .group_by(ShopifySyncLog.ssl_status)
    )
    by_status = dict(status_counts_result.all())

    # Get product and order counts
    products_count_result = await db.execute(
        select(func.count()).where(ShopifyProduct.shp_id == store.shp_id)
    )
    products_synced = products_count_result.scalar() or 0

    orders_count_result = await db.execute(
        select(func.count()).where(ShopifyOrder.shp_id == store.shp_id)
    )
    orders_synced = orders_count_result.scalar() or 0

    # Calculate success rate
    success_rate = (successful_syncs / total_syncs * 100) if total_syncs > 0 else 0.0

    return SyncStatsResponse(
        success=True,
        store_id=store_id,
        period_days=days,
        total_syncs=total_syncs,
        successful_syncs=successful_syncs,
        failed_syncs=failed_syncs,
        success_rate=round(success_rate, 2),
        records_processed=records_processed,
        last_sync_at=last_sync_at,
        products_synced=products_synced,
        orders_synced=orders_synced,
        by_operation=by_operation,
        by_status=by_status,
    )


# ==========================================================================
# Webhook Management Endpoints
# ==========================================================================


@router.get(
    "/stores/{store_id}/webhooks",
    response_model=WebhookListResponse,
    summary="List registered webhooks",
    description="""
    List all registered webhooks for a store.

    **Requires admin authentication.**
    """,
    responses={
        200: {"description": "Webhook list", "model": WebhookListResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def list_webhooks(
    store_id: int = Path(..., description="Store ID", ge=1),
    active_only: bool = Query(False, description="Only return active webhooks"),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> WebhookListResponse:
    """
    List registered webhooks for a store.
    """
    store = await get_store_by_id(store_id, db)

    query = select(ShopifyWebhook).where(ShopifyWebhook.shp_id == store.shp_id)

    if active_only:
        query = query.where(ShopifyWebhook.swh_is_active == True)

    result = await db.execute(query)
    webhooks = result.scalars().all()

    webhook_infos = [
        WebhookInfo(
            id=wh.swh_id,
            shopify_id=wh.swh_shopify_id,
            topic=wh.swh_topic,
            address=wh.swh_address,
            is_active=wh.swh_is_active,
            created_at=wh.swh_created_at.isoformat() if wh.swh_created_at else "",
        )
        for wh in webhooks
    ]

    return WebhookListResponse(
        success=True,
        webhooks=webhook_infos,
        total=len(webhook_infos),
    )


@router.post(
    "/stores/{store_id}/webhooks",
    response_model=WebhookRegisterResponse,
    summary="Register webhooks",
    description="""
    Register webhooks with Shopify for a store.

    **Requires admin authentication.**

    Available topics:
    - orders/create, orders/updated, orders/paid, orders/cancelled
    - products/create, products/update, products/delete
    - inventory_levels/update
    - customers/create, customers/update
    - app/uninstalled
    """,
    responses={
        200: {"description": "Webhooks registered", "model": WebhookRegisterResponse},
        400: {"description": "Store inactive", "model": ErrorResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def register_webhooks(
    store_id: int = Path(..., description="Store ID", ge=1),
    request: WebhookRegisterRequest = None,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> WebhookRegisterResponse:
    """
    Register webhooks with Shopify.
    """
    store = await get_store_by_id(store_id, db, require_active=True)
    settings = get_settings()

    if not request or not request.topics:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "MISSING_TOPICS",
                    "message": "At least one topic is required",
                }
            }
        )

    # Build base callback URL
    base_url = settings.CORS_ORIGINS[0] if settings.CORS_ORIGINS else "http://localhost:8000"
    callback_base = f"{base_url}/api/v1/integrations/webhooks/shopify/{store.shp_id}"

    results = []
    registered = 0
    failed = 0

    # Register each webhook via GraphQL
    try:
        client = await get_shopify_client(store)
        async with client:
            for topic in request.topics:
                callback_url = callback_base
                try:
                    # Register via Shopify Admin API
                    mutation = """
                        mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
                            webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
                                webhookSubscription {
                                    id
                                    topic
                                    endpoint {
                                        __typename
                                        ... on WebhookHttpEndpoint {
                                            callbackUrl
                                        }
                                    }
                                }
                                userErrors {
                                    field
                                    message
                                }
                            }
                        }
                    """

                    # Convert topic format (orders/create -> ORDERS_CREATE)
                    api_topic = topic.upper().replace("/", "_")

                    variables = {
                        "topic": api_topic,
                        "webhookSubscription": {
                            "callbackUrl": callback_url,
                            "format": "JSON",
                        }
                    }

                    result = await client.execute_query(mutation, variables=variables)

                    if result.is_success:
                        subscription_data = result.data.get("webhookSubscriptionCreate", {})
                        user_errors = subscription_data.get("userErrors", [])

                        if user_errors:
                            failed += 1
                            results.append({
                                "topic": topic,
                                "success": False,
                                "error": user_errors[0].get("message", "Unknown error"),
                            })
                        else:
                            webhook_sub = subscription_data.get("webhookSubscription", {})
                            shopify_id = webhook_sub.get("id")

                            # Extract numeric ID from GID
                            if shopify_id and "gid://" in shopify_id:
                                try:
                                    shopify_id_num = int(shopify_id.split("/")[-1])
                                except ValueError:
                                    shopify_id_num = None
                            else:
                                shopify_id_num = None

                            # Save to database
                            webhook_record = ShopifyWebhook(
                                shp_id=store.shp_id,
                                swh_shopify_id=shopify_id_num,
                                swh_topic=topic,
                                swh_address=callback_url,
                                swh_format="json",
                                swh_is_active=True,
                            )
                            db.add(webhook_record)

                            registered += 1
                            results.append({
                                "topic": topic,
                                "success": True,
                                "shopify_id": shopify_id,
                            })
                    else:
                        failed += 1
                        results.append({
                            "topic": topic,
                            "success": False,
                            "error": "GraphQL query failed",
                        })

                except Exception as e:
                    failed += 1
                    results.append({
                        "topic": topic,
                        "success": False,
                        "error": str(e),
                    })

    except ShopifyError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "error": {
                    "code": "SHOPIFY_ERROR",
                    "message": e.message,
                    "details": e.details if hasattr(e, "details") else None,
                }
            }
        )

    await db.commit()

    logger.info(
        f"Registered {registered} webhooks for store {store.shp_shop} ({failed} failed)",
        extra={"store_id": store_id, "user_id": current_user.usr_id}
    )

    return WebhookRegisterResponse(
        success=True,
        registered=registered,
        failed=failed,
        results=results,
        message=f"Registered {registered} webhooks ({failed} failed)",
    )


@router.delete(
    "/stores/{store_id}/webhooks/{webhook_id}",
    summary="Delete a webhook",
    description="""
    Delete a registered webhook.

    **Requires admin authentication.**
    """,
    responses={
        200: {"description": "Webhook deleted"},
        404: {"description": "Webhook not found", "model": ErrorResponse},
    },
)
async def delete_webhook(
    store_id: int = Path(..., description="Store ID", ge=1),
    webhook_id: int = Path(..., description="Webhook ID", ge=1),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a webhook registration.
    """
    store = await get_store_by_id(store_id, db)

    # Get the webhook
    result = await db.execute(
        select(ShopifyWebhook).where(
            and_(
                ShopifyWebhook.swh_id == webhook_id,
                ShopifyWebhook.shp_id == store.shp_id,
            )
        )
    )
    webhook = result.scalar_one_or_none()

    if not webhook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "success": False,
                "error": {
                    "code": "WEBHOOK_NOT_FOUND",
                    "message": f"Webhook {webhook_id} not found for store {store_id}",
                }
            }
        )

    topic = webhook.swh_topic

    # TODO: Also delete from Shopify via API
    # For now, just delete from database

    await db.delete(webhook)
    await db.commit()

    logger.info(
        f"Deleted webhook {webhook_id} ({topic}) for store {store.shp_shop}",
        extra={"store_id": store_id, "webhook_id": webhook_id, "user_id": current_user.usr_id}
    )

    return {
        "success": True,
        "webhook_id": webhook_id,
        "topic": topic,
        "message": f"Webhook {topic} deleted",
    }


# ==========================================================================
# Connection Test Endpoint
# ==========================================================================


@router.post(
    "/stores/{store_id}/test-connection",
    response_model=ConnectionTestResponse,
    summary="Test store connection",
    description="""
    Test the connection to a Shopify store.

    **Requires admin authentication.**

    This endpoint:
    - Verifies the access token is valid
    - Makes a test API call to Shopify
    - Returns shop information if successful
    - Reports latency and any errors
    """,
    responses={
        200: {"description": "Connection test result", "model": ConnectionTestResponse},
        404: {"description": "Store not found", "model": ErrorResponse},
    },
)
async def test_connection(
    store_id: int = Path(..., description="Store ID", ge=1),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> ConnectionTestResponse:
    """
    Test the connection to a Shopify store.
    """
    store = await get_store_by_id(store_id, db)

    if not store.shp_access_token:
        return ConnectionTestResponse(
            success=True,
            is_connected=False,
            scopes_valid=False,
            message="Store does not have an access token",
        )

    start_time = datetime.utcnow()

    try:
        client = await get_shopify_client(store)
        async with client:
            result = await client.get_shop_info()

            latency = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            if result.is_success and result.data:
                shop_data = result.data.get("shop", {})

                # Update last used timestamp
                store.shp_last_used_at = datetime.utcnow()
                await db.commit()

                logger.info(
                    f"Connection test successful for store {store.shp_shop}",
                    extra={"store_id": store_id, "latency_ms": latency}
                )

                return ConnectionTestResponse(
                    success=True,
                    is_connected=True,
                    shop_name=shop_data.get("name"),
                    shop_email=shop_data.get("email"),
                    currency=shop_data.get("currencyCode"),
                    plan=shop_data.get("plan", {}).get("displayName"),
                    scopes_valid=True,
                    message="Connection successful",
                    latency_ms=latency,
                )
            else:
                return ConnectionTestResponse(
                    success=True,
                    is_connected=False,
                    scopes_valid=False,
                    message="API call succeeded but returned no data",
                    latency_ms=latency,
                )

    except ShopifyAuthenticationError as e:
        return ConnectionTestResponse(
            success=True,
            is_connected=False,
            scopes_valid=False,
            message=f"Authentication failed: {e.message}",
        )

    except ShopifyError as e:
        return ConnectionTestResponse(
            success=True,
            is_connected=False,
            scopes_valid=False,
            message=f"Shopify error: {e.message}",
        )

    except Exception as e:
        logger.error(f"Connection test failed for store {store_id}: {e}")
        return ConnectionTestResponse(
            success=True,
            is_connected=False,
            scopes_valid=False,
            message=f"Connection error: {str(e)}",
        )

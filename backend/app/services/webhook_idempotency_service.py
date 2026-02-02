"""
Webhook Idempotency Service.

Provides duplicate detection for Shopify webhooks using a hybrid approach:
1. Redis for fast, in-memory duplicate checking (primary)
2. Database for audit trail and fallback when Redis unavailable

The service uses Shopify's X-Shopify-Webhook-Id header as the unique identifier
for each webhook delivery. Shopify may deliver the same webhook multiple times
(e.g., during network issues), and this service prevents duplicate processing.

TTL Strategy:
- Default TTL: 24 hours (Shopify's webhook retry window)
- Duplicate webhooks are logged with status 'skipped' for audit trail

Usage:
    service = WebhookIdempotencyService()

    # Check and mark as processed atomically
    is_duplicate = await service.check_and_mark(
        webhook_id="unique-id",
        integration_id=1,
        topic="orders/create"
    )

    if is_duplicate:
        return {"status": "skipped", "reason": "duplicate"}
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, NamedTuple
from enum import Enum

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.utils.redis_client import RedisCache
from app.models.integrations.shopify import ShopifySyncLog

logger = logging.getLogger(__name__)

settings = get_settings()


class IdempotencyResult(Enum):
    """Result of idempotency check."""
    NEW = "new"  # First time seeing this webhook
    DUPLICATE = "duplicate"  # Already processed
    REDIS_UNAVAILABLE = "redis_unavailable"  # Redis down, DB check required


class WebhookCheckResult(NamedTuple):
    """Result of a webhook idempotency check."""
    is_duplicate: bool
    source: str  # "redis" or "database"
    existing_log_id: Optional[int] = None


class WebhookIdempotencyService:
    """
    Service for detecting and preventing duplicate webhook processing.

    Uses a hybrid approach with Redis for speed and database for reliability.

    Redis Key Format:
        webhook:idempotency:{integration_id}:{topic}:{webhook_id}

    Value: timestamp when first processed
    TTL: Configurable (default 24 hours)
    """

    # Redis key prefix
    REDIS_PREFIX = "webhook:idempotency"

    def __init__(
        self,
        ttl_hours: Optional[int] = None,
        enabled: Optional[bool] = None,
    ):
        """
        Initialize the idempotency service.

        Args:
            ttl_hours: How long to remember processed webhooks (default from settings).
            enabled: Whether idempotency checking is enabled (default from settings).
        """
        self.ttl_hours = ttl_hours or settings.WEBHOOK_IDEMPOTENCY_TTL_HOURS
        self.ttl_seconds = self.ttl_hours * 3600
        self.enabled = enabled if enabled is not None else settings.WEBHOOK_IDEMPOTENCY_ENABLED
        self._cache = RedisCache(prefix=self.REDIS_PREFIX)

    def _build_key(
        self,
        webhook_id: str,
        integration_id: int,
        topic: str,
    ) -> str:
        """
        Build the cache key for a webhook.

        Args:
            webhook_id: Shopify's unique webhook ID.
            integration_id: Internal integration/store ID.
            topic: Webhook topic (e.g., "orders/create").

        Returns:
            Cache key string.
        """
        # Normalize topic to avoid key variations
        normalized_topic = topic.replace("/", "_")
        return f"{integration_id}:{normalized_topic}:{webhook_id}"

    async def check_redis(
        self,
        webhook_id: str,
        integration_id: int,
        topic: str,
    ) -> IdempotencyResult:
        """
        Check Redis for existing webhook processing.

        This is a fast, non-blocking check that should be used first.

        Args:
            webhook_id: Shopify's unique webhook ID.
            integration_id: Internal integration/store ID.
            topic: Webhook topic.

        Returns:
            IdempotencyResult indicating status.
        """
        if not webhook_id:
            # No webhook ID provided, can't do idempotency check
            return IdempotencyResult.NEW

        key = self._build_key(webhook_id, integration_id, topic)

        try:
            exists = await self._cache.exists(key)
            if exists:
                logger.info(
                    f"Duplicate webhook detected in Redis",
                    extra={
                        "webhook_id": webhook_id,
                        "integration_id": integration_id,
                        "topic": topic,
                    },
                )
                return IdempotencyResult.DUPLICATE
            return IdempotencyResult.NEW
        except Exception as e:
            logger.warning(
                f"Redis check failed, will check database: {e}",
                extra={
                    "webhook_id": webhook_id,
                    "integration_id": integration_id,
                    "topic": topic,
                },
            )
            return IdempotencyResult.REDIS_UNAVAILABLE

    async def mark_processed_redis(
        self,
        webhook_id: str,
        integration_id: int,
        topic: str,
    ) -> bool:
        """
        Mark a webhook as processed in Redis.

        Uses SET NX (set if not exists) for atomic check-and-set.

        Args:
            webhook_id: Shopify's unique webhook ID.
            integration_id: Internal integration/store ID.
            topic: Webhook topic.

        Returns:
            True if marked (first time), False if already exists or error.
        """
        if not webhook_id:
            return True  # No webhook ID, proceed without marking

        key = self._build_key(webhook_id, integration_id, topic)
        timestamp = datetime.utcnow().isoformat()

        # Atomic set-if-not-exists
        return await self._cache.setex_if_not_exists(
            key,
            timestamp,
            self.ttl_seconds,
        )

    async def check_database(
        self,
        db: AsyncSession,
        webhook_id: str,
        integration_id: int,
        topic: str,
    ) -> Optional[ShopifySyncLog]:
        """
        Check database for existing webhook processing.

        This is a slower check used as fallback when Redis is unavailable.

        Args:
            db: Database session.
            webhook_id: Shopify's unique webhook ID.
            integration_id: Internal integration/store ID.
            topic: Webhook topic.

        Returns:
            Existing ShopifySyncLog if found, None otherwise.
        """
        if not webhook_id:
            return None

        # Check for recent processing (within TTL window)
        cutoff_time = datetime.utcnow() - timedelta(hours=self.ttl_hours)

        result = await db.execute(
            select(ShopifySyncLog).where(
                and_(
                    ShopifySyncLog.ssl_entity_id == webhook_id,
                    ShopifySyncLog.shp_id == integration_id,
                    ShopifySyncLog.ssl_operation == f"webhook:{topic}",
                    ShopifySyncLog.ssl_created_at >= cutoff_time,
                    # Only count successful or pending processing
                    ShopifySyncLog.ssl_status.in_(["pending", "success", "processing"]),
                )
            )
        )

        existing = result.scalar_one_or_none()

        if existing:
            logger.info(
                f"Duplicate webhook detected in database",
                extra={
                    "webhook_id": webhook_id,
                    "integration_id": integration_id,
                    "topic": topic,
                    "existing_log_id": existing.ssl_id,
                },
            )

        return existing

    async def check_and_mark(
        self,
        webhook_id: str,
        integration_id: int,
        topic: str,
        db: Optional[AsyncSession] = None,
    ) -> WebhookCheckResult:
        """
        Check if webhook is duplicate and mark as processed atomically.

        This is the main method to call for idempotency checking.
        It uses Redis first, then falls back to database if needed.

        Args:
            webhook_id: Shopify's unique webhook ID.
            integration_id: Internal integration/store ID.
            topic: Webhook topic.
            db: Optional database session for fallback check.

        Returns:
            WebhookCheckResult with is_duplicate flag and source.
        """
        # If idempotency checking is disabled, always return as new
        if not self.enabled:
            return WebhookCheckResult(is_duplicate=False, source="disabled")

        if not webhook_id:
            # No webhook ID provided, treat as new (can't dedupe)
            logger.warning(
                "Webhook received without X-Shopify-Webhook-Id header",
                extra={
                    "integration_id": integration_id,
                    "topic": topic,
                },
            )
            return WebhookCheckResult(is_duplicate=False, source="no_id")

        # Try atomic set in Redis (check and mark in one operation)
        was_set = await self.mark_processed_redis(webhook_id, integration_id, topic)

        if was_set:
            # Successfully marked as processed (first time seeing this)
            return WebhookCheckResult(is_duplicate=False, source="redis")

        # Key already existed OR Redis unavailable
        # Check Redis to determine which case
        redis_result = await self.check_redis(webhook_id, integration_id, topic)

        if redis_result == IdempotencyResult.DUPLICATE:
            return WebhookCheckResult(is_duplicate=True, source="redis")

        # Redis unavailable, fall back to database
        if db and redis_result == IdempotencyResult.REDIS_UNAVAILABLE:
            existing = await self.check_database(db, webhook_id, integration_id, topic)
            if existing:
                return WebhookCheckResult(
                    is_duplicate=True,
                    source="database",
                    existing_log_id=existing.ssl_id,
                )

        # No duplicate found anywhere
        return WebhookCheckResult(is_duplicate=False, source="fallback")

    async def get_duplicate_stats(
        self,
        db: AsyncSession,
        integration_id: int,
        hours: int = 24,
    ) -> dict:
        """
        Get statistics on duplicate webhooks detected.

        Args:
            db: Database session.
            integration_id: Integration to get stats for.
            hours: Time window in hours.

        Returns:
            Dictionary with duplicate statistics.
        """
        from sqlalchemy import func

        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        # Count webhooks by status
        result = await db.execute(
            select(
                ShopifySyncLog.ssl_status,
                func.count(ShopifySyncLog.ssl_id).label("count"),
            )
            .where(
                and_(
                    ShopifySyncLog.shp_id == integration_id,
                    ShopifySyncLog.ssl_entity_type == "webhook",
                    ShopifySyncLog.ssl_created_at >= cutoff_time,
                )
            )
            .group_by(ShopifySyncLog.ssl_status)
        )

        stats = {row.ssl_status: row.count for row in result}

        return {
            "integration_id": integration_id,
            "time_window_hours": hours,
            "total_webhooks": sum(stats.values()),
            "duplicates_skipped": stats.get("skipped", 0),
            "successful": stats.get("success", 0),
            "pending": stats.get("pending", 0),
            "errors": stats.get("error", 0),
            "breakdown": stats,
        }


# Singleton instance for easy import
webhook_idempotency = WebhookIdempotencyService()

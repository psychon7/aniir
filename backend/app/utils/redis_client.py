"""
Redis client utility for caching and idempotency checks.

Provides:
- Async Redis client for use with FastAPI
- Connection pooling
- Helper methods for common operations
- Graceful fallback when Redis is unavailable
"""
import logging
from typing import Optional, Any
from contextlib import asynccontextmanager

import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool

from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Global connection pool
_redis_pool: Optional[ConnectionPool] = None
_redis_client: Optional[redis.Redis] = None


def get_redis_pool() -> ConnectionPool:
    """
    Get or create the Redis connection pool.

    Returns:
        ConnectionPool: Redis connection pool.
    """
    global _redis_pool

    if _redis_pool is None:
        _redis_pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=20,
            decode_responses=True,
        )
        logger.info("Redis connection pool created")

    return _redis_pool


def get_redis_client() -> redis.Redis:
    """
    Get the Redis client instance.

    Returns:
        redis.Redis: Async Redis client.
    """
    global _redis_client

    if _redis_client is None:
        _redis_client = redis.Redis(connection_pool=get_redis_pool())
        logger.info("Redis client created")

    return _redis_client


async def close_redis() -> None:
    """
    Close Redis connections.

    Should be called during application shutdown.
    """
    global _redis_client, _redis_pool

    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis client closed")

    if _redis_pool is not None:
        await _redis_pool.disconnect()
        _redis_pool = None
        logger.info("Redis connection pool closed")


async def check_redis_connection() -> bool:
    """
    Check if Redis connection is healthy.

    Returns:
        bool: True if connected, False otherwise.
    """
    try:
        client = get_redis_client()
        await client.ping()
        return True
    except Exception as e:
        logger.warning(f"Redis health check failed: {e}")
        return False


@asynccontextmanager
async def redis_session():
    """
    Context manager for Redis operations with automatic error handling.

    Yields:
        redis.Redis: Redis client or None if unavailable.

    Example:
        async with redis_session() as client:
            if client:
                await client.set("key", "value")
    """
    try:
        client = get_redis_client()
        yield client
    except Exception as e:
        logger.warning(f"Redis operation failed: {e}")
        yield None


class RedisCache:
    """
    High-level Redis cache operations with graceful fallback.

    All methods gracefully handle Redis unavailability by returning
    appropriate default values instead of raising exceptions.
    """

    def __init__(self, prefix: str = "erp"):
        """
        Initialize Redis cache with optional key prefix.

        Args:
            prefix: Prefix for all cache keys (default: "erp").
        """
        self.prefix = prefix
        self._client = get_redis_client()

    def _key(self, key: str) -> str:
        """Build full cache key with prefix."""
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> Optional[str]:
        """
        Get a value from cache.

        Args:
            key: Cache key (without prefix).

        Returns:
            Cached value or None if not found/error.
        """
        try:
            return await self._client.get(self._key(key))
        except Exception as e:
            logger.warning(f"Redis GET failed for {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: str,
        ttl_seconds: Optional[int] = None,
    ) -> bool:
        """
        Set a value in cache.

        Args:
            key: Cache key (without prefix).
            value: Value to cache.
            ttl_seconds: Optional TTL in seconds.

        Returns:
            True if successful, False otherwise.
        """
        try:
            if ttl_seconds:
                await self._client.setex(self._key(key), ttl_seconds, value)
            else:
                await self._client.set(self._key(key), value)
            return True
        except Exception as e:
            logger.warning(f"Redis SET failed for {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if a key exists in cache.

        Args:
            key: Cache key (without prefix).

        Returns:
            True if exists, False otherwise (including errors).
        """
        try:
            return bool(await self._client.exists(self._key(key)))
        except Exception as e:
            logger.warning(f"Redis EXISTS failed for {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete a key from cache.

        Args:
            key: Cache key (without prefix).

        Returns:
            True if deleted, False otherwise.
        """
        try:
            await self._client.delete(self._key(key))
            return True
        except Exception as e:
            logger.warning(f"Redis DELETE failed for {key}: {e}")
            return False

    async def setex_if_not_exists(
        self,
        key: str,
        value: str,
        ttl_seconds: int,
    ) -> bool:
        """
        Set a value only if key does not exist (atomic operation).

        This is useful for idempotency checks - if the key exists,
        the operation has already been processed.

        Args:
            key: Cache key (without prefix).
            value: Value to cache.
            ttl_seconds: TTL in seconds.

        Returns:
            True if set (key didn't exist), False if key exists or error.
        """
        try:
            # SET NX (Not eXists) with EX (expiration)
            result = await self._client.set(
                self._key(key),
                value,
                ex=ttl_seconds,
                nx=True,
            )
            return result is not None
        except Exception as e:
            logger.warning(f"Redis SETNX failed for {key}: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Increment a counter.

        Args:
            key: Cache key (without prefix).
            amount: Amount to increment by (default: 1).

        Returns:
            New value or None on error.
        """
        try:
            return await self._client.incrby(self._key(key), amount)
        except Exception as e:
            logger.warning(f"Redis INCRBY failed for {key}: {e}")
            return None

    async def expire(self, key: str, ttl_seconds: int) -> bool:
        """
        Set expiration on an existing key.

        Args:
            key: Cache key (without prefix).
            ttl_seconds: TTL in seconds.

        Returns:
            True if successful, False otherwise.
        """
        try:
            return await self._client.expire(self._key(key), ttl_seconds)
        except Exception as e:
            logger.warning(f"Redis EXPIRE failed for {key}: {e}")
            return False


# Default cache instance
default_cache = RedisCache()

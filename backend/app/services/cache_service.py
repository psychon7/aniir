"""
Redis Caching Service for ERP Application.

Provides:
- Cache-aside pattern with write-through invalidation
- Decorator-based caching for expensive operations
- JSON serialization/deserialization for cached data
- Pattern-based invalidation for list caches
- Graceful fallback when Redis is unavailable

Caching Strategy:
-----------------
1. DETAIL endpoints (e.g., /clients/{id}):
   - Cache indefinitely (FOREVER TTL = 24 hours as safety net)
   - Invalidate immediately on UPDATE/DELETE

2. LIST endpoints (e.g., /clients with pagination/filters):
   - Cache with moderate TTL
   - Invalidate ALL list caches when ANY record changes
   - Use pattern: "client:list:*" to match all list variations

3. LOOKUP/Reference data:
   - Long TTL (rarely changes)
   - Invalidate on admin updates

Usage:
    cache_service = CacheService()

    # Cache a detail record (forever until invalidated)
    await cache_service.set_detail("client", 123, data)
    await cache_service.get_detail("client", 123)

    # Invalidate on write
    await cache_service.invalidate_entity("client", 123)  # Clears detail + all lists

    # Cache a list with params
    await cache_service.set_list("client", {"page": 1, "search": "acme"}, data)
"""
import json
import hashlib
import functools
from typing import Optional, Any, Callable, TypeVar, ParamSpec
from loguru import logger

from app.utils.redis_client import get_redis_client

P = ParamSpec('P')
R = TypeVar('R')


# Default TTL values in seconds
class CacheTTL:
    """Standard cache TTL values."""
    VERY_SHORT = 30       # 30 seconds - for rapidly changing data
    SHORT = 60            # 1 minute - dashboard KPIs
    MEDIUM = 300          # 5 minutes - entity lists
    LONG = 600            # 10 minutes - lookup/reference data
    VERY_LONG = 1800      # 30 minutes - rarely changing config
    FOREVER = 86400       # 24 hours - "permanent" with safety net


class CacheKeys:
    """Cache key prefixes for different data types."""
    DASHBOARD = "dashboard"
    LOOKUP = "lookup"
    CLIENT = "client"
    ORDER = "order"
    INVOICE = "invoice"
    DELIVERY = "delivery"
    QUOTE = "quote"
    PRODUCT = "product"
    SUPPLIER = "supplier"


class CacheService:
    """
    High-level caching service with JSON serialization.
    
    Uses the existing Redis client from app.utils.redis_client.
    """
    
    def __init__(self, prefix: str = "erp:cache"):
        self.prefix = prefix
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of Redis client."""
        if self._client is None:
            self._client = get_redis_client()
        return self._client
    
    def _build_key(self, *parts: str) -> str:
        """Build a cache key from parts."""
        return f"{self.prefix}:{':'.join(str(p) for p in parts)}"
    
    def _hash_params(self, params: dict) -> str:
        """Create a hash of parameters for cache key."""
        if not params:
            return "default"
        sorted_params = json.dumps(params, sort_keys=True, default=str)
        return hashlib.md5(sorted_params.encode()).hexdigest()[:12]
    
    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache, deserializing JSON."""
        try:
            raw = await self.client.get(self._build_key(key))
            if raw:
                return json.loads(raw)
            return None
        except Exception as e:
            logger.warning(f"Cache GET failed for {key}: {e}")
            return None
    
    async def set(
        self, 
        key: str, 
        value: Any, 
        ttl: int = CacheTTL.MEDIUM
    ) -> bool:
        """Set a value in cache with JSON serialization."""
        try:
            serialized = json.dumps(value, default=str)
            await self.client.setex(
                self._build_key(key), 
                ttl, 
                serialized
            )
            return True
        except Exception as e:
            logger.warning(f"Cache SET failed for {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete a key from cache."""
        try:
            await self.client.delete(self._build_key(key))
            return True
        except Exception as e:
            logger.warning(f"Cache DELETE failed for {key}: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern."""
        try:
            full_pattern = self._build_key(pattern)
            keys = []
            async for key in self.client.scan_iter(match=full_pattern):
                keys.append(key)
            if keys:
                deleted = await self.client.delete(*keys)
                logger.debug(f"Cache INVALIDATED {deleted} keys matching: {pattern}")
                return deleted
            return 0
        except Exception as e:
            logger.warning(f"Cache DELETE pattern failed for {pattern}: {e}")
            return 0

    # =========================================================================
    # HIGH-LEVEL CACHING API (Cache-Aside with Invalidation)
    # =========================================================================

    async def get_detail(self, entity: str, entity_id: int) -> Optional[Any]:
        """
        Get a cached detail record.

        Args:
            entity: Entity type (e.g., "client", "order")
            entity_id: Record ID

        Returns:
            Cached data or None if not cached
        """
        cache_key = f"{entity}:detail:{entity_id}"
        return await self.get(cache_key)

    async def set_detail(
        self,
        entity: str,
        entity_id: int,
        data: Any,
        ttl: int = CacheTTL.FOREVER
    ) -> bool:
        """
        Cache a detail record (indefinitely until invalidated).

        Args:
            entity: Entity type (e.g., "client", "order")
            entity_id: Record ID
            data: Data to cache
            ttl: Safety-net TTL (default 24 hours)
        """
        cache_key = f"{entity}:detail:{entity_id}"
        return await self.set(cache_key, data, ttl)

    async def get_list(self, entity: str, params: dict) -> Optional[Any]:
        """
        Get a cached list result.

        Args:
            entity: Entity type (e.g., "client")
            params: Query parameters (page, search, filters, etc.)
        """
        param_hash = self._hash_params(params)
        cache_key = f"{entity}:list:{param_hash}"
        return await self.get(cache_key)

    async def set_list(
        self,
        entity: str,
        params: dict,
        data: Any,
        ttl: int = CacheTTL.MEDIUM
    ) -> bool:
        """
        Cache a list result.

        Args:
            entity: Entity type
            params: Query parameters used (for cache key)
            data: List data to cache
            ttl: Time-to-live (shorter than detail, as lists change frequently)
        """
        param_hash = self._hash_params(params)
        cache_key = f"{entity}:list:{param_hash}"
        return await self.set(cache_key, data, ttl)

    async def invalidate_entity(self, entity: str, entity_id: int) -> dict:
        """
        Invalidate all caches related to an entity.

        This is the KEY method for cache-aside pattern.
        Call this after CREATE, UPDATE, or DELETE operations.

        Invalidates:
        1. The specific detail cache (entity:detail:{id})
        2. ALL list caches for this entity type (entity:list:*)

        Args:
            entity: Entity type (e.g., "client", "order")
            entity_id: The specific record ID

        Returns:
            Dict with counts of invalidated keys

        Example:
            # After updating a client
            await cache_service.invalidate_entity("client", 123)
        """
        # Delete the specific detail cache
        detail_deleted = await self.delete(f"{entity}:detail:{entity_id}")

        # Delete ALL list caches for this entity (since any record change affects lists)
        list_deleted = await self.delete_pattern(f"{entity}:list:*")

        logger.info(f"Cache INVALIDATED for {entity}:{entity_id} - detail: {detail_deleted}, lists: {list_deleted}")

        return {
            "entity": entity,
            "entity_id": entity_id,
            "detail_invalidated": detail_deleted,
            "lists_invalidated": list_deleted
        }

    async def invalidate_entity_lists(self, entity: str) -> int:
        """
        Invalidate only list caches for an entity type.

        Useful when a new record is created (no existing detail cache to clear).

        Args:
            entity: Entity type (e.g., "client")

        Returns:
            Number of list caches invalidated
        """
        count = await self.delete_pattern(f"{entity}:list:*")
        logger.info(f"Cache INVALIDATED {count} list caches for {entity}")
        return count

    async def warm_detail(
        self,
        entity: str,
        entity_id: int,
        fetcher: Callable[[], Any]
    ) -> Any:
        """
        Warm cache for a detail record (fetch and cache if not present).

        Args:
            entity: Entity type
            entity_id: Record ID
            fetcher: Async function to fetch data if not cached

        Returns:
            Cached or freshly fetched data
        """
        cached = await self.get_detail(entity, entity_id)
        if cached is not None:
            return cached

        # Fetch and cache
        data = await fetcher()
        if data is not None:
            await self.set_detail(entity, entity_id, data)
        return data

    def cached(
        self,
        key_prefix: str,
        ttl: int = CacheTTL.MEDIUM,
        key_builder: Optional[Callable[..., str]] = None
    ):
        """
        Decorator to cache async function results.

        Args:
            key_prefix: Prefix for the cache key
            ttl: Time-to-live in seconds
            key_builder: Optional function to build cache key from args

        Example:
            @cache_service.cached("dashboard:kpis", ttl=60)
            async def get_dashboard_kpis():
                ...
        """
        def decorator(func: Callable[P, R]) -> Callable[P, R]:
            @functools.wraps(func)
            async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
                # Build cache key
                if key_builder:
                    cache_key = f"{key_prefix}:{key_builder(*args, **kwargs)}"
                else:
                    param_hash = self._hash_params(kwargs)
                    cache_key = f"{key_prefix}:{param_hash}"

                # Try to get from cache
                cached_value = await self.get(cache_key)
                if cached_value is not None:
                    logger.debug(f"Cache HIT: {cache_key}")
                    return cached_value

                # Execute function and cache result
                logger.debug(f"Cache MISS: {cache_key}")
                result = await func(*args, **kwargs)
                await self.set(cache_key, result, ttl)
                return result

            return wrapper
        return decorator


# Global cache service instance
cache_service = CacheService()


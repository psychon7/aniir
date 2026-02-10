"""
Redis Caching Service for ERP Application.

Provides:
- Decorator-based caching for expensive operations
- JSON serialization/deserialization for cached data
- Configurable TTL with sensible defaults
- Graceful fallback when Redis is unavailable

Usage:
    cache_service = CacheService()
    
    # Cache a function result
    @cache_service.cached("my_key", ttl=300)
    async def expensive_operation():
        ...
    
    # Manual cache operations
    await cache_service.get("key")
    await cache_service.set("key", value, ttl=300)
    await cache_service.delete("key")
"""
import json
import hashlib
import functools
from typing import Optional, Any, Callable, TypeVar, ParamSpec
from datetime import datetime
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


class CacheKeys:
    """Cache key prefixes for different data types."""
    DASHBOARD = "dashboard"
    LOOKUP = "lookup"
    CLIENT = "client"
    ORDER = "order"
    INVOICE = "invoice"
    DELIVERY = "delivery"
    QUOTE = "quote"


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
                return await self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.warning(f"Cache DELETE pattern failed for {pattern}: {e}")
            return 0
    
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


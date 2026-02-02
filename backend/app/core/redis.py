"""
Redis connection and configuration for token blacklist.
"""
import redis.asyncio as redis
from typing import Optional
from functools import lru_cache

from app.core.config import settings


class RedisClient:
    """Redis client wrapper for token blacklist operations."""
    
    _instance: Optional[redis.Redis] = None
    
    @classmethod
    async def get_client(cls) -> redis.Redis:
        """Get or create Redis client instance."""
        if cls._instance is None:
            cls._instance = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
        return cls._instance
    
    @classmethod
    async def close(cls) -> None:
        """Close Redis connection."""
        if cls._instance is not None:
            await cls._instance.close()
            cls._instance = None
    
    @classmethod
    async def ping(cls) -> bool:
        """Check Redis connection health."""
        try:
            client = await cls.get_client()
            return await client.ping()
        except Exception:
            return False


async def get_redis() -> redis.Redis:
    """Dependency for getting Redis client."""
    return await RedisClient.get_client()

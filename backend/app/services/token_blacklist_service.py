"""
Redis-backed token blacklist service.

Provides helper methods to:
- Store revoked JWT access/refresh tokens with TTLs
- Check if a token has been revoked
- Bulk invalidate all tokens for a user (logout-all)
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from app.utils.redis_client import RedisCache
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class TokenBlacklistService:
    """Manages token blacklist entries in Redis."""

    def __init__(self, cache: Optional[RedisCache] = None):
        # Namespace blacklist keys under the auth prefix
        self._cache = cache or RedisCache(prefix="erp:auth")

    def _key_from_token(self, token: str) -> str:
        """Generate a deterministic Redis key for the token (hash-based)."""
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        return f"token-blacklist:{digest}"

    def _key_from_jti(self, jti: str) -> str:
        """Generate a Redis key for a token using its jti."""
        return f"token-blacklist:jti:{jti}"

    def _user_invalidation_key(self, user_id: int) -> str:
        """Generate a Redis key for user-level token invalidation."""
        return f"user-invalidated:{user_id}"

    async def add(
        self,
        token: str,
        expires_at: datetime,
        token_type: str = "access",
        reason: str = "revoked",
    ) -> bool:
        """
        Add a token to the blacklist until it expires (hash-based).

        Args:
            token: JWT token string.
            expires_at: Datetime when the token naturally expires.
            token_type: Type of the token (access/refresh).
            reason: Optional description for auditing.

        Returns:
            True if stored successfully (or Redis unavailable), False otherwise.
        """
        if not token:
            return False

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        ttl_seconds = int((expires_at - datetime.now(timezone.utc)).total_seconds())
        if ttl_seconds <= 0:
            # Token already expired; nothing to store.
            logger.debug("Skipping blacklist for expired token.")
            return False

        payload = json.dumps(
            {
                "token_type": token_type,
                "reason": reason,
                "expires_at": expires_at.isoformat(),
                "blacklisted_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        key = self._key_from_token(token)
        return await self._cache.set(key, payload, ttl_seconds=ttl_seconds)

    async def add_by_jti(
        self,
        jti: str,
        expires_at: datetime,
        token_type: str = "access",
        reason: str = "revoked",
    ) -> bool:
        """
        Add a token to the blacklist by its jti (JWT ID).

        Args:
            jti: Unique JWT token identifier.
            expires_at: Datetime when the token naturally expires.
            token_type: Type of the token (access/refresh).
            reason: Optional description for auditing.

        Returns:
            True if stored successfully, False otherwise.
        """
        if not jti:
            return False

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        ttl_seconds = int((expires_at - datetime.now(timezone.utc)).total_seconds())
        if ttl_seconds <= 0:
            logger.debug("Skipping blacklist for expired token (jti).")
            return False

        payload = json.dumps(
            {
                "token_type": token_type,
                "reason": reason,
                "expires_at": expires_at.isoformat(),
                "blacklisted_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        key = self._key_from_jti(jti)
        return await self._cache.set(key, payload, ttl_seconds=ttl_seconds)

    async def is_blacklisted(self, token: str) -> bool:
        """
        Check whether a token is in the blacklist (hash-based).

        Args:
            token: JWT token string.

        Returns:
            True if blacklisted, False otherwise.
        """
        if not token:
            return False
        key = self._key_from_token(token)
        return await self._cache.exists(key)

    async def is_blacklisted_by_jti(self, jti: str) -> bool:
        """
        Check whether a token is in the blacklist by jti.

        Args:
            jti: Unique JWT token identifier.

        Returns:
            True if blacklisted, False otherwise.
        """
        if not jti:
            return False
        key = self._key_from_jti(jti)
        return await self._cache.exists(key)

    async def invalidate_all_user_tokens(
        self,
        user_id: int,
        reason: str = "logout_all",
    ) -> bool:
        """
        Invalidate all tokens for a user by setting a timestamp.
        Any token issued before this timestamp is considered invalid.

        Args:
            user_id: User ID whose tokens should be invalidated.
            reason: Reason for invalidation (logout_all, password_change, etc.).

        Returns:
            True if stored successfully, False otherwise.
        """
        # Keep for the lifetime of refresh tokens (longest possible token)
        ttl_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

        payload = json.dumps(
            {
                "invalidated_at": datetime.now(timezone.utc).isoformat(),
                "reason": reason,
            }
        )
        key = self._user_invalidation_key(user_id)
        return await self._cache.set(key, payload, ttl_seconds=ttl_seconds)

    async def is_user_invalidated(
        self,
        user_id: int,
        token_issued_at: datetime,
    ) -> bool:
        """
        Check if a user's tokens were bulk-invalidated after the token was issued.

        Args:
            user_id: User ID to check.
            token_issued_at: When the token was issued (iat claim).

        Returns:
            True if token was issued before the user invalidation, False otherwise.
        """
        key = self._user_invalidation_key(user_id)
        data = await self._cache.get(key)

        if not data:
            return False

        try:
            invalidation_data = json.loads(data)
            invalidated_at_str = invalidation_data.get("invalidated_at")
            if not invalidated_at_str:
                return False

            invalidated_at = datetime.fromisoformat(invalidated_at_str)

            # Ensure both datetimes have timezone info for comparison
            if token_issued_at.tzinfo is None:
                token_issued_at = token_issued_at.replace(tzinfo=timezone.utc)
            if invalidated_at.tzinfo is None:
                invalidated_at = invalidated_at.replace(tzinfo=timezone.utc)

            # Token is invalid if issued before invalidation timestamp
            return token_issued_at < invalidated_at

        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Error parsing user invalidation data: {e}")
            return False

    async def clear_user_invalidation(self, user_id: int) -> bool:
        """
        Clear a user's invalidation record (after fresh login).

        Args:
            user_id: User ID to clear.

        Returns:
            True if deleted successfully, False otherwise.
        """
        key = self._user_invalidation_key(user_id)
        return await self._cache.delete(key)


# Shared instance for dependency-free access
token_blacklist_service = TokenBlacklistService()


def get_token_blacklist_service() -> TokenBlacklistService:
    """Return the shared token blacklist service."""
    return token_blacklist_service

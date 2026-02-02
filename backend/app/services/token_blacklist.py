"""
Token blacklist service using Redis.
Handles token invalidation for logout, password changes, etc.
"""
import redis.asyncio as redis
from datetime import datetime, timedelta
from typing import Optional, Set
import json

from app.core.config import settings
from app.core.redis import get_redis


class TokenBlacklistService:
    """
    Service for managing JWT token blacklist in Redis.
    
    Features:
    - Blacklist individual tokens (logout)
    - Blacklist all tokens for a user (password change, account lock)
    - Automatic expiration matching token TTL
    - Efficient lookup using Redis sets
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.blacklist_prefix = settings.REDIS_TOKEN_BLACKLIST_PREFIX
        self.user_tokens_prefix = settings.REDIS_USER_TOKENS_PREFIX
    
    async def blacklist_token(
        self,
        token_jti: str,
        user_id: int,
        expires_at: datetime,
        reason: str = "logout"
    ) -> bool:
        """
        Add a token to the blacklist.
        
        Args:
            token_jti: Unique token identifier (JWT ID)
            user_id: User who owns the token
            expires_at: Token expiration time (for auto-cleanup)
            reason: Reason for blacklisting (logout, password_change, etc.)
        
        Returns:
            True if successfully blacklisted
        """
        try:
            # Calculate TTL (time until token expires)
            now = datetime.utcnow()
            ttl_seconds = int((expires_at - now).total_seconds())
            
            # Don't blacklist already expired tokens
            if ttl_seconds <= 0:
                return True
            
            # Store blacklist entry with metadata
            blacklist_key = f"{self.blacklist_prefix}{token_jti}"
            blacklist_data = {
                "user_id": user_id,
                "blacklisted_at": now.isoformat(),
                "reason": reason,
                "expires_at": expires_at.isoformat()
            }
            
            # Set with expiration (auto-cleanup when token would expire anyway)
            await self.redis.setex(
                blacklist_key,
                ttl_seconds,
                json.dumps(blacklist_data)
            )
            
            # Also track in user's token set (for bulk invalidation)
            user_tokens_key = f"{self.user_tokens_prefix}{user_id}"
            await self.redis.sadd(user_tokens_key, token_jti)
            
            return True
            
        except Exception as e:
            # Log error but don't fail the operation
            print(f"Error blacklisting token: {e}")
            return False
    
    async def is_token_blacklisted(self, token_jti: str) -> bool:
        """
        Check if a token is blacklisted.
        
        Args:
            token_jti: Unique token identifier to check
        
        Returns:
            True if token is blacklisted
        """
        try:
            blacklist_key = f"{self.blacklist_prefix}{token_jti}"
            return await self.redis.exists(blacklist_key) > 0
        except Exception as e:
            # On Redis error, fail open (allow token) but log
            print(f"Error checking token blacklist: {e}")
            return False
    
    async def blacklist_all_user_tokens(
        self,
        user_id: int,
        reason: str = "password_change"
    ) -> int:
        """
        Blacklist all tokens for a user (password change, account lock).
        
        This uses a user-level invalidation timestamp approach:
        Any token issued before this timestamp is considered invalid.
        
        Args:
            user_id: User whose tokens should be invalidated
            reason: Reason for invalidation
        
        Returns:
            Number of tokens invalidated
        """
        try:
            # Set user invalidation timestamp
            # All tokens issued before this time are invalid
            invalidation_key = f"{self.user_tokens_prefix}{user_id}:invalidated_at"
            invalidation_data = {
                "invalidated_at": datetime.utcnow().isoformat(),
                "reason": reason
            }
            
            # Keep for refresh token lifetime (longest possible token)
            ttl_seconds = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            await self.redis.setex(
                invalidation_key,
                ttl_seconds,
                json.dumps(invalidation_data)
            )
            
            # Get count of tracked tokens (for return value)
            user_tokens_key = f"{self.user_tokens_prefix}{user_id}"
            count = await self.redis.scard(user_tokens_key)
            
            # Clear the user's token tracking set
            await self.redis.delete(user_tokens_key)
            
            return count
            
        except Exception as e:
            print(f"Error blacklisting user tokens: {e}")
            return 0
    
    async def is_user_token_invalidated(
        self,
        user_id: int,
        token_issued_at: datetime
    ) -> bool:
        """
        Check if a user's tokens were bulk-invalidated after token was issued.
        
        Args:
            user_id: User ID to check
            token_issued_at: When the token was issued (iat claim)
        
        Returns:
            True if token was issued before user invalidation
        """
        try:
            invalidation_key = f"{self.user_tokens_prefix}{user_id}:invalidated_at"
            data = await self.redis.get(invalidation_key)
            
            if not data:
                return False
            
            invalidation_data = json.loads(data)
            invalidated_at = datetime.fromisoformat(invalidation_data["invalidated_at"])
            
            # Token is invalid if issued before invalidation
            return token_issued_at < invalidated_at
            
        except Exception as e:
            print(f"Error checking user token invalidation: {e}")
            return False
    
    async def get_blacklist_info(self, token_jti: str) -> Optional[dict]:
        """
        Get blacklist information for a token.
        
        Args:
            token_jti: Token identifier
        
        Returns:
            Blacklist metadata or None if not blacklisted
        """
        try:
            blacklist_key = f"{self.blacklist_prefix}{token_jti}"
            data = await self.redis.get(blacklist_key)
            
            if data:
                return json.loads(data)
            return None
            
        except Exception as e:
            print(f"Error getting blacklist info: {e}")
            return None
    
    async def cleanup_expired_user_tokens(self, user_id: int) -> int:
        """
        Clean up expired token references from user's token set.
        Called periodically or on user login.
        
        Args:
            user_id: User ID to clean up
        
        Returns:
            Number of expired tokens removed
        """
        try:
            user_tokens_key = f"{self.user_tokens_prefix}{user_id}"
            token_jtis = await self.redis.smembers(user_tokens_key)
            
            removed = 0
            for jti in token_jtis:
                blacklist_key = f"{self.blacklist_prefix}{jti}"
                # If blacklist entry expired, remove from user set
                if not await self.redis.exists(blacklist_key):
                    await self.redis.srem(user_tokens_key, jti)
                    removed += 1
            
            return removed
            
        except Exception as e:
            print(f"Error cleaning up user tokens: {e}")
            return 0


async def get_token_blacklist_service() -> TokenBlacklistService:
    """Dependency for getting token blacklist service."""
    redis_client = await get_redis()
    return TokenBlacklistService(redis_client)

"""
Tests for token blacklist service.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
import json

from app.services.token_blacklist import TokenBlacklistService


@pytest.fixture
def mock_redis():
    """Create mock Redis client."""
    redis = AsyncMock()
    redis.setex = AsyncMock(return_value=True)
    redis.get = AsyncMock(return_value=None)
    redis.exists = AsyncMock(return_value=0)
    redis.sadd = AsyncMock(return_value=1)
    redis.scard = AsyncMock(return_value=0)
    redis.smembers = AsyncMock(return_value=set())
    redis.srem = AsyncMock(return_value=1)
    redis.delete = AsyncMock(return_value=1)
    return redis


@pytest.fixture
def blacklist_service(mock_redis):
    """Create blacklist service with mock Redis."""
    return TokenBlacklistService(mock_redis)


@pytest.mark.asyncio
async def test_blacklist_token(blacklist_service, mock_redis):
    """Test blacklisting a token."""
    token_jti = "test-jti-123"
    user_id = 1
    expires_at = datetime.utcnow() + timedelta(hours=1)
    
    result = await blacklist_service.blacklist_token(
        token_jti=token_jti,
        user_id=user_id,
        expires_at=expires_at,
        reason="logout"
    )
    
    assert result is True
    mock_redis.setex.assert_called_once()
    mock_redis.sadd.assert_called_once()


@pytest.mark.asyncio
async def test_blacklist_expired_token(blacklist_service, mock_redis):
    """Test that expired tokens are not blacklisted."""
    token_jti = "test-jti-123"
    user_id = 1
    expires_at = datetime.utcnow() - timedelta(hours=1)  # Already expired
    
    result = await blacklist_service.blacklist_token(
        token_jti=token_jti,
        user_id=user_id,
        expires_at=expires_at,
        reason="logout"
    )
    
    assert result is True
    mock_redis.setex.assert_not_called()


@pytest.mark.asyncio
async def test_is_token_blacklisted_true(blacklist_service, mock_redis):
    """Test checking a blacklisted token."""
    mock_redis.exists.return_value = 1
    
    result = await blacklist_service.is_token_blacklisted("test-jti")
    
    assert result is True


@pytest.mark.asyncio
async def test_is_token_blacklisted_false(blacklist_service, mock_redis):
    """Test checking a non-blacklisted token."""
    mock_redis.exists.return_value = 0
    
    result = await blacklist_service.is_token_blacklisted("test-jti")
    
    assert result is False


@pytest.mark.asyncio
async def test_blacklist_all_user_tokens(blacklist_service, mock_redis):
    """Test bulk invalidation of user tokens."""
    mock_redis.scard.return_value = 5
    
    count = await blacklist_service.blacklist_all_user_tokens(
        user_id=1,
        reason="password_change"
    )
    
    assert count == 5
    mock_redis.setex.assert_called_once()
    mock_redis.delete.assert_called_once()


@pytest.mark.asyncio
async def test_is_user_token_invalidated_true(blacklist_service, mock_redis):
    """Test user token invalidation check - token issued before invalidation."""
    invalidation_time = datetime.utcnow()
    token_issued_at = invalidation_time - timedelta(hours=1)
    
    mock_redis.get.return_value = json.dumps({
        "invalidated_at": invalidation_time.isoformat(),
        "reason": "password_change"
    })
    
    result = await blacklist_service.is_user_token_invalidated(
        user_id=1,
        token_issued_at=token_issued_at
    )
    
    assert result is True


@pytest.mark.asyncio
async def test_is_user_token_invalidated_false(blacklist_service, mock_redis):
    """Test user token invalidation check - token issued after invalidation."""
    invalidation_time = datetime.utcnow() - timedelta(hours=2)
    token_issued_at = datetime.utcnow() - timedelta(hours=1)
    
    mock_redis.get.return_value = json.dumps({
        "invalidated_at": invalidation_time.isoformat(),
        "reason": "password_change"
    })
    
    result = await blacklist_service.is_user_token_invalidated(
        user_id=1,
        token_issued_at=token_issued_at
    )
    
    assert result is False


@pytest.mark.asyncio
async def test_is_user_token_invalidated_no_invalidation(blacklist_service, mock_redis):
    """Test user token invalidation check - no invalidation record."""
    mock_redis.get.return_value = None
    
    result = await blacklist_service.is_user_token_invalidated(
        user_id=1,
        token_issued_at=datetime.utcnow()
    )
    
    assert result is False

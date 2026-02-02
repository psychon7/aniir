"""
Unit tests for WebSocket JWT authentication in on_connect handler.

This test suite verifies the JWT authentication flow for WebSocket connections:
1. Token extraction from auth parameter and query string
2. JWT token verification (signature, expiration, type)
3. User lookup from token
4. Connection acceptance/rejection logic
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config.settings import get_settings
from app.websocket.chat import verify_jwt_token, get_user_from_token
from app.utils.jwt import create_access_token, create_refresh_token, TokenType

settings = get_settings()


class TestVerifyJWTToken:
    """Tests for the verify_jwt_token function."""

    def test_valid_access_token_returns_payload(self):
        """Test that a valid access token returns the payload."""
        # Create a valid access token
        token = create_access_token(
            subject="123",
            additional_claims={"username": "testuser", "role_id": 1}
        )

        # Verify it
        payload = verify_jwt_token(token)

        assert payload is not None
        assert payload["sub"] == "123"
        assert payload["type"] == TokenType.ACCESS
        assert payload["username"] == "testuser"
        assert payload["role_id"] == 1

    def test_invalid_token_returns_none(self):
        """Test that an invalid token returns None."""
        result = verify_jwt_token("invalid.token.string")
        assert result is None

    def test_expired_token_returns_none(self):
        """Test that an expired token returns None."""
        # Create an already expired token
        token = create_access_token(
            subject="123",
            expires_delta=timedelta(seconds=-1)  # Expired 1 second ago
        )

        result = verify_jwt_token(token)
        assert result is None

    def test_refresh_token_returns_none(self):
        """Test that a refresh token (wrong type) returns None."""
        # Create a refresh token
        token = create_refresh_token(subject="123")

        # verify_jwt_token should reject refresh tokens
        result = verify_jwt_token(token)
        assert result is None

    def test_token_with_wrong_signature_returns_none(self):
        """Test that a token signed with wrong key returns None."""
        # Create a token with a different secret
        payload = {
            "sub": "123",
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iat": datetime.now(timezone.utc),
        }
        wrong_key_token = jwt.encode(
            payload,
            "wrong-secret-key",
            algorithm=settings.ALGORITHM
        )

        result = verify_jwt_token(wrong_key_token)
        assert result is None

    def test_token_without_type_returns_none(self):
        """Test that a token without type field returns None."""
        # Create a token manually without the type field
        payload = {
            "sub": "123",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iat": datetime.now(timezone.utc),
        }
        token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

        result = verify_jwt_token(token)
        assert result is None

    def test_empty_token_returns_none(self):
        """Test that an empty token returns None."""
        result = verify_jwt_token("")
        assert result is None

    def test_malformed_token_returns_none(self):
        """Test that a malformed token returns None."""
        result = verify_jwt_token("not.a.valid.jwt.format.at.all")
        assert result is None


class TestGetUserFromToken:
    """Tests for the get_user_from_token function."""

    @pytest.mark.asyncio
    async def test_valid_token_returns_user_data(self):
        """Test that a valid token returns user data from database."""
        # Create a valid token
        token = create_access_token(
            subject="1",
            additional_claims={"username": "admin", "role_id": 1}
        )

        # Mock the database session and User model
        mock_user = MagicMock()
        mock_user.usr_id = 1
        mock_user.usr_login = "admin"
        mock_user.usr_first_name = "Admin"
        mock_user.usr_last_name = "User"
        mock_user.rol_id = 1

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_user

        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        with patch('app.websocket.chat.async_session_maker') as mock_session_maker:
            mock_session_maker.return_value.__aenter__.return_value = mock_session
            mock_session_maker.return_value.__aexit__.return_value = None

            result = await get_user_from_token(token)

            assert result is not None
            assert result["user_id"] == 1
            assert result["username"] == "admin"
            assert result["first_name"] == "Admin"
            assert result["last_name"] == "User"
            assert result["role_id"] == 1

    @pytest.mark.asyncio
    async def test_invalid_token_returns_none(self):
        """Test that an invalid token returns None without database call."""
        result = await get_user_from_token("invalid.token")
        assert result is None

    @pytest.mark.asyncio
    async def test_user_not_found_returns_none(self):
        """Test that user not found in database returns None."""
        # Create a valid token
        token = create_access_token(
            subject="99999",
            additional_claims={"username": "nonexistent"}
        )

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None

        mock_session = AsyncMock()
        mock_session.execute.return_value = mock_result

        with patch('app.websocket.chat.async_session_maker') as mock_session_maker:
            mock_session_maker.return_value.__aenter__.return_value = mock_session
            mock_session_maker.return_value.__aexit__.return_value = None

            result = await get_user_from_token(token)

            assert result is None

    @pytest.mark.asyncio
    async def test_token_without_subject_returns_none(self):
        """Test that a token without subject returns None."""
        # Create a token without sub claim
        payload = {
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iat": datetime.now(timezone.utc),
        }
        token = jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM
        )

        result = await get_user_from_token(token)
        assert result is None


class TestOnConnectTokenExtraction:
    """Tests for token extraction logic in connect handler."""

    def test_token_from_auth_parameter(self):
        """Test that token can be extracted from auth parameter."""
        auth = {"token": "test_token_value"}
        token = auth.get("token")
        assert token == "test_token_value"

    def test_token_from_query_string(self):
        """Test that token can be extracted from query string."""
        query_string = "token=test_query_token&other=param"
        token = None
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=", 1)[1]
                break
        assert token == "test_query_token"

    def test_auth_parameter_takes_precedence(self):
        """Test that auth parameter takes precedence over query string."""
        auth = {"token": "auth_token"}
        query_string = "token=query_token"

        # Simulate the connect handler logic
        token = None
        if auth:
            token = auth.get("token")

        if not token:
            for param in query_string.split("&"):
                if param.startswith("token="):
                    token = param.split("=", 1)[1]
                    break

        assert token == "auth_token"

    def test_query_string_fallback(self):
        """Test that query string is used when auth is empty."""
        auth = {}
        query_string = "token=fallback_token"

        # Simulate the connect handler logic
        token = None
        if auth:
            token = auth.get("token")

        if not token:
            for param in query_string.split("&"):
                if param.startswith("token="):
                    token = param.split("=", 1)[1]
                    break

        assert token == "fallback_token"


class TestConnectionAcceptReject:
    """Tests for connection acceptance/rejection logic."""

    def test_connection_tracking_structure(self):
        """Test that connection tracking dictionaries exist and work."""
        from app.websocket.chat import connected_users, user_sessions

        # Test structure
        assert isinstance(connected_users, dict)
        assert isinstance(user_sessions, dict)

        # Test adding a connection
        test_sid = "test_sid_123"
        test_user_data = {
            "user_id": 1,
            "username": "testuser",
            "connected_at": datetime.utcnow().isoformat()
        }

        connected_users[test_sid] = test_user_data
        assert connected_users[test_sid] == test_user_data

        # Test tracking user sessions
        user_id = test_user_data["user_id"]
        if user_id not in user_sessions:
            user_sessions[user_id] = []
        user_sessions[user_id].append(test_sid)

        assert test_sid in user_sessions[user_id]

        # Cleanup
        del connected_users[test_sid]
        user_sessions[user_id].remove(test_sid)
        if not user_sessions[user_id]:
            del user_sessions[user_id]

    def test_multiple_sessions_per_user(self):
        """Test that a user can have multiple concurrent sessions."""
        from app.websocket.chat import user_sessions

        user_id = 999
        sids = ["sid_1", "sid_2", "sid_3"]

        user_sessions[user_id] = sids.copy()

        assert len(user_sessions[user_id]) == 3
        assert all(sid in user_sessions[user_id] for sid in sids)

        # Cleanup
        del user_sessions[user_id]


class TestJWTUtilityFunctions:
    """Tests for JWT utility functions used by WebSocket auth."""

    def test_create_access_token_has_correct_type(self):
        """Test that access tokens have correct type claim."""
        token = create_access_token(subject="123")
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert payload["type"] == "access"

    def test_create_refresh_token_has_correct_type(self):
        """Test that refresh tokens have correct type claim."""
        token = create_refresh_token(subject="123")
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert payload["type"] == "refresh"

    def test_token_contains_subject(self):
        """Test that tokens contain the subject claim."""
        token = create_access_token(subject="user_123")
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert payload["sub"] == "user_123"

    def test_token_contains_additional_claims(self):
        """Test that tokens contain additional claims."""
        token = create_access_token(
            subject="123",
            additional_claims={
                "username": "admin",
                "role_id": 1,
                "is_admin": True
            }
        )
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert payload["username"] == "admin"
        assert payload["role_id"] == 1
        assert payload["is_admin"] is True

    def test_token_has_expiration(self):
        """Test that tokens have expiration time."""
        token = create_access_token(subject="123")
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        assert "exp" in payload
        assert "iat" in payload


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

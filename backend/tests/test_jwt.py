"""
Tests for JWT token utilities.

Tests cover:
- Token creation (access and refresh)
- Token verification
- Token expiration handling
- Password hashing and verification
- Token refresh functionality
"""

import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
import time

from app.utils.jwt import (
    # Token types and models
    TokenType,
    TokenPayload,
    TokenData,
    # Exceptions
    JWTError,
    TokenExpiredError,
    InvalidTokenError,
    TokenTypeError,
    # Token creation
    create_access_token,
    create_refresh_token,
    create_token_pair,
    # Token verification
    verify_token,
    verify_access_token,
    verify_refresh_token,
    decode_token_unsafe,
    get_token_subject,
    get_token_payload,
    is_token_valid,
    get_token_expiry,
    is_token_expired,
    # Token refresh
    refresh_access_token,
    refresh_token_pair,
)
from app.utils.password import (
    hash_password,
    verify_password,
    needs_rehash,
)


class TestTokenCreation:
    """Tests for token creation functions."""

    def test_create_access_token_basic(self):
        """Test basic access token creation."""
        token = create_access_token(subject="123")

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_claims(self):
        """Test access token with additional claims."""
        claims = {"username": "testuser", "role_id": 1}
        token = create_access_token(subject="123", additional_claims=claims)

        payload = verify_token(token)
        assert payload["sub"] == "123"
        assert payload["username"] == "testuser"
        assert payload["role_id"] == 1
        assert payload["type"] == TokenType.ACCESS

    def test_create_access_token_with_custom_expiry(self):
        """Test access token with custom expiration."""
        expires = timedelta(hours=2)
        token = create_access_token(subject="123", expires_delta=expires)

        expiry = get_token_expiry(token)
        now = datetime.now(timezone.utc)

        # Should expire approximately 2 hours from now
        assert expiry is not None
        diff = (expiry - now).total_seconds()
        assert 7100 < diff < 7300  # ~2 hours in seconds

    def test_create_refresh_token_basic(self):
        """Test basic refresh token creation."""
        token = create_refresh_token(subject="456")

        assert token is not None
        assert isinstance(token, str)

        payload = verify_token(token)
        assert payload["type"] == TokenType.REFRESH

    def test_create_token_pair(self):
        """Test creation of token pair."""
        result = create_token_pair(
            subject="789",
            additional_claims={"username": "admin"}
        )

        assert isinstance(result, TokenData)
        assert result.access_token is not None
        assert result.refresh_token is not None
        assert result.token_type == "bearer"
        assert result.expires_in > 0

    def test_token_subject_types(self):
        """Test token creation with different subject types."""
        # String subject
        token1 = create_access_token(subject="user123")
        payload1 = verify_token(token1)
        assert payload1["sub"] == "user123"

        # Integer subject
        token2 = create_access_token(subject=456)
        payload2 = verify_token(token2)
        assert payload2["sub"] == "456"


class TestTokenVerification:
    """Tests for token verification functions."""

    def test_verify_valid_access_token(self):
        """Test verification of valid access token."""
        token = create_access_token(subject="123")
        payload = verify_access_token(token)

        assert payload["sub"] == "123"
        assert payload["type"] == TokenType.ACCESS

    def test_verify_valid_refresh_token(self):
        """Test verification of valid refresh token."""
        token = create_refresh_token(subject="123")
        payload = verify_refresh_token(token)

        assert payload["sub"] == "123"
        assert payload["type"] == TokenType.REFRESH

    def test_verify_token_wrong_type(self):
        """Test verification fails for wrong token type."""
        access_token = create_access_token(subject="123")

        # Should fail when expecting refresh token
        with pytest.raises(TokenTypeError):
            verify_refresh_token(access_token)

    def test_verify_invalid_token(self):
        """Test verification fails for invalid token."""
        with pytest.raises(InvalidTokenError):
            verify_token("invalid.token.here")

    def test_verify_malformed_token(self):
        """Test verification fails for malformed token."""
        with pytest.raises(InvalidTokenError):
            verify_token("not-a-jwt-at-all")

    def test_get_token_subject(self):
        """Test extracting subject from token."""
        token = create_access_token(subject="user-789")
        subject = get_token_subject(token)

        assert subject == "user-789"

    def test_get_token_subject_invalid(self):
        """Test subject extraction returns None for invalid token."""
        subject = get_token_subject("invalid.token")
        assert subject is None

    def test_is_token_valid(self):
        """Test token validity check."""
        valid_token = create_access_token(subject="123")

        assert is_token_valid(valid_token) is True
        assert is_token_valid(valid_token, expected_type=TokenType.ACCESS) is True
        assert is_token_valid(valid_token, expected_type=TokenType.REFRESH) is False
        assert is_token_valid("invalid") is False

    def test_decode_token_unsafe(self):
        """Test unsafe token decoding."""
        token = create_access_token(subject="123", additional_claims={"test": "value"})

        payload = decode_token_unsafe(token)
        assert payload is not None
        assert payload["sub"] == "123"
        assert payload["test"] == "value"

        # Should also work with invalid signature
        invalid_payload = decode_token_unsafe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMifQ.invalid")
        assert invalid_payload is None or invalid_payload.get("sub") == "123"

    def test_get_token_expiry(self):
        """Test getting token expiry time."""
        token = create_access_token(subject="123")
        expiry = get_token_expiry(token)

        assert expiry is not None
        assert isinstance(expiry, datetime)
        assert expiry > datetime.now(timezone.utc)

    def test_is_token_expired(self):
        """Test token expiration check."""
        # Fresh token should not be expired
        fresh_token = create_access_token(subject="123")
        assert is_token_expired(fresh_token) is False

        # Invalid token should be considered expired
        assert is_token_expired("invalid") is True

    def test_get_token_payload_model(self):
        """Test getting validated TokenPayload model."""
        claims = {"username": "testuser", "role_id": 2, "is_admin": False}
        token = create_access_token(subject="123", additional_claims=claims)

        payload = get_token_payload(token)

        assert payload is not None
        assert isinstance(payload, TokenPayload)
        assert payload.sub == "123"
        assert payload.type == TokenType.ACCESS
        assert payload.username == "testuser"
        assert payload.role_id == 2
        assert payload.is_admin is False


class TestTokenExpiration:
    """Tests for token expiration handling."""

    def test_expired_token_raises_error(self):
        """Test that expired tokens raise TokenExpiredError."""
        # Create a token that expires immediately
        token = create_access_token(
            subject="123",
            expires_delta=timedelta(seconds=-1)  # Already expired
        )

        with pytest.raises(TokenExpiredError):
            verify_access_token(token)

    def test_verify_almost_expired_token(self):
        """Test token just before expiration is still valid."""
        # Create token expiring in 5 seconds
        token = create_access_token(
            subject="123",
            expires_delta=timedelta(seconds=5)
        )

        # Should still be valid
        payload = verify_access_token(token)
        assert payload["sub"] == "123"


class TestPasswordHashing:
    """Tests for password hashing utilities."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "SecurePassword123!"
        hashed = hash_password(password)

        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0
        # Bcrypt hashes start with $2b$ or $2a$
        assert hashed.startswith("$2")

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "MySecretPass!"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with wrong password."""
        hashed = hash_password("CorrectPassword")

        assert verify_password("WrongPassword", hashed) is False

    def test_verify_password_invalid_hash(self):
        """Test password verification with invalid hash returns False."""
        assert verify_password("password", "not-a-valid-hash") is False

    def test_hash_uniqueness(self):
        """Test that same password produces different hashes (salting)."""
        password = "SamePassword"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # Same password should verify against both hashes
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

        # But hashes should be different (due to salt)
        assert hash1 != hash2

    def test_needs_rehash(self):
        """Test rehash detection."""
        hashed = hash_password("password")
        # Fresh hash shouldn't need rehash
        assert needs_rehash(hashed) is False


class TestTokenRefresh:
    """Tests for token refresh functionality."""

    def test_refresh_access_token(self):
        """Test creating new access token from refresh token."""
        # Create initial tokens
        refresh = create_refresh_token(
            subject="user-123",
            additional_claims={"username": "testuser", "role_id": 1}
        )

        # Refresh to get new access token
        new_access = refresh_access_token(refresh)

        payload = verify_access_token(new_access)
        assert payload["sub"] == "user-123"
        assert payload["username"] == "testuser"
        assert payload["role_id"] == 1

    def test_refresh_access_token_with_new_claims(self):
        """Test refresh with additional new claims."""
        refresh = create_refresh_token(subject="123")

        new_access = refresh_access_token(
            refresh,
            additional_claims={"new_claim": "value"}
        )

        payload = verify_access_token(new_access)
        assert payload["new_claim"] == "value"

    def test_refresh_token_pair(self):
        """Test refreshing both tokens (rotation)."""
        original_refresh = create_refresh_token(
            subject="456",
            additional_claims={"username": "admin"}
        )

        new_tokens = refresh_token_pair(original_refresh)

        assert isinstance(new_tokens, TokenData)
        assert new_tokens.access_token is not None
        assert new_tokens.refresh_token is not None

        # Verify new tokens work
        access_payload = verify_access_token(new_tokens.access_token)
        assert access_payload["sub"] == "456"
        assert access_payload["username"] == "admin"

    def test_refresh_with_invalid_token(self):
        """Test refresh fails with invalid token."""
        with pytest.raises(InvalidTokenError):
            refresh_access_token("invalid-token")

    def test_refresh_with_access_token_fails(self):
        """Test refresh fails when given access token instead of refresh."""
        access_token = create_access_token(subject="123")

        with pytest.raises(TokenTypeError):
            refresh_access_token(access_token)


class TestTokenTypes:
    """Tests for token type constants and models."""

    def test_token_type_constants(self):
        """Test TokenType constants."""
        assert TokenType.ACCESS == "access"
        assert TokenType.REFRESH == "refresh"

    def test_token_data_model(self):
        """Test TokenData model."""
        data = TokenData(
            access_token="access.token.here",
            refresh_token="refresh.token.here",
            expires_in=1800
        )

        assert data.access_token == "access.token.here"
        assert data.refresh_token == "refresh.token.here"
        assert data.token_type == "bearer"
        assert data.expires_in == 1800

    def test_token_payload_model(self):
        """Test TokenPayload model."""
        now = datetime.now(timezone.utc)
        payload = TokenPayload(
            sub="123",
            type=TokenType.ACCESS,
            exp=now + timedelta(hours=1),
            iat=now,
            username="testuser"
        )

        assert payload.sub == "123"
        assert payload.type == TokenType.ACCESS
        assert payload.username == "testuser"
        assert payload.role_id is None  # Optional field


class TestExceptions:
    """Tests for JWT exception classes."""

    def test_jwt_error(self):
        """Test base JWTError."""
        error = JWTError("Test error", "TEST_CODE")
        assert str(error) == "Test error"
        assert error.code == "TEST_CODE"

    def test_token_expired_error(self):
        """Test TokenExpiredError."""
        error = TokenExpiredError()
        assert "expired" in str(error).lower()
        assert error.code == "TOKEN_EXPIRED"

    def test_invalid_token_error(self):
        """Test InvalidTokenError."""
        error = InvalidTokenError("Custom message")
        assert str(error) == "Custom message"
        assert error.code == "INVALID_TOKEN"

    def test_token_type_error(self):
        """Test TokenTypeError."""
        error = TokenTypeError(expected="refresh", got="access")
        assert "refresh" in str(error)
        assert "access" in str(error)
        assert error.code == "WRONG_TOKEN_TYPE"

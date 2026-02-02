"""
JWT Token Utilities - Token creation and verification.

This module provides comprehensive JWT token management including:
- Access token creation/verification
- Refresh token creation/verification
- Token payload extraction and validation
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

from jose import JWTError, jwt
from pydantic import BaseModel

from app.config import get_settings

# Configure logging
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

class TokenType:
    """Token type constants."""
    ACCESS = "access"
    REFRESH = "refresh"


class TokenPayload(BaseModel):
    """Validated token payload structure."""
    sub: str  # Subject (user ID)
    type: str  # Token type (access/refresh)
    exp: datetime  # Expiration time
    iat: datetime  # Issued at time
    jti: Optional[str] = None  # JWT ID (for token revocation)

    # Optional user data
    username: Optional[str] = None
    role_id: Optional[int] = None
    is_admin: Optional[bool] = None


class TokenData(BaseModel):
    """Token response data."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class JWTError(Exception):
    """Custom JWT error for token operations."""

    def __init__(self, message: str, code: str = "JWT_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class TokenExpiredError(JWTError):
    """Token has expired."""

    def __init__(self, message: str = "Token has expired"):
        super().__init__(message, "TOKEN_EXPIRED")


class InvalidTokenError(JWTError):
    """Token is invalid."""

    def __init__(self, message: str = "Invalid token"):
        super().__init__(message, "INVALID_TOKEN")


class TokenTypeError(JWTError):
    """Wrong token type provided."""

    def __init__(self, expected: str, got: str):
        super().__init__(
            f"Expected {expected} token, got {got} token",
            "WRONG_TOKEN_TYPE"
        )


# =============================================================================
# Token Creation Functions
# =============================================================================

def create_access_token(
    subject: Union[str, int],
    additional_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: The subject of the token (typically user ID)
        additional_claims: Extra claims to include in the token
        expires_delta: Custom expiration time (default from settings)

    Returns:
        Encoded JWT access token string
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    to_encode = {
        "sub": str(subject),
        "type": TokenType.ACCESS,
        "iat": now,
        "exp": expire,
    }

    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    logger.debug(f"Access token created for subject: {subject}")
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, int],
    additional_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT refresh token.

    Args:
        subject: The subject of the token (typically user ID)
        additional_claims: Extra claims to include in the token
        expires_delta: Custom expiration time (default from settings)

    Returns:
        Encoded JWT refresh token string
    """
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    to_encode = {
        "sub": str(subject),
        "type": TokenType.REFRESH,
        "iat": now,
        "exp": expire,
    }

    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    logger.debug(f"Refresh token created for subject: {subject}")
    return encoded_jwt


def create_token_pair(
    subject: Union[str, int],
    additional_claims: Optional[Dict[str, Any]] = None,
) -> TokenData:
    """
    Create both access and refresh tokens.

    Args:
        subject: The subject of the token (typically user ID)
        additional_claims: Extra claims to include in the tokens

    Returns:
        TokenData with access_token, refresh_token, and metadata
    """
    access_token = create_access_token(
        subject=subject,
        additional_claims=additional_claims
    )

    refresh_token = create_refresh_token(
        subject=subject,
        additional_claims=additional_claims
    )

    return TokenData(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    )


# =============================================================================
# Token Verification Functions
# =============================================================================

def verify_token(
    token: str,
    expected_type: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Verify a JWT token and return its payload.

    Args:
        token: The JWT token string to verify
        expected_type: Expected token type (access/refresh). If provided,
                      raises TokenTypeError if token type doesn't match.

    Returns:
        Decoded token payload as dictionary

    Raises:
        InvalidTokenError: If token is malformed or invalid
        TokenExpiredError: If token has expired
        TokenTypeError: If token type doesn't match expected_type
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Verify token type if expected
        if expected_type:
            token_type = payload.get("type")
            if token_type != expected_type:
                raise TokenTypeError(expected=expected_type, got=token_type or "unknown")

        return payload

    except TokenTypeError:
        # Re-raise TokenTypeError without wrapping
        raise
    except TokenExpiredError:
        # Re-raise TokenExpiredError without wrapping
        raise
    except jwt.ExpiredSignatureError:
        logger.warning("Token verification failed: expired")
        raise TokenExpiredError()
    except jwt.JWTClaimsError as e:
        logger.warning(f"Token verification failed: invalid claims - {e}")
        raise InvalidTokenError(f"Invalid token claims: {e}")
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise InvalidTokenError(str(e))


def verify_access_token(token: str) -> Dict[str, Any]:
    """
    Verify an access token.

    Args:
        token: The JWT access token to verify

    Returns:
        Decoded token payload

    Raises:
        InvalidTokenError: If token is invalid
        TokenExpiredError: If token has expired
        TokenTypeError: If token is not an access token
    """
    return verify_token(token, expected_type=TokenType.ACCESS)


def verify_refresh_token(token: str) -> Dict[str, Any]:
    """
    Verify a refresh token.

    Args:
        token: The JWT refresh token to verify

    Returns:
        Decoded token payload

    Raises:
        InvalidTokenError: If token is invalid
        TokenExpiredError: If token has expired
        TokenTypeError: If token is not a refresh token
    """
    return verify_token(token, expected_type=TokenType.REFRESH)


def decode_token_unsafe(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode a token without verification (for inspection only).

    WARNING: This should only be used for debugging/logging purposes.
    Never use this to make security decisions.

    Args:
        token: The JWT token string

    Returns:
        Decoded payload or None if decoding fails
    """
    try:
        # python-jose requires key and algorithms even when not verifying
        # We use a dummy key since we're not verifying the signature
        return jwt.decode(
            token,
            key="",  # Dummy key since we're not verifying
            algorithms=[settings.ALGORITHM],
            options={"verify_signature": False, "verify_exp": False}
        )
    except Exception:
        return None


def get_token_subject(token: str) -> Optional[str]:
    """
    Extract the subject (user ID) from a token.

    Args:
        token: The JWT token string

    Returns:
        Subject string or None if extraction fails
    """
    try:
        payload = verify_token(token)
        return payload.get("sub")
    except (InvalidTokenError, TokenExpiredError):
        return None


def get_token_payload(token: str) -> Optional[TokenPayload]:
    """
    Get a validated TokenPayload from a token.

    Args:
        token: The JWT token string

    Returns:
        TokenPayload object or None if validation fails
    """
    try:
        payload = verify_token(token)
        return TokenPayload(
            sub=payload["sub"],
            type=payload["type"],
            exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
            iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
            jti=payload.get("jti"),
            username=payload.get("username"),
            role_id=payload.get("role_id"),
            is_admin=payload.get("is_admin"),
        )
    except Exception as e:
        logger.warning(f"Failed to get token payload: {e}")
        return None


def is_token_valid(token: str, expected_type: Optional[str] = None) -> bool:
    """
    Check if a token is valid (non-throwing version).

    Args:
        token: The JWT token string
        expected_type: Optional expected token type

    Returns:
        True if token is valid, False otherwise
    """
    try:
        verify_token(token, expected_type=expected_type)
        return True
    except (InvalidTokenError, TokenExpiredError, TokenTypeError):
        return False


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a token.

    Args:
        token: The JWT token string

    Returns:
        Expiration datetime or None if extraction fails
    """
    payload = decode_token_unsafe(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    return None


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired.

    Args:
        token: The JWT token string

    Returns:
        True if token is expired or invalid, False otherwise
    """
    expiry = get_token_expiry(token)
    if expiry is None:
        return True
    return datetime.now(timezone.utc) > expiry


# =============================================================================
# Token Refresh Functions
# =============================================================================

def refresh_access_token(
    refresh_token: str,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Create a new access token from a valid refresh token.

    Args:
        refresh_token: Valid refresh token
        additional_claims: Extra claims to add to the new access token

    Returns:
        New access token

    Raises:
        InvalidTokenError: If refresh token is invalid
        TokenExpiredError: If refresh token has expired
        TokenTypeError: If token is not a refresh token
    """
    payload = verify_refresh_token(refresh_token)
    subject = payload["sub"]

    # Merge original claims with additional claims
    claims = {}
    for key in ["username", "role_id", "is_admin"]:
        if key in payload:
            claims[key] = payload[key]

    if additional_claims:
        claims.update(additional_claims)

    return create_access_token(
        subject=subject,
        additional_claims=claims if claims else None
    )


def refresh_token_pair(
    refresh_token: str,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> TokenData:
    """
    Create new token pair from a valid refresh token.

    This rotates the refresh token as well for better security.

    Args:
        refresh_token: Valid refresh token
        additional_claims: Extra claims to add to the new tokens

    Returns:
        New TokenData with both tokens

    Raises:
        InvalidTokenError: If refresh token is invalid
        TokenExpiredError: If refresh token has expired
        TokenTypeError: If token is not a refresh token
    """
    payload = verify_refresh_token(refresh_token)
    subject = payload["sub"]

    # Merge original claims with additional claims
    claims = {}
    for key in ["username", "role_id", "is_admin"]:
        if key in payload:
            claims[key] = payload[key]

    if additional_claims:
        claims.update(additional_claims)

    return create_token_pair(
        subject=subject,
        additional_claims=claims if claims else None
    )

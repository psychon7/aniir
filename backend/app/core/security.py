"""
Security utilities - Authentication and authorization

Provides:
- Password hashing and verification
- JWT token creation and validation
- Security dependencies for FastAPI
"""
from typing import Optional, Any, Dict
from datetime import datetime, timedelta, timezone
import uuid
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)

# =============================================================================
# Security schemes
# =============================================================================

security = HTTPBearer(auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# =============================================================================
# Token Payload Model
# =============================================================================

class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: Optional[str] = None  # user_id as string
    user_id: Optional[int] = None
    username: Optional[str] = None
    role_id: Optional[int] = None
    society_id: Optional[int] = None
    type: str = "access"  # "access" or "refresh"
    exp: Optional[datetime] = None
    iat: Optional[datetime] = None
    jti: Optional[str] = None  # JWT ID for token revocation

    class Config:
        extra = "allow"


# =============================================================================
# Password Utilities
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: The plain text password to verify.
        hashed_password: The hashed password to compare against.

    Returns:
        True if the password matches, False otherwise.
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: The plain text password to hash.

    Returns:
        The hashed password.
    """
    return pwd_context.hash(password)


# =============================================================================
# Token Creation
# =============================================================================

def create_access_token(
    user_id: int,
    username: str = "",
    role_id: int = 1,
    society_id: int = 1,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, str, datetime]:
    """
    Create a JWT access token.

    Args:
        user_id: The user's ID.
        username: The user's username.
        role_id: The user's role ID.
        society_id: The user's society ID.
        expires_delta: Optional custom expiration time.

    Returns:
        Tuple of (token, jti, expiration datetime).
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    jti = str(uuid.uuid4())
    to_encode = {
        "sub": str(user_id),
        "user_id": user_id,
        "username": username,
        "role_id": role_id,
        "society_id": society_id,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": jti,
    }

    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expire


def create_refresh_token(
    user_id: int,
    username: str = "",
    role_id: int = 1,
    society_id: int = 1,
    expires_delta: Optional[timedelta] = None
) -> tuple[str, str, datetime]:
    """
    Create a JWT refresh token.

    Args:
        user_id: The user's ID.
        username: The user's username.
        role_id: The user's role ID.
        society_id: The user's society ID.
        expires_delta: Optional custom expiration time.

    Returns:
        Tuple of (token, jti, expiration datetime).
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    jti = str(uuid.uuid4())
    to_encode = {
        "sub": str(user_id),
        "user_id": user_id,
        "username": username,
        "role_id": role_id,
        "society_id": society_id,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": jti,
    }

    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expire


def create_token_pair(user_id: int, username: str = "", role_id: int = 1, society_id: int = 1) -> Dict[str, Any]:
    """
    Create both access and refresh tokens.

    Args:
        user_id: The user's ID.
        username: The user's username.
        role_id: The user's role ID.
        society_id: The user's society ID.

    Returns:
        Dictionary with access_token, refresh_token, and expiration info.
    """
    access_token, access_jti, access_exp = create_access_token(
        user_id=user_id,
        username=username,
        role_id=role_id,
        society_id=society_id
    )
    refresh_token, refresh_jti, refresh_exp = create_refresh_token(
        user_id=user_id,
        username=username,
        role_id=role_id,
        society_id=society_id
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "access_token_expires": access_exp,
        "refresh_token_expires": refresh_exp,
        "access_jti": access_jti,
        "refresh_jti": refresh_jti,
    }


# =============================================================================
# Token Validation
# =============================================================================

def decode_token(token: str) -> Optional[TokenPayload]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT token string to decode.

    Returns:
        TokenPayload object with decoded data, or None if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Parse expiration and issued_at times
        exp = None
        iat = None
        if payload.get("exp"):
            exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        if payload.get("iat"):
            iat = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)

        return TokenPayload(
            sub=payload.get("sub"),
            user_id=int(payload.get("sub", 0)) if payload.get("sub") else payload.get("user_id"),
            username=payload.get("username"),
            role_id=payload.get("role_id"),
            society_id=payload.get("society_id"),
            type=payload.get("type", "access"),
            exp=exp,
            iat=iat,
            jti=payload.get("jti"),
        )
    except JWTError as e:
        logger.debug(f"JWT error: {e}")
        return None
    except Exception as e:
        logger.warning(f"Token decode error: {e}")
        return None


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode an access token and return the payload as a dictionary.

    This is a convenience function for websocket authentication.

    Args:
        token: The JWT token string to decode.

    Returns:
        Dictionary with token payload, or None if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except Exception as e:
        logger.debug(f"Access token decode error: {e}")
        return None


# =============================================================================
# User Model (for type hints)
# =============================================================================

class CurrentUser:
    """Current authenticated user."""
    def __init__(
        self,
        id: int,
        username: str,
        email: str,
        role: str,
        society_id: Optional[int] = None
    ):
        self.id = id
        self.username = username
        self.email = email
        self.role = role
        self.society_id = society_id


# =============================================================================
# FastAPI Dependencies
# =============================================================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> CurrentUser:
    """
    Dependency to get current authenticated user from JWT token.

    For development: Returns a mock user if no credentials provided.
    For production: Validates token and returns user info.
    """
    if not credentials:
        # Development mode - return mock user
        return CurrentUser(
            id=1,
            username="dev_user",
            email="dev@example.com",
            role="admin",
            society_id=1
        )

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return CurrentUser(
        id=payload.user_id or int(payload.sub or 0),
        username=payload.username or "user",
        email=f"{payload.username}@example.com" if payload.username else "user@example.com",
        role="user",
        society_id=payload.society_id
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[CurrentUser]:
    """
    Optional authentication - returns None if not authenticated.
    """
    if not credentials:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


# =============================================================================
# Exports
# =============================================================================

__all__ = [
    # Security schemes
    "security",
    "oauth2_scheme",
    # Password utilities
    "verify_password",
    "get_password_hash",
    # Token creation
    "create_access_token",
    "create_refresh_token",
    "create_token_pair",
    # Token validation
    "decode_token",
    "decode_access_token",
    "TokenPayload",
    # User
    "CurrentUser",
    "get_current_user",
    "get_current_user_optional",
]

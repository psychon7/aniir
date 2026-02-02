"""
API dependencies for authentication and authorization.

This module re-exports common dependencies for use in API routers.
It provides a unified interface whether using the full auth system
or the simplified development dependencies.
"""
from typing import Optional
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

# Import from core modules
from app.core.database import get_db
from app.core.security import (
    decode_token,
    TokenPayload,
    oauth2_scheme,
)

# Re-export get_db
__all__ = [
    "get_db",
    "get_current_user",
    "get_current_active_user",
    "get_token_payload",
    "oauth2_scheme",
    "require_roles",
]


class MockUser:
    """
    Mock user for development when Redis/full auth is not available.
    """
    def __init__(self, user_id: int = 1, username: str = "dev_user"):
        self.Id = user_id
        self.id = user_id
        self.usr_id = user_id
        self.Username = username
        self.usr_login = username
        self.Email = f"{username}@example.com"
        self.usr_email = f"{username}@example.com"
        self.FirstName = "Dev"
        self.LastName = "User"
        self.usr_firstname = "Dev"
        self.usr_lastname = "User"
        self.IsActive = True
        self.usr_is_actived = True
        self.IsSuperAdmin = True
        self.usr_super_right = True
        self.rol_id = 1
        self.soc_id = 1
        self.role = None
        self.society = None

    def __getattr__(self, name):
        """Fallback for any missing attributes."""
        return None


async def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> MockUser:
    """
    Validate token and return current user.

    For development: Returns a mock user if no token provided.
    For production: Should check token blacklist and validate user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Development mode - no token required
    if token is None:
        return MockUser(user_id=1, username="dev_user")

    # Decode token
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception

    # In production, add token blacklist check here
    # try:
    #     blacklist_service = await get_token_blacklist_service()
    #     if await blacklist_service.is_token_blacklisted(payload.jti):
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="Token has been revoked",
    #             headers={"WWW-Authenticate": "Bearer"},
    #         )
    # except Exception:
    #     pass  # Redis not available, skip blacklist check

    # For development, return mock user with token info
    user_id = payload.user_id or (int(payload.sub) if payload.sub else 1)
    return MockUser(
        user_id=user_id,
        username=payload.username or "authenticated_user"
    )


async def get_current_active_user(
    current_user: MockUser = Depends(get_current_user)
) -> MockUser:
    """Get current active user."""
    is_active = getattr(current_user, 'IsActive', True) or \
                getattr(current_user, 'usr_is_actived', True)

    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_token_payload(
    token: Optional[str] = Depends(oauth2_scheme)
) -> TokenPayload:
    """Get token payload without user lookup (for logout)."""
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_roles(*roles: str):
    """
    Dependency factory for role-based access control.

    Usage:
        @router.get("/admin", dependencies=[Depends(require_roles("admin"))])
    """
    async def role_checker(current_user: MockUser = Depends(get_current_active_user)):
        # Check if user has required role
        user_role = getattr(current_user, 'role', None)
        if user_role and hasattr(user_role, 'Code'):
            if user_role.Code not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
        # In development, allow access
        return current_user
    return role_checker

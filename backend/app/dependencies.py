"""
FastAPI dependencies for dependency injection.

This module provides all common dependencies used across the API routers:
- Database session management
- Authentication dependencies
- Service factory dependencies
"""
from typing import Generator, Optional, Any
from datetime import datetime, timedelta, timezone
import uuid
import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import SessionLocal

logger = logging.getLogger(__name__)

# =============================================================================
# Security schemes
# =============================================================================

# HTTP Bearer for JWT tokens
security = HTTPBearer(auto_error=False)

# OAuth2 scheme for Swagger UI integration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


# =============================================================================
# Database Dependencies
# =============================================================================

def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency.
    Yields a SQLAlchemy session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_async_db():
    """
    Async database session dependency placeholder.
    For now, returns sync session wrapped for async compatibility.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =============================================================================
# User/Auth Dependencies
# =============================================================================

class MockUser:
    """
    Mock user for development when authentication is not fully configured.
    This allows the app to start and endpoints to be tested.
    """
    def __init__(self, user_id: int = 1, username: str = "dev_user", is_admin: bool = True):
        # Standard user attributes
        self.id = user_id
        self.Id = user_id
        self.usr_id = user_id
        self.username = username
        self.usr_login = username
        self.email = f"{username}@example.com"
        self.Email = f"{username}@example.com"
        self.usr_email = f"{username}@example.com"
        self.is_admin = is_admin
        self.is_active = True
        self.IsActive = True
        self.usr_is_actived = True
        self.usr_super_right = is_admin
        self.IsSuperAdmin = is_admin
        self.FirstName = "Dev"
        self.LastName = "User"
        self.usr_firstname = "Dev"
        self.usr_lastname = "User"
        self.rol_id = 1
        self.soc_id = 1
        self.society_id = 1
        self.role = None
        self.society = None
        self.CreatedAt = datetime.utcnow()
        self.UpdatedAt = datetime.utcnow()
        self.LastLoginAt = datetime.utcnow()
        self.PasswordHash = ""
        self.usr_pwd = ""
        self.usr_photo_path = None

    def __getattr__(self, name):
        """Fallback for any attribute access to prevent AttributeError."""
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> MockUser:
    """
    Get current authenticated user from JWT token.

    For development: Returns a mock user if no authentication is provided.
    In production: This should validate the JWT and return actual user info.
    """
    # In development mode, return mock user for easier testing
    # TODO: Implement actual JWT validation for production

    actual_token = None
    if credentials:
        actual_token = credentials.credentials
    elif token:
        actual_token = token

    if actual_token is None:
        # For development - return a mock user
        # In production, uncomment the raise statement below
        # raise HTTPException(
        #     status_code=status.HTTP_401_UNAUTHORIZED,
        #     detail="Not authenticated",
        #     headers={"WWW-Authenticate": "Bearer"}
        # )
        logger.debug("No token provided, returning mock user for development")
        return MockUser(user_id=1, username="dev_user", is_admin=True)

    # TODO: Implement actual token validation
    # For now, return mock user for any token
    return MockUser(user_id=1, username="authenticated_user", is_admin=True)


async def get_current_active_user(
    current_user: MockUser = Depends(get_current_user)
) -> MockUser:
    """
    Get current active user.
    Ensures the user account is active.
    """
    if not getattr(current_user, 'is_active', True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin_user(
    current_user: MockUser = Depends(get_current_active_user)
) -> MockUser:
    """
    Get current admin user.
    Requires the user to have admin privileges.
    """
    is_admin = getattr(current_user, 'is_admin', False) or \
               getattr(current_user, 'usr_super_right', False) or \
               getattr(current_user, 'IsSuperAdmin', False)

    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


# =============================================================================
# Auth Service Dependencies
# =============================================================================

class MockAuthService:
    """
    Mock auth service for development.
    Provides stub implementations of authentication methods.
    """

    def __init__(self, db: Session = None):
        self.db = db

    async def authenticate(self, username: str, password: str) -> dict:
        """Mock authentication - always succeeds in development."""
        from app.schemas.auth import AuthResponse, AuthUserInfo

        return AuthResponse(
            access_token="mock_access_token_" + str(uuid.uuid4()),
            refresh_token="mock_refresh_token_" + str(uuid.uuid4()),
            expires_in=1800,
            token_type="Bearer",
            user=AuthUserInfo(
                id=1,
                username=username,
                email=f"{username}@example.com",
                first_name="Dev",
                last_name="User",
                role_id=1,
                role_name="Admin",
                society_id=1,
                society_name="Default",
                is_active=True,
                last_login=datetime.utcnow()
            )
        )

    async def refresh_access_token(self, refresh_token: str) -> dict:
        """Mock token refresh."""
        return await self.authenticate("dev_user", "")

    def decode_token(self, token: str) -> Any:
        """Mock token decode."""
        class MockPayload:
            def __init__(self):
                self.sub = "1"
                self.user_id = 1
                self.username = "dev_user"
                self.role_id = 1
                self.society_id = 1
                self.type = "access"
                self.exp = datetime.now(timezone.utc) + timedelta(hours=1)
                self.iat = datetime.now(timezone.utc)
                self.jti = str(uuid.uuid4())
        return MockPayload()

    def verify_refresh_token(self, token: str) -> Any:
        """Mock refresh token verification."""
        payload = self.decode_token(token)
        payload.type = "refresh"
        return payload

    def _build_user_info(self, user) -> dict:
        """Build user info from user object."""
        from app.schemas.auth import AuthUserInfo

        return AuthUserInfo(
            id=getattr(user, 'usr_id', getattr(user, 'id', 1)),
            username=getattr(user, 'usr_login', getattr(user, 'username', 'user')),
            email=getattr(user, 'usr_email', getattr(user, 'email', 'user@example.com')),
            first_name=getattr(user, 'usr_firstname', getattr(user, 'FirstName', '')),
            last_name=getattr(user, 'usr_lastname', getattr(user, 'LastName', '')),
            role_id=getattr(user, 'rol_id', 1),
            role_name="User",
            society_id=getattr(user, 'soc_id', 1),
            society_name="Default",
            is_active=True,
            last_login=datetime.utcnow()
        )


def get_auth_service(db: Session = Depends(get_db)) -> MockAuthService:
    """
    Dependency for getting auth service.

    Returns MockAuthService for development.
    TODO: Return actual AuthService in production.
    """
    return MockAuthService(db)


# =============================================================================
# Exports for backwards compatibility
# =============================================================================

# Re-export common items for easier imports
__all__ = [
    # Database
    "get_db",
    "get_async_db",
    # Security schemes
    "security",
    "oauth2_scheme",
    # User dependencies
    "get_current_user",
    "get_current_active_user",
    "get_current_admin_user",
    # Auth service
    "get_auth_service",
    "MockAuthService",
    "MockUser",
]

"""
Authentication Schemas

Pydantic v2 schemas for authentication operations including:
- Login requests
- Token responses
- User registration
- Password management
"""

from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime


# =============================================================================
# Login Schemas
# =============================================================================

class LoginRequest(BaseModel):
    """Schema for user login request."""
    
    username: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Username or email address"
    )
    password: str = Field(
        ...,
        min_length=1,
        description="User password"
    )
    remember_me: bool = Field(
        default=False,
        description="Extended session duration"
    )


class LoginByEmailRequest(BaseModel):
    """Schema for login using email specifically."""
    
    email: EmailStr = Field(
        ...,
        description="User email address"
    )
    password: str = Field(
        ...,
        min_length=1,
        description="User password"
    )
    remember_me: bool = Field(
        default=False,
        description="Extended session duration"
    )


# =============================================================================
# Token Schemas
# =============================================================================

class TokenData(BaseModel):
    """Schema for JWT token payload data."""
    
    user_id: int | None = None
    username: str | None = None
    email: str | None = None
    role_id: int | None = None
    society_id: int | None = None
    scopes: list[str] = Field(default_factory=list)


class TokenResponse(BaseModel):
    """Schema for token response after successful authentication."""
    
    access_token: str = Field(
        ...,
        description="JWT access token"
    )
    token_type: str = Field(
        default="bearer",
        description="Token type (always 'bearer')"
    )
    expires_in: int = Field(
        ...,
        description="Token expiration time in seconds"
    )
    refresh_token: str | None = Field(
        default=None,
        description="Refresh token for obtaining new access tokens"
    )


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""
    
    refresh_token: str = Field(
        ...,
        description="Valid refresh token"
    )


# =============================================================================
# User Info Schemas (for auth responses)
# =============================================================================

class AuthUserInfo(BaseModel):
    """Minimal user info returned with authentication response."""
    
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    username: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    role_id: int | None = None
    role_name: str | None = None
    society_id: int | None = None
    society_name: str | None = None
    is_active: bool = True
    last_login: datetime | None = None


class AuthResponse(BaseModel):
    """Complete authentication response with token and user info."""
    
    access_token: str = Field(
        ...,
        description="JWT access token"
    )
    token_type: str = Field(
        default="bearer",
        description="Token type"
    )
    expires_in: int = Field(
        ...,
        description="Token expiration time in seconds"
    )
    refresh_token: str | None = Field(
        default=None,
        description="Refresh token"
    )
    user: AuthUserInfo = Field(
        ...,
        description="Authenticated user information"
    )


# =============================================================================
# Password Management Schemas
# =============================================================================

class PasswordChangeRequest(BaseModel):
    """Schema for password change request."""
    
    current_password: str = Field(
        ...,
        min_length=1,
        description="Current password"
    )
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password (min 8 characters)"
    )
    confirm_password: str = Field(
        ...,
        description="Confirm new password"
    )


class PasswordResetRequest(BaseModel):
    """Schema for initiating password reset."""
    
    email: EmailStr = Field(
        ...,
        description="Email address for password reset"
    )


class PasswordResetConfirm(BaseModel):
    """Schema for confirming password reset with token."""
    
    token: str = Field(
        ...,
        description="Password reset token"
    )
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password"
    )
    confirm_password: str = Field(
        ...,
        description="Confirm new password"
    )


# =============================================================================
# Registration Schemas
# =============================================================================

class UserRegisterRequest(BaseModel):
    """Schema for new user registration."""
    
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="Username (alphanumeric and underscore only)"
    )
    email: EmailStr = Field(
        ...,
        description="Email address"
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (min 8 characters)"
    )
    confirm_password: str = Field(
        ...,
        description="Confirm password"
    )
    first_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="First name"
    )
    last_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Last name"
    )
    society_id: int | None = Field(
        default=None,
        description="Associated society ID"
    )


# =============================================================================
# Session/Logout Schemas
# =============================================================================

class LogoutRequest(BaseModel):
    """Schema for logout request."""
    
    refresh_token: str | None = Field(
        default=None,
        description="Refresh token to invalidate"
    )
    all_sessions: bool = Field(
        default=False,
        description="Logout from all sessions"
    )


class SessionInfo(BaseModel):
    """Schema for active session information."""
    
    session_id: str
    device: str | None = None
    ip_address: str | None = None
    location: str | None = None
    created_at: datetime
    last_activity: datetime
    is_current: bool = False


# =============================================================================
# Validation Response Schemas
# =============================================================================

class TokenValidationResponse(BaseModel):
    """Schema for token validation response."""
    
    valid: bool = Field(
        ...,
        description="Whether the token is valid"
    )
    user_id: int | None = Field(
        default=None,
        description="User ID if token is valid"
    )
    expires_at: datetime | None = Field(
        default=None,
        description="Token expiration timestamp"
    )
    message: str | None = Field(
        default=None,
        description="Validation message or error"
    )


class AuthStatusResponse(BaseModel):
    """Schema for checking authentication status."""
    
    authenticated: bool = Field(
        ...,
        description="Whether user is authenticated"
    )
    user: AuthUserInfo | None = Field(
        default=None,
        description="User info if authenticated"
    )

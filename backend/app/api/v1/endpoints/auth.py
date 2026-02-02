"""
Authentication endpoints with token blacklist support.
"""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_token_pair,
    decode_token,
    TokenPayload
)
from app.api.deps import (
    get_current_user,
    get_current_active_user,
    get_token_payload,
    oauth2_scheme
)
from app.services.token_blacklist import (
    TokenBlacklistService,
    get_token_blacklist_service
)
from app.models.user import User


router = APIRouter()


# ============== Schemas ==============

class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds until access token expires


class LoginRequest(BaseModel):
    """Login request schema."""
    username: str
    password: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema."""
    refresh_token: str


class LogoutResponse(BaseModel):
    """Logout response schema."""
    message: str
    tokens_revoked: int = 1


class PasswordChangeRequest(BaseModel):
    """Password change request schema."""
    current_password: str
    new_password: str


class PasswordChangeResponse(BaseModel):
    """Password change response schema."""
    message: str
    tokens_invalidated: int


# ============== Endpoints ==============

@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
    blacklist_service: TokenBlacklistService = Depends(get_token_blacklist_service)
):
    """
    Authenticate user and return JWT tokens.
    
    - **username**: User's username or email
    - **password**: User's password
    """
    # Find user by username or email
    user = db.query(User).filter(
        (User.Username == form_data.username) | 
        (User.Email == form_data.username)
    ).first()
    
    if not user or not verify_password(form_data.password, user.PasswordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.IsActive:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Clean up old token references
    await blacklist_service.cleanup_expired_user_tokens(user.Id)
    
    # Create token pair
    tokens = create_token_pair(user.Id)
    
    # Update last login
    user.LastLoginAt = datetime.utcnow()
    db.commit()
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=int((tokens["access_token_expires"] - datetime.utcnow()).total_seconds())
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db),
    blacklist_service: TokenBlacklistService = Depends(get_token_blacklist_service)
):
    """
    Refresh access token using refresh token.
    
    The old refresh token is blacklisted and a new pair is issued.
    """
    # Decode refresh token
    payload = decode_token(request.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    if payload.type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # Check if refresh token is blacklisted
    if await blacklist_service.is_token_blacklisted(payload.jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked"
        )
    
    # Check user-level invalidation
    if await blacklist_service.is_user_token_invalidated(payload.user_id, payload.iat):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been invalidated. Please login again."
        )
    
    # Verify user still exists and is active
    user = db.query(User).filter(User.Id == payload.user_id).first()
    if not user or not user.IsActive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Blacklist the old refresh token (rotation)
    await blacklist_service.blacklist_token(
        token_jti=payload.jti,
        user_id=payload.user_id,
        expires_at=payload.exp,
        reason="token_refresh"
    )
    
    # Create new token pair
    tokens = create_token_pair(user.Id)
    
    return TokenResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        expires_in=int((tokens["access_token_expires"] - datetime.utcnow()).total_seconds())
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    token: str = Depends(oauth2_scheme),
    token_payload: TokenPayload = Depends(get_token_payload),
    blacklist_service: TokenBlacklistService = Depends(get_token_blacklist_service),
    refresh_token: Optional[str] = Body(None, embed=True)
):
    """
    Logout user by blacklisting their tokens.
    
    - Blacklists the current access token
    - Optionally blacklists the refresh token if provided
    """
    tokens_revoked = 0
    
    # Blacklist access token
    await blacklist_service.blacklist_token(
        token_jti=token_payload.jti,
        user_id=token_payload.user_id,
        expires_at=token_payload.exp,
        reason="logout"
    )
    tokens_revoked += 1
    
    # Blacklist refresh token if provided
    if refresh_token:
        refresh_payload = decode_token(refresh_token)
        if refresh_payload and refresh_payload.type == "refresh":
            await blacklist_service.blacklist_token(
                token_jti=refresh_payload.jti,
                user_id=refresh_payload.user_id,
                expires_at=refresh_payload.exp,
                reason="logout"
            )
            tokens_revoked += 1
    
    return LogoutResponse(
        message="Successfully logged out",
        tokens_revoked=tokens_revoked
    )


@router.post("/logout-all", response_model=LogoutResponse)
async def logout_all_devices(
    current_user: User = Depends(get_current_active_user),
    blacklist_service: TokenBlacklistService = Depends(get_token_blacklist_service)
):
    """
    Logout from all devices by invalidating all user tokens.
    
    This invalidates all existing tokens for the user.
    """
    count = await blacklist_service.blacklist_all_user_tokens(
        user_id=current_user.Id,
        reason="logout_all_devices"
    )
    
    return LogoutResponse(
        message="Successfully logged out from all devices",
        tokens_revoked=count
    )


@router.post("/change-password", response_model=PasswordChangeResponse)
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    blacklist_service: TokenBlacklistService = Depends(get_token_blacklist_service)
):
    """
    Change user password and invalidate all existing tokens.
    
    After password change, user must login again on all devices.
    """
    # Verify current password
    if not verify_password(request.current_password, current_user.PasswordHash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.PasswordHash = get_password_hash(request.new_password)
    current_user.UpdatedAt = datetime.utcnow()
    db.commit()
    
    # Invalidate all existing tokens
    count = await blacklist_service.blacklist_all_user_tokens(
        user_id=current_user.Id,
        reason="password_change"
    )
    
    return PasswordChangeResponse(
        message="Password changed successfully. Please login again.",
        tokens_invalidated=count
    )


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user information."""
    return {
        "id": current_user.Id,
        "username": current_user.Username,
        "email": current_user.Email,
        "first_name": current_user.FirstName,
        "last_name": current_user.LastName,
        "is_active": current_user.IsActive
    }

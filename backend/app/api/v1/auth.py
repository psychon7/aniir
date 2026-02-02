"""
Authentication API Router.

Provides REST API endpoints for:
- User login with credentials
- Token refresh using refresh token
- User logout
- Current user info retrieval (me)
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from app.models.user import User
from app.schemas.auth import LoginRequest, AuthResponse, AuthUserInfo as UserInfo
from app.dependencies import (
    get_auth_service,
    get_current_user,
    get_current_active_user,
    oauth2_scheme,
)
from app.services.auth_service import (
    AuthService,
    AuthServiceError,
    InvalidCredentialsError,
    UserNotFoundError,
    UserInactiveError,
    InvalidTokenError,
    TokenExpiredError,
    RefreshTokenInvalidError,
)
from app.services.token_blacklist_service import (
    TokenBlacklistService,
    get_token_blacklist_service,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


class RefreshRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str = Field(
        ...,
        alias="refreshToken",
        description="Valid refresh token",
        json_schema_extra={"example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
    )

    model_config = {
        "populate_by_name": True
    }


class LogoutRequest(BaseModel):
    """Optional payload for logout to revoke refresh tokens."""
    refresh_token: Optional[str] = Field(
        default=None,
        alias="refreshToken",
        description="Optional refresh token to revoke during logout",
    )

    model_config = {
        "populate_by_name": True
    }


class LogoutResponse(BaseModel):
    """Logout response."""
    success: bool = Field(default=True, description="Logout success status")
    message: str = Field(default="Successfully logged out", description="Status message")
    tokens_revoked: int = Field(default=1, description="Number of tokens revoked")


class ErrorDetail(BaseModel):
    """Error detail structure."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(default=None, description="Additional error details")


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = Field(default=False, description="Success status")
    error: ErrorDetail = Field(..., description="Error details")


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_auth_error(error: AuthServiceError) -> HTTPException:
    """Convert AuthServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(error, InvalidCredentialsError):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(error, (UserNotFoundError, InvalidTokenError, TokenExpiredError)):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(error, UserInactiveError):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(error, RefreshTokenInvalidError):
        status_code = status.HTTP_401_UNAUTHORIZED

    headers = None
    if status_code == status.HTTP_401_UNAUTHORIZED:
        headers = {"WWW-Authenticate": "Bearer"}

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error.code,
                "message": error.message,
                "details": error.details
            }
        },
        headers=headers
    )


# ==========================================================================
# Authentication Endpoints
# ==========================================================================

@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate user",
    description="""
    Authenticate a user with username and password.

    Returns:
    - Access token (short-lived, for API requests)
    - Refresh token (long-lived, for obtaining new access tokens)
    - User information
    - Token expiration time in seconds

    The access token should be included in the Authorization header
    as: `Authorization: Bearer <access_token>`
    """,
    responses={
        200: {
            "description": "Successful authentication",
            "model": AuthResponse
        },
        401: {
            "description": "Invalid credentials",
            "model": ErrorResponse
        },
        403: {
            "description": "User account is inactive",
            "model": ErrorResponse
        }
    }
)
async def login(
    credentials: LoginRequest,
    service: AuthService = Depends(get_auth_service)
):
    """
    Authenticate user and return JWT tokens.

    - **username**: User's login name
    - **password**: User's password
    """
    try:
        return await service.authenticate(
            username=credentials.username,
            password=credentials.password
        )
    except AuthServiceError as e:
        raise handle_auth_error(e)


@router.post(
    "/login/form",
    response_model=AuthResponse,
    summary="Authenticate user (OAuth2 form)",
    description="""
    Authenticate using OAuth2 password flow form data.

    This endpoint accepts form-encoded credentials for compatibility
    with OAuth2 clients and Swagger UI's authorize feature.
    """,
    responses={
        200: {
            "description": "Successful authentication",
            "model": AuthResponse
        },
        401: {
            "description": "Invalid credentials",
            "model": ErrorResponse
        },
        403: {
            "description": "User account is inactive",
            "model": ErrorResponse
        }
    }
)
async def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    service: AuthService = Depends(get_auth_service)
):
    """
    Authenticate user using OAuth2 password flow.

    This endpoint is used by Swagger UI's authorize feature.
    """
    try:
        return await service.authenticate(
            username=form_data.username,
            password=form_data.password
        )
    except AuthServiceError as e:
        raise handle_auth_error(e)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Refresh access token",
    description="""
    Obtain new access and refresh tokens using a valid refresh token.

    The refresh token is rotated on each use for security.
    After refreshing, the old refresh token becomes invalid.

    Use this endpoint when the access token expires to avoid
    requiring the user to re-authenticate.
    """,
    responses={
        200: {
            "description": "Tokens refreshed successfully",
            "model": AuthResponse
        },
        401: {
            "description": "Invalid or expired refresh token",
            "model": ErrorResponse
        },
        403: {
            "description": "User account is inactive",
            "model": ErrorResponse
        }
    }
)
async def refresh_token(
    request: RefreshRequest,
    service: AuthService = Depends(get_auth_service)
):
    """
    Refresh authentication tokens.

    - **refreshToken**: Valid refresh token from previous login/refresh
    """
    try:
        return await service.refresh_access_token(request.refresh_token)
    except AuthServiceError as e:
        raise handle_auth_error(e)


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="Log out user",
    description="""
    Log out the current user and revoke their tokens by blacklisting them in Redis.

    Clients may optionally provide the refresh token in the request body so it can be
    revoked alongside the access token.

    Tokens are blacklisted using their jti (JWT ID) for efficient lookup and proper TTL
    matching token expiry.
    """,
    responses={
        200: {
            "description": "Successfully logged out and tokens revoked",
            "model": LogoutResponse
        }
    }
)
async def logout(
    payload: Optional[LogoutRequest] = Body(default=None),
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
    blacklist: TokenBlacklistService = Depends(get_token_blacklist_service),
):
    """
    Log out the current authenticated user by blacklisting their tokens.

    If provided, the refresh token is revoked along with the access token.
    Uses jti-based blacklisting for efficiency and proper TTL management.
    """
    refresh_token = payload.refresh_token if payload else None
    tokens_revoked = 0

    try:
        access_payload = service.decode_token(token)
    except AuthServiceError as exc:
        raise handle_auth_error(exc)

    # Blacklist access token using jti (preferred) or full token hash
    if access_payload.jti:
        await blacklist.add_by_jti(
            access_payload.jti,
            access_payload.exp,
            token_type=access_payload.type,
            reason="logout",
        )
    else:
        await blacklist.add(
            token,
            access_payload.exp,
            token_type=access_payload.type,
            reason="logout",
        )
    tokens_revoked += 1

    # Blacklist refresh token if provided
    if refresh_token:
        try:
            refresh_payload = service.verify_refresh_token(refresh_token)
            if refresh_payload.jti:
                await blacklist.add_by_jti(
                    refresh_payload.jti,
                    refresh_payload.exp,
                    token_type=refresh_payload.type,
                    reason="logout",
                )
            else:
                await blacklist.add(
                    refresh_token,
                    refresh_payload.exp,
                    token_type=refresh_payload.type,
                    reason="logout",
                )
            tokens_revoked += 1
        except RefreshTokenInvalidError:
            # Ignore invalid refresh tokens; they may have already expired/rotated.
            pass

    return LogoutResponse(
        success=True,
        message="Tokens successfully revoked",
        tokens_revoked=tokens_revoked,
    )


@router.post(
    "/logout-all",
    response_model=LogoutResponse,
    summary="Log out from all devices",
    description="""
    Log out the current user from all devices by invalidating all their tokens.

    This sets a user-level invalidation timestamp in Redis. Any token issued
    before this timestamp will be rejected, effectively logging out the user
    from all devices.

    Use this for:
    - Password changes (force re-authentication everywhere)
    - Security concerns (suspected token compromise)
    - Account lockout scenarios
    """,
    responses={
        200: {
            "description": "Successfully logged out from all devices",
            "model": LogoutResponse
        },
        401: {
            "description": "Not authenticated",
            "model": ErrorResponse
        }
    }
)
async def logout_all(
    current_user: User = Depends(get_current_user),
    blacklist: TokenBlacklistService = Depends(get_token_blacklist_service),
):
    """
    Log out the current user from all devices.

    Invalidates all existing tokens by setting a user-level invalidation timestamp.
    """
    success = await blacklist.invalidate_all_user_tokens(
        user_id=current_user.usr_id,
        reason="logout_all_devices",
    )

    return LogoutResponse(
        success=success,
        message="Successfully logged out from all devices",
        tokens_revoked=0,  # We don't track individual token count for bulk invalidation
    )


@router.get(
    "/me",
    response_model=UserInfo,
    summary="Get current user info",
    description="""
    Get information about the currently authenticated user.

    Requires a valid access token in the Authorization header.
    """,
    responses={
        200: {
            "description": "Current user information",
            "model": UserInfo
        },
        401: {
            "description": "Not authenticated or token expired",
            "model": ErrorResponse
        },
        403: {
            "description": "User account is inactive",
            "model": ErrorResponse
        }
    }
)
async def get_me(
    current_user: User = Depends(get_current_active_user),
    service: AuthService = Depends(get_auth_service)
):
    """
    Get current authenticated user's information.

    Returns user details including role and society information.
    """
    return service._build_user_info(current_user)


@router.get(
    "/verify",
    response_model=dict,
    summary="Verify token validity",
    description="""
    Verify that the current access token is valid.

    This endpoint can be used by clients to check if their
    token is still valid without fetching full user info.
    """,
    responses={
        200: {
            "description": "Token is valid",
            "content": {
                "application/json": {
                    "example": {"valid": True, "userId": 1, "username": "john.doe"}
                }
            }
        },
        401: {
            "description": "Token is invalid or expired",
            "model": ErrorResponse
        }
    }
)
async def verify_token(
    current_user: User = Depends(get_current_user)
):
    """
    Verify the current access token is valid.

    Returns basic user identification if token is valid.
    """
    return {
        "valid": True,
        "userId": current_user.usr_id,
        "username": current_user.usr_login
    }

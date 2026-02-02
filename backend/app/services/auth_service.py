"""
Authentication Service Module.

Provides functionality for:
- User authentication (login/logout)
- JWT token generation and validation
- Password hashing and verification
- Token refresh mechanism
- Current user retrieval
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.models.user import User
from app.models.role import Role
from app.models.society import Society
from app.schemas.auth import AuthUserInfo as UserInfo, AuthResponse
from app.services.token_blacklist_service import (
    TokenBlacklistService,
    get_token_blacklist_service,
)


settings = get_settings()

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class TokenData(BaseModel):
    """JWT token payload data."""
    user_id: int
    username: str
    role_id: int
    society_id: int
    token_type: str = "access"


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: str  # user_id as string
    username: str
    role_id: int
    society_id: int
    type: str  # "access" or "refresh"
    exp: datetime
    iat: datetime
    jti: Optional[str] = None  # JWT ID for token revocation


# ==========================================================================
# Custom Exceptions
# ==========================================================================

class AuthServiceError(Exception):
    """Base exception for auth service."""
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class InvalidCredentialsError(AuthServiceError):
    """Raised when login credentials are invalid."""
    def __init__(self):
        super().__init__(
            code="INVALID_CREDENTIALS",
            message="Invalid username or password"
        )


class UserNotFoundError(AuthServiceError):
    """Raised when user is not found."""
    def __init__(self, identifier: str):
        super().__init__(
            code="USER_NOT_FOUND",
            message=f"User '{identifier}' not found",
            details={"identifier": identifier}
        )


class UserInactiveError(AuthServiceError):
    """Raised when user account is inactive."""
    def __init__(self, username: str):
        super().__init__(
            code="USER_INACTIVE",
            message=f"User account '{username}' is inactive",
            details={"username": username}
        )


class InvalidTokenError(AuthServiceError):
    """Raised when JWT token is invalid."""
    def __init__(self, reason: str = "Token is invalid or expired"):
        super().__init__(
            code="INVALID_TOKEN",
            message=reason
        )


class TokenExpiredError(AuthServiceError):
    """Raised when JWT token has expired."""
    def __init__(self):
        super().__init__(
            code="TOKEN_EXPIRED",
            message="Token has expired"
        )


class RefreshTokenInvalidError(AuthServiceError):
    """Raised when refresh token is invalid."""
    def __init__(self):
        super().__init__(
            code="REFRESH_TOKEN_INVALID",
            message="Refresh token is invalid or expired"
        )


# ==========================================================================
# Auth Service Class
# ==========================================================================

class AuthService:
    """
    Service class for authentication operations.

    Handles user authentication, JWT token management,
    and password operations.
    """

    def __init__(self, db: AsyncSession):
        """
        Initialize the auth service.

        Args:
            db: Database session for operations.
        """
        self.db = db
        self.secret_key = settings.SECRET_KEY
        self.algorithm = settings.ALGORITHM
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS
        self.token_blacklist: TokenBlacklistService = get_token_blacklist_service()

    # ==========================================================================
    # Password Utilities
    # ==========================================================================

    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash a password using bcrypt.

        Args:
            password: Plain text password.

        Returns:
            Hashed password string.
        """
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.

        Args:
            plain_password: Plain text password.
            hashed_password: Hashed password to compare against.

        Returns:
            True if password matches, False otherwise.
        """
        return pwd_context.verify(plain_password, hashed_password)

    # ==========================================================================
    # Token Generation
    # ==========================================================================

    def create_access_token(
        self,
        user: User,
        expires_delta: Optional[timedelta] = None
    ) -> Tuple[str, str, datetime]:
        """
        Create a JWT access token for a user.

        Args:
            user: User object to create token for.
            expires_delta: Optional custom expiration time.

        Returns:
            Tuple of (encoded JWT access token string, jti, expiration datetime).
        """
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                minutes=self.access_token_expire_minutes
            )

        jti = str(uuid.uuid4())
        to_encode = {
            "sub": str(user.usr_id),
            "username": user.usr_login,
            "role_id": user.rol_id,
            "society_id": user.soc_id,
            "type": "access",
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "jti": jti,
        }

        token = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return token, jti, expire

    def create_refresh_token(
        self,
        user: User,
        expires_delta: Optional[timedelta] = None
    ) -> Tuple[str, str, datetime]:
        """
        Create a JWT refresh token for a user.

        Args:
            user: User object to create token for.
            expires_delta: Optional custom expiration time.

        Returns:
            Tuple of (encoded JWT refresh token string, jti, expiration datetime).
        """
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(
                days=self.refresh_token_expire_days
            )

        jti = str(uuid.uuid4())
        to_encode = {
            "sub": str(user.usr_id),
            "username": user.usr_login,
            "role_id": user.rol_id,
            "society_id": user.soc_id,
            "type": "refresh",
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "jti": jti,
        }

        token = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return token, jti, expire

    def create_tokens(self, user: User) -> Tuple[str, str, int, str, datetime, str, datetime]:
        """
        Create both access and refresh tokens for a user.

        Args:
            user: User object to create tokens for.

        Returns:
            Tuple of (access_token, refresh_token, expires_in_seconds,
                     access_jti, access_exp, refresh_jti, refresh_exp).
        """
        access_token, access_jti, access_exp = self.create_access_token(user)
        refresh_token, refresh_jti, refresh_exp = self.create_refresh_token(user)
        expires_in = self.access_token_expire_minutes * 60

        return access_token, refresh_token, expires_in, access_jti, access_exp, refresh_jti, refresh_exp

    # ==========================================================================
    # Token Verification
    # ==========================================================================

    def decode_token(self, token: str) -> TokenPayload:
        """
        Decode and validate a JWT token.

        Args:
            token: JWT token string to decode.

        Returns:
            TokenPayload object with decoded data.

        Raises:
            InvalidTokenError: If token is invalid.
            TokenExpiredError: If token has expired.
        """
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm]
            )
            return TokenPayload(
                sub=payload["sub"],
                username=payload["username"],
                role_id=payload["role_id"],
                society_id=payload["society_id"],
                type=payload.get("type", "access"),
                exp=datetime.fromtimestamp(payload["exp"], tz=timezone.utc),
                iat=datetime.fromtimestamp(payload["iat"], tz=timezone.utc),
                jti=payload.get("jti"),
            )
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError()
        except JWTError as e:
            raise InvalidTokenError(f"Token decode error: {str(e)}")

    def verify_access_token(self, token: str) -> TokenPayload:
        """
        Verify an access token.

        Args:
            token: JWT access token string.

        Returns:
            TokenPayload object with decoded data.

        Raises:
            InvalidTokenError: If token is not an access token.
        """
        payload = self.decode_token(token)
        if payload.type != "access":
            raise InvalidTokenError("Invalid token type. Expected access token.")
        return payload

    def verify_refresh_token(self, token: str) -> TokenPayload:
        """
        Verify a refresh token.

        Args:
            token: JWT refresh token string.

        Returns:
            TokenPayload object with decoded data.

        Raises:
            RefreshTokenInvalidError: If token is not a valid refresh token.
        """
        try:
            payload = self.decode_token(token)
            if payload.type != "refresh":
                raise RefreshTokenInvalidError()
            return payload
        except (TokenExpiredError, InvalidTokenError):
            raise RefreshTokenInvalidError()

    # ==========================================================================
    # User Operations
    # ==========================================================================

    async def get_user_by_login(self, username: str) -> Optional[User]:
        """
        Get user by login/username.

        Args:
            username: User's login name.

        Returns:
            User object or None if not found.
        """
        query = (
            select(User)
            .options(
                selectinload(User.role),
                selectinload(User.society)
            )
            .where(User.usr_login == username)
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID with related data.

        Args:
            user_id: User's ID.

        Returns:
            User object or None if not found.
        """
        query = (
            select(User)
            .options(
                selectinload(User.role),
                selectinload(User.society)
            )
            .where(User.usr_id == user_id)
        )
        result = await self.db.execute(query)
        return result.scalars().first()

    def _build_user_info(self, user: User) -> UserInfo:
        """
        Build UserInfo object from User model.

        Args:
            user: User model with loaded relationships.

        Returns:
            UserInfo object for response.
        """
        is_admin = user.usr_super_right or (user.role and user.role.is_admin_role)

        return UserInfo(
            id=user.usr_id,
            username=user.usr_login,
            firstName=user.usr_firstname or "",
            lastName=user.usr_lastname or "",
            email=user.usr_email or "",
            roleId=user.rol_id,
            roleName=user.role.rol_name if user.role else "",
            societyId=user.soc_id,
            societyName=user.society.soc_name if user.society else "",
            isAdmin=is_admin,
            photoPath=user.usr_photo_path
        )

    # ==========================================================================
    # Authentication Operations
    # ==========================================================================

    async def authenticate(
        self,
        username: str,
        password: str
    ) -> AuthResponse:
        """
        Authenticate user with username and password.

        Args:
            username: User's login name.
            password: User's password.

        Returns:
            AuthResponse with tokens and user info.

        Raises:
            InvalidCredentialsError: If credentials are invalid.
            UserInactiveError: If user account is inactive.
        """
        # Get user by username
        user = await self.get_user_by_login(username)
        if not user:
            raise InvalidCredentialsError()

        # Verify password
        if not self.verify_password(password, user.usr_pwd):
            raise InvalidCredentialsError()

        # Check if user is active
        if not user.usr_is_actived:
            raise UserInactiveError(username)

        # Generate tokens (with jti for blacklist support)
        (access_token, refresh_token, expires_in,
         access_jti, access_exp, refresh_jti, refresh_exp) = self.create_tokens(user)

        # Build user info
        user_info = self._build_user_info(user)

        return AuthResponse(
            accessToken=access_token,
            refreshToken=refresh_token,
            expiresIn=expires_in,
            tokenType="Bearer",
            user=user_info
        )

    async def refresh_access_token(self, refresh_token: str) -> AuthResponse:
        """
        Refresh access token using refresh token.

        Args:
            refresh_token: Valid refresh token.

        Returns:
            AuthResponse with new tokens and user info.

        Raises:
            RefreshTokenInvalidError: If refresh token is invalid.
            UserNotFoundError: If user no longer exists.
            UserInactiveError: If user is now inactive.
        """
        # Verify refresh token
        payload = self.verify_refresh_token(refresh_token)

        # Check if token is blacklisted by jti (preferred) or full token hash
        if payload.jti:
            if await self.token_blacklist.is_blacklisted_by_jti(payload.jti):
                raise RefreshTokenInvalidError()
        elif await self.token_blacklist.is_blacklisted(refresh_token):
            raise RefreshTokenInvalidError()

        # Check if user's tokens were bulk-invalidated (logout-all)
        user_id = int(payload.sub)
        if await self.token_blacklist.is_user_invalidated(user_id, payload.iat):
            raise RefreshTokenInvalidError()

        # Get user
        user = await self.get_user_by_id(user_id)

        if not user:
            raise UserNotFoundError(str(user_id))

        # Check if user is still active
        if not user.usr_is_actived:
            raise UserInactiveError(user.usr_login)

        # Blacklist old refresh token (token rotation)
        if payload.jti:
            await self.token_blacklist.add_by_jti(
                payload.jti,
                payload.exp,
                token_type="refresh",
                reason="token_rotation",
            )
        else:
            await self.token_blacklist.add(
                refresh_token,
                payload.exp,
                token_type="refresh",
                reason="token_rotation",
            )

        # Generate new tokens
        (access_token, new_refresh_token, expires_in,
         access_jti, access_exp, refresh_jti, refresh_exp) = self.create_tokens(user)

        # Build user info
        user_info = self._build_user_info(user)

        return AuthResponse(
            accessToken=access_token,
            refreshToken=new_refresh_token,
            expiresIn=expires_in,
            tokenType="Bearer",
            user=user_info
        )

    async def get_current_user(self, token: str) -> User:
        """
        Get current user from access token.

        Args:
            token: JWT access token.

        Returns:
            User object.

        Raises:
            InvalidTokenError: If token is invalid.
            UserNotFoundError: If user not found.
            UserInactiveError: If user is inactive.
        """
        # Verify token
        payload = self.verify_access_token(token)

        # Check if token is blacklisted by jti (preferred) or full token hash
        if payload.jti:
            if await self.token_blacklist.is_blacklisted_by_jti(payload.jti):
                raise InvalidTokenError("Token has been revoked. Please login again.")
        elif await self.token_blacklist.is_blacklisted(token):
            raise InvalidTokenError("Token has been revoked. Please login again.")

        # Check if user's tokens were bulk-invalidated (logout-all)
        user_id = int(payload.sub)
        if await self.token_blacklist.is_user_invalidated(user_id, payload.iat):
            raise InvalidTokenError("Session has been invalidated. Please login again.")

        # Get user
        user = await self.get_user_by_id(user_id)

        if not user:
            raise UserNotFoundError(str(user_id))

        if not user.usr_is_actived:
            raise UserInactiveError(user.usr_login)

        return user

    async def get_current_user_info(self, token: str) -> UserInfo:
        """
        Get current user info from access token.

        Args:
            token: JWT access token.

        Returns:
            UserInfo object.
        """
        user = await self.get_current_user(token)
        return self._build_user_info(user)

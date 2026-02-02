"""
Utils Module - Reusable utilities for the application.

Contains:
- exceptions: Custom business logic exceptions
- rate_limiter: Token bucket rate limiting for API calls
- retry: Exponential backoff retry utilities
- jwt: JWT token creation and verification
- password: Reusable password hashing helpers
"""
from app.utils.rate_limiter import (
    RateLimiter,
    AdaptiveRateLimiter,
    RateLimitState,
    RateLimitContext,
)
from app.utils.retry import (
    RetryConfig,
    RetryContext,
    RetryStats,
    retry_async,
    with_retry,
    calculate_delay,
    is_retryable_http_status,
    create_http_retry_config,
)
from app.utils.exceptions import (
    BusinessError,
    ValidationError,
    EntityNotFoundError,
)
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

__all__ = [
    # Rate limiter
    "RateLimiter",
    "AdaptiveRateLimiter",
    "RateLimitState",
    "RateLimitContext",
    # Retry
    "RetryConfig",
    "RetryContext",
    "RetryStats",
    "retry_async",
    "with_retry",
    "calculate_delay",
    "is_retryable_http_status",
    "create_http_retry_config",
    # Exceptions
    "BusinessError",
    "ValidationError",
    "EntityNotFoundError",
    # JWT - Token types and models
    "TokenType",
    "TokenPayload",
    "TokenData",
    # JWT - Exceptions
    "JWTError",
    "TokenExpiredError",
    "InvalidTokenError",
    "TokenTypeError",
    # JWT - Token creation
    "create_access_token",
    "create_refresh_token",
    "create_token_pair",
    # JWT - Token verification
    "verify_token",
    "verify_access_token",
    "verify_refresh_token",
    "decode_token_unsafe",
    "get_token_subject",
    "get_token_payload",
    "is_token_valid",
    "get_token_expiry",
    "is_token_expired",
    # JWT - Token refresh
    "refresh_access_token",
    "refresh_token_pair",
    # Password utilities
    "hash_password",
    "verify_password",
    "needs_rehash",
]

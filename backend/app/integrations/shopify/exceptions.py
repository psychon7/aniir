"""
Shopify integration exception classes.
Provides structured error handling for Shopify API interactions.
"""
from typing import Optional, Dict, Any, List


class ShopifyError(Exception):
    """Base exception for all Shopify integration errors."""

    def __init__(
        self,
        message: str,
        code: str = "SHOPIFY_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for logging/API responses."""
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details,
        }


class ShopifyAuthenticationError(ShopifyError):
    """Authentication failed with Shopify API."""

    def __init__(
        self,
        message: str = "Authentication failed with Shopify API",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="SHOPIFY_AUTH_ERROR",
            details=details,
        )


class ShopifyRateLimitError(ShopifyError):
    """Rate limit exceeded when calling Shopify API."""

    def __init__(
        self,
        message: str = "Shopify API rate limit exceeded",
        retry_after: Optional[float] = None,
        cost_used: Optional[float] = None,
        cost_remaining: Optional[float] = None,
        throttle_status: Optional[Dict[str, Any]] = None,
    ):
        details = {
            "retry_after_seconds": retry_after,
            "cost_used": cost_used,
            "cost_remaining": cost_remaining,
            "throttle_status": throttle_status,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_RATE_LIMIT",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.retry_after = retry_after
        self.cost_used = cost_used
        self.cost_remaining = cost_remaining
        self.throttle_status = throttle_status


class ShopifyGraphQLError(ShopifyError):
    """GraphQL-specific error from Shopify API."""

    def __init__(
        self,
        message: str,
        errors: Optional[List[Dict[str, Any]]] = None,
        query: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None,
    ):
        details = {
            "graphql_errors": errors,
            "query": query[:500] if query else None,  # Truncate for logging
            "variables": variables,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_GRAPHQL_ERROR",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.errors = errors or []
        self.query = query
        self.variables = variables

    @classmethod
    def from_response(
        cls,
        errors: List[Dict[str, Any]],
        query: Optional[str] = None,
        variables: Optional[Dict[str, Any]] = None,
    ) -> "ShopifyGraphQLError":
        """Create exception from GraphQL error response."""
        if errors:
            # Extract first error message for main message
            first_error = errors[0]
            message = first_error.get("message", "Unknown GraphQL error")
        else:
            message = "Unknown GraphQL error"

        return cls(
            message=message,
            errors=errors,
            query=query,
            variables=variables,
        )


class ShopifyNetworkError(ShopifyError):
    """Network-related error when communicating with Shopify API."""

    def __init__(
        self,
        message: str = "Network error communicating with Shopify API",
        original_error: Optional[Exception] = None,
        request_url: Optional[str] = None,
    ):
        details = {
            "original_error": str(original_error) if original_error else None,
            "original_error_type": type(original_error).__name__ if original_error else None,
            "request_url": request_url,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_NETWORK_ERROR",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.original_error = original_error
        self.request_url = request_url


class ShopifyValidationError(ShopifyError):
    """Validation error for Shopify API requests."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        invalid_value: Optional[Any] = None,
    ):
        details = {
            "field": field,
            "invalid_value": invalid_value,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_VALIDATION_ERROR",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.field = field
        self.invalid_value = invalid_value


class ShopifyResourceNotFoundError(ShopifyError):
    """Requested resource not found in Shopify."""

    def __init__(
        self,
        resource_type: str,
        resource_id: str,
    ):
        message = f"Shopify {resource_type} with ID {resource_id} not found"
        super().__init__(
            message=message,
            code="SHOPIFY_NOT_FOUND",
            details={
                "resource_type": resource_type,
                "resource_id": resource_id,
            },
        )
        self.resource_type = resource_type
        self.resource_id = resource_id


class ShopifyConfigurationError(ShopifyError):
    """Configuration error for Shopify integration."""

    def __init__(
        self,
        message: str,
        missing_config: Optional[List[str]] = None,
    ):
        details = {
            "missing_config": missing_config,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_CONFIG_ERROR",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.missing_config = missing_config


class ShopifyWebhookError(ShopifyError):
    """Error related to Shopify webhook processing."""

    def __init__(
        self,
        message: str,
        webhook_topic: Optional[str] = None,
        webhook_id: Optional[str] = None,
    ):
        details = {
            "webhook_topic": webhook_topic,
            "webhook_id": webhook_id,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_WEBHOOK_ERROR",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.webhook_topic = webhook_topic
        self.webhook_id = webhook_id


class ShopifyHMACVerificationError(ShopifyError):
    """HMAC signature verification failed for OAuth callback or webhook."""

    def __init__(
        self,
        message: str = "HMAC signature verification failed",
        verification_type: Optional[str] = None,
        shop_domain: Optional[str] = None,
    ):
        details = {
            "verification_type": verification_type,
            "shop_domain": shop_domain,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_HMAC_ERROR",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.verification_type = verification_type
        self.shop_domain = shop_domain


class ShopifyOAuthError(ShopifyError):
    """Error during Shopify OAuth flow."""

    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        error_description: Optional[str] = None,
        shop_domain: Optional[str] = None,
    ):
        details = {
            "oauth_error_code": error_code,
            "oauth_error_description": error_description,
            "shop_domain": shop_domain,
        }
        super().__init__(
            message=message,
            code="SHOPIFY_OAUTH_ERROR",
            details={k: v for k, v in details.items() if v is not None},
        )
        self.error_code = error_code
        self.error_description = error_description
        self.shop_domain = shop_domain

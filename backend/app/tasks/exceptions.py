"""
Task-specific exceptions.

Provides custom exceptions for Celery task error handling
with structured error details and retry logic support.
"""
from typing import Optional, Dict, Any, List


class TaskError(Exception):
    """Base exception for task errors."""

    def __init__(
        self,
        message: str,
        code: str = "TASK_ERROR",
        details: Optional[Dict[str, Any]] = None,
        retryable: bool = True,
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        self.retryable = retryable
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for logging/storage."""
        return {
            "error": self.code,
            "message": self.message,
            "details": self.details,
            "retryable": self.retryable,
        }


# =============================================================================
# Shopify Task Exceptions
# =============================================================================


class ShopifyTaskError(TaskError):
    """Base exception for Shopify task errors."""

    def __init__(
        self,
        message: str,
        code: str = "SHOPIFY_TASK_ERROR",
        details: Optional[Dict[str, Any]] = None,
        retryable: bool = True,
    ):
        super().__init__(message, code, details, retryable)


class ShopifyConnectionError(ShopifyTaskError):
    """Raised when unable to connect to Shopify API."""

    def __init__(self, message: str = "Failed to connect to Shopify API", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message,
            code="SHOPIFY_CONNECTION_ERROR",
            details=details,
            retryable=True,
        )


class ShopifyAuthenticationError(ShopifyTaskError):
    """Raised when Shopify authentication fails."""

    def __init__(self, message: str = "Shopify authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message,
            code="SHOPIFY_AUTH_ERROR",
            details=details,
            retryable=False,  # Auth errors shouldn't be retried
        )


class ShopifyRateLimitError(ShopifyTaskError):
    """Raised when Shopify rate limit is exceeded."""

    def __init__(
        self,
        message: str = "Shopify rate limit exceeded",
        retry_after: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if retry_after:
            details["retry_after_seconds"] = retry_after
        super().__init__(
            message,
            code="SHOPIFY_RATE_LIMIT",
            details=details,
            retryable=True,
        )
        self.retry_after = retry_after


class ShopifyValidationError(ShopifyTaskError):
    """Raised when data validation fails."""

    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        details = details or {}
        if field:
            details["field"] = field
        super().__init__(
            message,
            code="SHOPIFY_VALIDATION_ERROR",
            details=details,
            retryable=False,
        )


class ShopifyResourceNotFoundError(ShopifyTaskError):
    """Raised when a Shopify resource is not found."""

    def __init__(
        self,
        resource_type: str,
        resource_id: str,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["resource_type"] = resource_type
        details["resource_id"] = resource_id
        super().__init__(
            f"Shopify {resource_type} not found: {resource_id}",
            code="SHOPIFY_RESOURCE_NOT_FOUND",
            details=details,
            retryable=False,
        )


class ShopifySyncError(ShopifyTaskError):
    """Raised when synchronization fails."""

    def __init__(
        self,
        sync_type: str,
        message: str,
        partial_success: bool = False,
        processed_count: int = 0,
        failed_count: int = 0,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["sync_type"] = sync_type
        details["partial_success"] = partial_success
        details["processed_count"] = processed_count
        details["failed_count"] = failed_count
        super().__init__(
            message,
            code="SHOPIFY_SYNC_ERROR",
            details=details,
            retryable=partial_success,  # Retry if partial success
        )
        self.partial_success = partial_success
        self.processed_count = processed_count
        self.failed_count = failed_count


class ShopifyWebhookError(ShopifyTaskError):
    """Raised when webhook processing fails."""

    def __init__(
        self,
        webhook_topic: str,
        message: str,
        shopify_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["webhook_topic"] = webhook_topic
        if shopify_id:
            details["shopify_id"] = shopify_id
        super().__init__(
            message,
            code="SHOPIFY_WEBHOOK_ERROR",
            details=details,
            retryable=True,
        )


class ShopifyDataMappingError(ShopifyTaskError):
    """Raised when data mapping between Shopify and ERP fails."""

    def __init__(
        self,
        source_type: str,
        target_type: str,
        message: str,
        source_data: Optional[Dict[str, Any]] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["source_type"] = source_type
        details["target_type"] = target_type
        if source_data:
            details["source_data_keys"] = list(source_data.keys())
        super().__init__(
            message,
            code="SHOPIFY_DATA_MAPPING_ERROR",
            details=details,
            retryable=False,
        )


class ShopifyInventoryError(ShopifyTaskError):
    """Raised when inventory operations fail."""

    def __init__(
        self,
        operation: str,
        product_id: Optional[str] = None,
        variant_id: Optional[str] = None,
        location_id: Optional[str] = None,
        message: str = "Inventory operation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["operation"] = operation
        if product_id:
            details["product_id"] = product_id
        if variant_id:
            details["variant_id"] = variant_id
        if location_id:
            details["location_id"] = location_id
        super().__init__(
            message,
            code="SHOPIFY_INVENTORY_ERROR",
            details=details,
            retryable=True,
        )


class ShopifyOrderError(ShopifyTaskError):
    """Raised when order operations fail."""

    def __init__(
        self,
        operation: str,
        order_id: Optional[str] = None,
        order_number: Optional[str] = None,
        message: str = "Order operation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        details["operation"] = operation
        if order_id:
            details["order_id"] = order_id
        if order_number:
            details["order_number"] = order_number
        super().__init__(
            message,
            code="SHOPIFY_ORDER_ERROR",
            details=details,
            retryable=True,
        )


class ShopifyConfigurationError(ShopifyTaskError):
    """Raised when Shopify configuration is invalid or missing."""

    def __init__(
        self,
        message: str = "Shopify configuration error",
        missing_settings: Optional[list] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if missing_settings:
            details["missing_settings"] = missing_settings
        super().__init__(
            message,
            code="SHOPIFY_CONFIG_ERROR",
            details=details,
            retryable=False,
        )


# =============================================================================
# Email Task Exceptions
# =============================================================================


class EmailTaskError(TaskError):
    """Base exception for email task errors."""

    def __init__(
        self,
        message: str,
        code: str = "EMAIL_TASK_ERROR",
        details: Optional[Dict[str, Any]] = None,
        retryable: bool = True,
    ):
        super().__init__(message, code, details, retryable)


class EmailConnectionError(EmailTaskError):
    """Raised when unable to connect to SMTP server."""

    def __init__(
        self,
        message: str = "Failed to connect to SMTP server",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message,
            code="EMAIL_CONNECTION_ERROR",
            details=details,
            retryable=True,
        )


class EmailConfigurationError(EmailTaskError):
    """Raised when email configuration is invalid or missing."""

    def __init__(
        self,
        message: str = "Email configuration error",
        missing_settings: Optional[list] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if missing_settings:
            details["missing_settings"] = missing_settings
        super().__init__(
            message,
            code="EMAIL_CONFIG_ERROR",
            details=details,
            retryable=False,
        )


class EmailDeliveryError(EmailTaskError):
    """Raised when email delivery fails."""

    def __init__(
        self,
        message: str = "Email delivery failed",
        recipients: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if recipients:
            details["recipients"] = recipients
        super().__init__(
            message,
            code="EMAIL_DELIVERY_ERROR",
            details=details,
            retryable=True,
        )


class EmailTemplateError(EmailTaskError):
    """Raised when email template rendering fails."""

    def __init__(
        self,
        message: str = "Email template error",
        template_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        details = details or {}
        if template_name:
            details["template_name"] = template_name
        super().__init__(
            message,
            code="EMAIL_TEMPLATE_ERROR",
            details=details,
            retryable=False,
        )

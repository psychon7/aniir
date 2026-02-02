"""
HMAC verification utilities for Shopify OAuth callbacks and webhooks.

Provides secure HMAC-SHA256 signature verification for:
- OAuth callback requests (query parameter verification)
- Webhook payloads (request body verification)

Shopify signs requests using HMAC-SHA256 with the app's API secret.
"""
import hashlib
import hmac
import logging
import time
from typing import Optional, Dict, Any
from urllib.parse import urlencode, parse_qs
from dataclasses import dataclass
from enum import Enum

from app.config import get_settings
from app.integrations.shopify.exceptions import (
    ShopifyHMACVerificationError,
    ShopifyConfigurationError,
)

logger = logging.getLogger(__name__)


class VerificationType(str, Enum):
    """Type of HMAC verification to perform."""
    OAUTH_CALLBACK = "oauth_callback"
    WEBHOOK = "webhook"


@dataclass
class VerificationResult:
    """Result of HMAC verification."""
    is_valid: bool
    verification_type: VerificationType
    shop_domain: Optional[str] = None
    timestamp: Optional[int] = None
    error_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/API responses."""
        return {
            "is_valid": self.is_valid,
            "verification_type": self.verification_type.value,
            "shop_domain": self.shop_domain,
            "timestamp": self.timestamp,
            "error_message": self.error_message,
        }


def get_api_secret() -> str:
    """
    Get the Shopify API secret from settings.

    Returns:
        str: The API secret for HMAC verification.

    Raises:
        ShopifyConfigurationError: If API secret is not configured.
    """
    settings = get_settings()
    api_secret = settings.SHOPIFY_API_SECRET

    if not api_secret:
        raise ShopifyConfigurationError(
            message="SHOPIFY_API_SECRET is required for HMAC verification",
            missing_config=["SHOPIFY_API_SECRET"],
        )

    return api_secret


def get_webhook_secret() -> str:
    """
    Get the Shopify webhook secret from settings.

    For webhooks, Shopify can use either:
    - The API secret (for app webhooks)
    - A dedicated webhook secret (for custom apps)

    Returns:
        str: The webhook secret for HMAC verification.

    Raises:
        ShopifyConfigurationError: If webhook secret is not configured.
    """
    settings = get_settings()
    # Prefer dedicated webhook secret, fall back to API secret
    webhook_secret = settings.SHOPIFY_WEBHOOK_SECRET or settings.SHOPIFY_API_SECRET

    if not webhook_secret:
        raise ShopifyConfigurationError(
            message="SHOPIFY_WEBHOOK_SECRET or SHOPIFY_API_SECRET is required for webhook verification",
            missing_config=["SHOPIFY_WEBHOOK_SECRET", "SHOPIFY_API_SECRET"],
        )

    return webhook_secret


def compute_hmac_sha256(data: bytes, secret: str) -> str:
    """
    Compute HMAC-SHA256 signature.

    Args:
        data: The data to sign.
        secret: The secret key.

    Returns:
        str: The hex-encoded HMAC signature.
    """
    return hmac.new(
        secret.encode("utf-8"),
        data,
        hashlib.sha256,
    ).hexdigest()


def verify_hmac_signature(
    computed_signature: str,
    provided_signature: str,
) -> bool:
    """
    Securely compare two HMAC signatures using constant-time comparison.

    Args:
        computed_signature: The locally computed signature.
        provided_signature: The signature provided in the request.

    Returns:
        bool: True if signatures match, False otherwise.
    """
    return hmac.compare_digest(
        computed_signature.lower(),
        provided_signature.lower(),
    )


def verify_oauth_callback_hmac(
    query_params: Dict[str, Any],
    api_secret: Optional[str] = None,
    max_timestamp_age_seconds: int = 300,
) -> VerificationResult:
    """
    Verify HMAC signature for Shopify OAuth callback.

    Shopify OAuth callbacks include an 'hmac' query parameter containing
    an HMAC-SHA256 signature of all other query parameters (excluding 'hmac'
    and 'signature').

    The verification process:
    1. Extract the 'hmac' parameter from the query string
    2. Remove 'hmac' and 'signature' from params
    3. Sort remaining params alphabetically by key
    4. Create query string with sorted params
    5. Compute HMAC-SHA256 of query string using API secret
    6. Compare computed signature with provided 'hmac'

    Args:
        query_params: Dictionary of query parameters from the callback URL.
        api_secret: Optional API secret override (uses settings if not provided).
        max_timestamp_age_seconds: Maximum age of the timestamp before considering
            the request stale (for replay attack prevention).

    Returns:
        VerificationResult: Result object with verification status.

    Raises:
        ShopifyHMACVerificationError: If verification fails critically.
        ShopifyConfigurationError: If API secret is not configured.
    """
    # Get API secret
    secret = api_secret or get_api_secret()

    # Extract HMAC from query params
    provided_hmac = query_params.get("hmac")
    if not provided_hmac:
        return VerificationResult(
            is_valid=False,
            verification_type=VerificationType.OAUTH_CALLBACK,
            error_message="Missing 'hmac' parameter in OAuth callback",
        )

    # Handle list values (from parse_qs)
    if isinstance(provided_hmac, list):
        provided_hmac = provided_hmac[0]

    # Extract shop domain
    shop_domain = query_params.get("shop")
    if isinstance(shop_domain, list):
        shop_domain = shop_domain[0]

    # Validate timestamp for replay attack prevention
    timestamp_str = query_params.get("timestamp")
    if timestamp_str:
        if isinstance(timestamp_str, list):
            timestamp_str = timestamp_str[0]
        try:
            timestamp = int(timestamp_str)
            current_time = int(time.time())
            if abs(current_time - timestamp) > max_timestamp_age_seconds:
                return VerificationResult(
                    is_valid=False,
                    verification_type=VerificationType.OAUTH_CALLBACK,
                    shop_domain=shop_domain,
                    timestamp=timestamp,
                    error_message=f"Timestamp is stale (older than {max_timestamp_age_seconds} seconds)",
                )
        except (ValueError, TypeError):
            logger.warning("Invalid timestamp format in OAuth callback")

    # Build params for HMAC computation (exclude 'hmac' and 'signature')
    params_for_hmac = {}
    for key, value in query_params.items():
        if key in ("hmac", "signature"):
            continue
        # Handle list values
        if isinstance(value, list):
            params_for_hmac[key] = value[0]
        else:
            params_for_hmac[key] = value

    # Sort params alphabetically and create query string
    sorted_params = sorted(params_for_hmac.items())
    query_string = urlencode(sorted_params)

    # Compute HMAC
    computed_hmac = compute_hmac_sha256(
        query_string.encode("utf-8"),
        secret,
    )

    # Verify signature
    is_valid = verify_hmac_signature(computed_hmac, provided_hmac)

    if not is_valid:
        logger.warning(
            "HMAC verification failed for OAuth callback",
            extra={
                "shop_domain": shop_domain,
                "verification_type": "oauth_callback",
            },
        )
        return VerificationResult(
            is_valid=False,
            verification_type=VerificationType.OAUTH_CALLBACK,
            shop_domain=shop_domain,
            error_message="HMAC signature verification failed",
        )

    logger.info(
        "HMAC verification successful for OAuth callback",
        extra={
            "shop_domain": shop_domain,
            "verification_type": "oauth_callback",
        },
    )

    return VerificationResult(
        is_valid=True,
        verification_type=VerificationType.OAUTH_CALLBACK,
        shop_domain=shop_domain,
        timestamp=int(timestamp_str) if timestamp_str else None,
    )


def verify_webhook_hmac(
    payload: bytes,
    provided_signature: str,
    webhook_secret: Optional[str] = None,
) -> VerificationResult:
    """
    Verify HMAC signature for Shopify webhook.

    Shopify webhook requests include an 'X-Shopify-Hmac-SHA256' header
    containing a base64-encoded HMAC-SHA256 signature of the request body.

    The verification process:
    1. Get the raw request body (as bytes)
    2. Compute HMAC-SHA256 of the body using webhook secret
    3. Base64 encode the computed signature
    4. Compare with the provided header value

    Args:
        payload: Raw request body bytes.
        provided_signature: The 'X-Shopify-Hmac-SHA256' header value (base64 encoded).
        webhook_secret: Optional webhook secret override (uses settings if not provided).

    Returns:
        VerificationResult: Result object with verification status.

    Raises:
        ShopifyConfigurationError: If webhook secret is not configured.
    """
    import base64

    # Get webhook secret
    secret = webhook_secret or get_webhook_secret()

    if not provided_signature:
        return VerificationResult(
            is_valid=False,
            verification_type=VerificationType.WEBHOOK,
            error_message="Missing 'X-Shopify-Hmac-SHA256' header",
        )

    # Compute HMAC of the payload
    computed_hmac = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256,
    ).digest()

    # Base64 encode the computed signature
    computed_signature = base64.b64encode(computed_hmac).decode("utf-8")

    # Verify signature using constant-time comparison
    is_valid = hmac.compare_digest(computed_signature, provided_signature)

    if not is_valid:
        logger.warning(
            "HMAC verification failed for webhook",
            extra={"verification_type": "webhook"},
        )
        return VerificationResult(
            is_valid=False,
            verification_type=VerificationType.WEBHOOK,
            error_message="Webhook HMAC signature verification failed",
        )

    logger.info(
        "HMAC verification successful for webhook",
        extra={"verification_type": "webhook"},
    )

    return VerificationResult(
        is_valid=True,
        verification_type=VerificationType.WEBHOOK,
    )


def validate_shop_domain(shop_domain: str) -> bool:
    """
    Validate that a shop domain is a legitimate Shopify store domain.

    Shopify store domains follow the pattern: {store-name}.myshopify.com

    Args:
        shop_domain: The shop domain to validate.

    Returns:
        bool: True if the domain is valid, False otherwise.
    """
    import re

    if not shop_domain:
        return False

    # Shopify shop domains must end with .myshopify.com
    # Pattern: alphanumeric and hyphens, followed by .myshopify.com
    pattern = r"^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$"

    return bool(re.match(pattern, shop_domain))


def verify_oauth_callback_request(
    query_params: Dict[str, Any],
    validate_shop: bool = True,
) -> VerificationResult:
    """
    Complete verification of an OAuth callback request.

    Performs:
    1. HMAC signature verification
    2. Shop domain validation (optional)
    3. Timestamp freshness check

    Args:
        query_params: Query parameters from the callback request.
        validate_shop: Whether to validate the shop domain format.

    Returns:
        VerificationResult: Comprehensive verification result.

    Raises:
        ShopifyHMACVerificationError: If verification fails critically.
    """
    # First, verify HMAC
    result = verify_oauth_callback_hmac(query_params)

    if not result.is_valid:
        raise ShopifyHMACVerificationError(
            message=result.error_message or "HMAC verification failed",
            verification_type=VerificationType.OAUTH_CALLBACK.value,
            shop_domain=result.shop_domain,
        )

    # Validate shop domain if requested
    if validate_shop and result.shop_domain:
        if not validate_shop_domain(result.shop_domain):
            raise ShopifyHMACVerificationError(
                message=f"Invalid shop domain format: {result.shop_domain}",
                verification_type=VerificationType.OAUTH_CALLBACK.value,
                shop_domain=result.shop_domain,
            )

    return result


def verify_webhook_request(
    payload: bytes,
    hmac_header: str,
    shop_domain_header: Optional[str] = None,
    validate_shop: bool = True,
) -> VerificationResult:
    """
    Complete verification of a webhook request.

    Performs:
    1. HMAC signature verification
    2. Shop domain validation (optional)

    Args:
        payload: Raw request body bytes.
        hmac_header: The 'X-Shopify-Hmac-SHA256' header value.
        shop_domain_header: Optional 'X-Shopify-Shop-Domain' header value.
        validate_shop: Whether to validate the shop domain format.

    Returns:
        VerificationResult: Comprehensive verification result.

    Raises:
        ShopifyHMACVerificationError: If verification fails critically.
    """
    # Verify HMAC
    result = verify_webhook_hmac(payload, hmac_header)

    if not result.is_valid:
        raise ShopifyHMACVerificationError(
            message=result.error_message or "Webhook HMAC verification failed",
            verification_type=VerificationType.WEBHOOK.value,
        )

    # Update result with shop domain from header
    if shop_domain_header:
        result.shop_domain = shop_domain_header

        # Validate shop domain if requested
        if validate_shop and not validate_shop_domain(shop_domain_header):
            raise ShopifyHMACVerificationError(
                message=f"Invalid shop domain format: {shop_domain_header}",
                verification_type=VerificationType.WEBHOOK.value,
                shop_domain=shop_domain_header,
            )

    return result

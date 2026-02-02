"""
Shopify OAuth Service.

Handles Shopify OAuth 2.0 flow for connecting stores:
- Generating authorization URLs
- Exchanging authorization codes for access tokens
- Validating HMAC signatures
- Managing store connections
"""
import hashlib
import hmac
import secrets
import urllib.parse
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import logging

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError

from app.config import get_settings, Settings
from app.integrations.shopify.exceptions import (
    ShopifyError,
    ShopifyAuthenticationError,
    ShopifyConfigurationError,
    ShopifyValidationError,
)
from app.models.integrations.shopify import ShopifyIntegration

logger = logging.getLogger(__name__)

# Default OAuth scopes for the ERP integration
DEFAULT_SCOPES = [
    "read_products",
    "write_products",
    "read_orders",
    "write_orders",
    "read_inventory",
    "write_inventory",
    "read_customers",
    "read_fulfillments",
    "write_fulfillments",
]


class ShopifyOAuthError(ShopifyError):
    """OAuth-specific error for Shopify integration."""

    def __init__(
        self,
        message: str,
        code: str = "SHOPIFY_OAUTH_ERROR",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message=message, code=code, details=details)


class InvalidStateError(ShopifyOAuthError):
    """Invalid or expired OAuth state parameter."""

    def __init__(self, message: str = "Invalid or expired OAuth state"):
        super().__init__(message=message, code="INVALID_STATE")


class InvalidHMACError(ShopifyOAuthError):
    """HMAC signature verification failed."""

    def __init__(self, message: str = "HMAC signature verification failed"):
        super().__init__(message=message, code="INVALID_HMAC")


class TokenExchangeError(ShopifyOAuthError):
    """Failed to exchange authorization code for access token."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="TOKEN_EXCHANGE_FAILED", details=details)


class StoreNotFoundError(ShopifyOAuthError):
    """Store not found in database."""

    def __init__(self, shop_domain: str):
        super().__init__(
            message=f"Store '{shop_domain}' not found",
            code="STORE_NOT_FOUND",
            details={"shop_domain": shop_domain},
        )


class StoreAlreadyConnectedError(ShopifyOAuthError):
    """Store is already connected."""

    def __init__(self, shop_domain: str):
        super().__init__(
            message=f"Store '{shop_domain}' is already connected",
            code="STORE_ALREADY_CONNECTED",
            details={"shop_domain": shop_domain},
        )


class ShopifyOAuthService:
    """Service for handling Shopify OAuth 2.0 flow."""

    def __init__(self, db: AsyncSession, settings: Optional[Settings] = None):
        """
        Initialize the OAuth service.

        Args:
            db: Database session for store management
            settings: Application settings (uses default if not provided)
        """
        self.db = db
        self.settings = settings or get_settings()
        self._validate_config()

        # In-memory state storage (consider Redis for production)
        # Key: state token, Value: {shop_domain, created_at, redirect_uri}
        self._oauth_states: Dict[str, Dict[str, Any]] = {}

    def _validate_config(self) -> None:
        """Validate required Shopify configuration."""
        missing = []
        if not self.settings.SHOPIFY_API_KEY:
            missing.append("SHOPIFY_API_KEY")
        if not self.settings.SHOPIFY_API_SECRET:
            missing.append("SHOPIFY_API_SECRET")

        if missing:
            raise ShopifyConfigurationError(
                message="Missing required Shopify OAuth configuration",
                missing_config=missing,
            )

    def _normalize_shop_domain(self, shop_domain: str) -> str:
        """
        Normalize shop domain to standard format.

        Args:
            shop_domain: Raw shop domain input

        Returns:
            Normalized domain (e.g., 'mystore.myshopify.com')
        """
        # Remove protocol if present
        domain = shop_domain.lower().strip()
        if domain.startswith("https://"):
            domain = domain[8:]
        elif domain.startswith("http://"):
            domain = domain[7:]

        # Remove trailing slash
        domain = domain.rstrip("/")

        # Add .myshopify.com if not present
        if not domain.endswith(".myshopify.com"):
            domain = f"{domain}.myshopify.com"

        return domain

    def _validate_shop_domain(self, shop_domain: str) -> bool:
        """
        Validate that shop domain is a valid Shopify domain.

        Args:
            shop_domain: Shop domain to validate

        Returns:
            True if valid, raises exception if invalid
        """
        normalized = self._normalize_shop_domain(shop_domain)

        # Basic validation - must be a myshopify.com domain
        if not normalized.endswith(".myshopify.com"):
            raise ShopifyValidationError(
                message="Invalid Shopify domain",
                field="shop_domain",
                invalid_value=shop_domain,
            )

        # Extract shop name and validate
        shop_name = normalized.replace(".myshopify.com", "")
        if not shop_name or len(shop_name) < 1 or len(shop_name) > 255:
            raise ShopifyValidationError(
                message="Invalid shop name in domain",
                field="shop_domain",
                invalid_value=shop_domain,
            )

        # Check for valid characters (alphanumeric and hyphens)
        import re
        if not re.match(r"^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$", shop_name):
            raise ShopifyValidationError(
                message="Invalid characters in shop domain",
                field="shop_domain",
                invalid_value=shop_domain,
            )

        return True

    def generate_state_token(self) -> str:
        """Generate a cryptographically secure state token."""
        return secrets.token_urlsafe(32)

    def _store_oauth_state(
        self,
        state: str,
        shop_domain: str,
        redirect_uri: Optional[str] = None,
    ) -> None:
        """
        Store OAuth state for later validation.

        Args:
            state: State token
            shop_domain: Shop domain for this OAuth flow
            redirect_uri: Custom redirect URI (if any)
        """
        self._oauth_states[state] = {
            "shop_domain": shop_domain,
            "redirect_uri": redirect_uri,
            "created_at": datetime.now(timezone.utc),
        }
        logger.debug(f"Stored OAuth state for shop: {shop_domain}")

    def _validate_oauth_state(
        self,
        state: str,
        shop_domain: str,
        max_age_seconds: int = 600,
    ) -> Dict[str, Any]:
        """
        Validate OAuth state parameter.

        Args:
            state: State token from callback
            shop_domain: Shop domain from callback
            max_age_seconds: Maximum age of state in seconds (default 10 minutes)

        Returns:
            State data if valid

        Raises:
            InvalidStateError: If state is invalid or expired
        """
        state_data = self._oauth_states.get(state)

        if not state_data:
            logger.warning(f"OAuth state not found: {state[:16]}...")
            raise InvalidStateError("OAuth state not found or expired")

        # Validate shop domain matches
        if state_data["shop_domain"] != self._normalize_shop_domain(shop_domain):
            logger.warning(
                f"Shop domain mismatch: expected {state_data['shop_domain']}, got {shop_domain}"
            )
            raise InvalidStateError("Shop domain mismatch in OAuth state")

        # Check age
        age = (datetime.now(timezone.utc) - state_data["created_at"]).total_seconds()
        if age > max_age_seconds:
            logger.warning(f"OAuth state expired: {age:.0f}s > {max_age_seconds}s")
            del self._oauth_states[state]
            raise InvalidStateError("OAuth state has expired")

        return state_data

    def _consume_oauth_state(self, state: str) -> Dict[str, Any]:
        """
        Consume (validate and remove) OAuth state.

        Args:
            state: State token to consume

        Returns:
            State data
        """
        state_data = self._oauth_states.pop(state, None)
        if not state_data:
            raise InvalidStateError("OAuth state not found or already used")
        return state_data

    def verify_hmac(
        self,
        params: Dict[str, str],
        hmac_header: str,
    ) -> bool:
        """
        Verify Shopify HMAC signature.

        Args:
            params: Query parameters from callback (excluding 'hmac')
            hmac_header: HMAC value from Shopify

        Returns:
            True if valid

        Raises:
            InvalidHMACError: If verification fails
        """
        if not self.settings.SHOPIFY_API_SECRET:
            raise ShopifyConfigurationError(
                message="SHOPIFY_API_SECRET not configured",
                missing_config=["SHOPIFY_API_SECRET"],
            )

        # Sort and encode parameters
        sorted_params = sorted(params.items())
        encoded_params = urllib.parse.urlencode(sorted_params)

        # Calculate HMAC
        digest = hmac.new(
            self.settings.SHOPIFY_API_SECRET.encode("utf-8"),
            encoded_params.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(digest, hmac_header):
            logger.warning("HMAC verification failed for OAuth callback")
            raise InvalidHMACError()

        return True

    def generate_authorization_url(
        self,
        shop_domain: str,
        redirect_uri: Optional[str] = None,
        scopes: Optional[List[str]] = None,
    ) -> Dict[str, str]:
        """
        Generate Shopify OAuth authorization URL.

        Args:
            shop_domain: Shopify store domain
            redirect_uri: Callback URL after authorization
            scopes: OAuth scopes to request

        Returns:
            Dict with 'authorization_url' and 'state'
        """
        self._validate_shop_domain(shop_domain)
        normalized_domain = self._normalize_shop_domain(shop_domain)

        # Generate state token
        state = self.generate_state_token()

        # Use provided scopes or defaults
        requested_scopes = scopes or DEFAULT_SCOPES
        scope_string = ",".join(requested_scopes)

        # Build authorization URL
        params = {
            "client_id": self.settings.SHOPIFY_API_KEY,
            "scope": scope_string,
            "redirect_uri": redirect_uri or self._get_default_redirect_uri(),
            "state": state,
        }

        authorization_url = (
            f"https://{normalized_domain}/admin/oauth/authorize?"
            + urllib.parse.urlencode(params)
        )

        # Store state for validation
        self._store_oauth_state(state, normalized_domain, redirect_uri)

        logger.info(f"Generated OAuth URL for shop: {normalized_domain}")

        return {
            "authorization_url": authorization_url,
            "state": state,
        }

    def _get_default_redirect_uri(self) -> str:
        """Get the default OAuth redirect URI from settings or construct it."""
        # This should be configured in settings for production
        # For now, return a placeholder that should be overridden
        return "https://your-app.com/api/v1/integrations/shopify/oauth/callback"

    async def exchange_code_for_token(
        self,
        shop_domain: str,
        code: str,
        state: str,
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.

        Args:
            shop_domain: Shop domain from callback
            code: Authorization code from Shopify
            state: State parameter for validation

        Returns:
            Dict with access_token and scope information
        """
        normalized_domain = self._normalize_shop_domain(shop_domain)

        # Validate state
        state_data = self._validate_oauth_state(state, shop_domain)

        # Exchange code for token
        token_url = f"https://{normalized_domain}/admin/oauth/access_token"

        payload = {
            "client_id": self.settings.SHOPIFY_API_KEY,
            "client_secret": self.settings.SHOPIFY_API_SECRET,
            "code": code,
        }

        async with httpx.AsyncClient(timeout=self.settings.SHOPIFY_REQUEST_TIMEOUT) as client:
            try:
                response = await client.post(token_url, json=payload)

                if response.status_code != 200:
                    error_data = response.json() if response.content else {}
                    logger.error(
                        f"Token exchange failed: {response.status_code} - {error_data}"
                    )
                    raise TokenExchangeError(
                        message=f"Token exchange failed: {error_data.get('error_description', 'Unknown error')}",
                        details={"status_code": response.status_code, "error": error_data},
                    )

                token_data = response.json()

                # Consume state after successful exchange
                self._consume_oauth_state(state)

                logger.info(f"Successfully obtained access token for shop: {normalized_domain}")

                return {
                    "access_token": token_data.get("access_token"),
                    "scope": token_data.get("scope", "").split(","),
                    "shop_domain": normalized_domain,
                }

            except httpx.RequestError as e:
                logger.error(f"Network error during token exchange: {e}")
                raise TokenExchangeError(
                    message=f"Network error during token exchange: {str(e)}",
                    details={"error_type": type(e).__name__},
                )

    async def save_store_connection(
        self,
        shop_domain: str,
        access_token: str,
        scopes: List[str],
        society_id: Optional[int] = None,
        user_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Save or update store connection in database.

        Args:
            shop_domain: Normalized shop domain
            access_token: Access token from OAuth
            scopes: Granted scopes
            society_id: Associated society ID (optional)
            user_id: User who connected the store (optional)

        Returns:
            Store connection info
        """
        normalized_domain = self._normalize_shop_domain(shop_domain)
        scope_string = ",".join(scopes) if scopes else ""

        # Check if integration already exists
        stmt = select(ShopifyIntegration).where(
            ShopifyIntegration.shp_shop == normalized_domain
        )
        if society_id:
            stmt = stmt.where(ShopifyIntegration.soc_id == society_id)

        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing integration
            existing.shp_access_token = access_token
            existing.shp_scope = scope_string
            existing.shp_is_active = True
            existing.shp_updated_at = datetime.now(timezone.utc)
            if user_id:
                existing.usr_id = user_id

            await self.db.commit()
            await self.db.refresh(existing)

            logger.info(
                f"Updated existing Shopify integration for shop: {normalized_domain}",
                extra={"integration_id": existing.shp_id},
            )

            return {
                "store_id": existing.shp_id,
                "shop_domain": existing.shp_shop,
                "scopes": existing.scopes,
                "is_active": existing.shp_is_active,
                "connected_at": existing.shp_created_at.isoformat() if existing.shp_created_at else None,
            }

        # Create new integration
        new_integration = ShopifyIntegration(
            soc_id=society_id or 1,
            usr_id=user_id or 1,
            shp_shop=normalized_domain,
            shp_access_token=access_token,
            shp_scope=scope_string,
            shp_is_active=True,
        )

        self.db.add(new_integration)
        await self.db.commit()
        await self.db.refresh(new_integration)

        logger.info(
            f"Created new Shopify integration for shop: {normalized_domain}",
            extra={"integration_id": new_integration.shp_id},
        )

        return {
            "store_id": new_integration.shp_id,
            "shop_domain": new_integration.shp_shop,
            "scopes": new_integration.scopes,
            "is_active": new_integration.shp_is_active,
            "connected_at": new_integration.shp_created_at.isoformat() if new_integration.shp_created_at else None,
        }

    async def get_store_by_domain(
        self,
        shop_domain: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get store connection by domain.

        Args:
            shop_domain: Shop domain to look up

        Returns:
            Store info or None if not found
        """
        normalized_domain = self._normalize_shop_domain(shop_domain)

        stmt = select(ShopifyIntegration).where(
            ShopifyIntegration.shp_shop == normalized_domain
        )
        result = await self.db.execute(stmt)
        store = result.scalar_one_or_none()

        if not store:
            logger.debug(f"Store not found: {normalized_domain}")
            return None

        return {
            "store_id": store.shp_id,
            "shop_domain": store.shp_shop,
            "scopes": store.scopes,
            "is_active": store.shp_is_active,
            "access_token": store.shp_access_token,
            "connected_at": store.shp_created_at.isoformat() if store.shp_created_at else None,
            "last_used_at": store.shp_last_used_at.isoformat() if store.shp_last_used_at else None,
        }

    async def disconnect_store(
        self,
        shop_domain: str,
    ) -> bool:
        """
        Disconnect (deactivate) a store connection.

        Args:
            shop_domain: Shop domain to disconnect

        Returns:
            True if successful
        """
        normalized_domain = self._normalize_shop_domain(shop_domain)

        stmt = select(ShopifyIntegration).where(
            ShopifyIntegration.shp_shop == normalized_domain
        )
        result = await self.db.execute(stmt)
        store = result.scalar_one_or_none()

        if not store:
            logger.warning(f"Store not found for disconnection: {normalized_domain}")
            return False

        store.shp_is_active = False
        store.shp_updated_at = datetime.now(timezone.utc)
        await self.db.commit()

        logger.info(f"Store disconnected: {normalized_domain}")
        return True

    async def verify_token(
        self,
        shop_domain: str,
        access_token: str,
    ) -> bool:
        """
        Verify that an access token is still valid.

        Args:
            shop_domain: Shop domain
            access_token: Token to verify

        Returns:
            True if token is valid
        """
        normalized_domain = self._normalize_shop_domain(shop_domain)

        # Make a simple API call to verify token
        url = f"https://{normalized_domain}/admin/api/{self.settings.SHOPIFY_API_VERSION}/shop.json"

        async with httpx.AsyncClient(timeout=self.settings.SHOPIFY_REQUEST_TIMEOUT) as client:
            try:
                response = await client.get(
                    url,
                    headers={"X-Shopify-Access-Token": access_token},
                )
                return response.status_code == 200

            except httpx.RequestError:
                return False

    async def list_connected_stores(
        self,
        society_id: Optional[int] = None,
        active_only: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        List all connected stores.

        Args:
            society_id: Filter by society (optional)
            active_only: Only return active connections

        Returns:
            List of store info dicts
        """
        stmt = select(ShopifyIntegration)

        if active_only:
            stmt = stmt.where(ShopifyIntegration.shp_is_active == True)

        if society_id:
            stmt = stmt.where(ShopifyIntegration.soc_id == society_id)

        result = await self.db.execute(stmt)
        stores = result.scalars().all()

        logger.debug(f"Found {len(stores)} stores")

        return [
            {
                "store_id": store.shp_id,
                "shop_domain": store.shp_shop,
                "scopes": store.scopes,
                "is_active": store.shp_is_active,
                "connected_at": store.shp_created_at.isoformat() if store.shp_created_at else None,
                "last_used_at": store.shp_last_used_at.isoformat() if store.shp_last_used_at else None,
            }
            for store in stores
        ]


def get_shopify_oauth_service(db: AsyncSession) -> ShopifyOAuthService:
    """Factory function to get ShopifyOAuthService instance."""
    return ShopifyOAuthService(db)

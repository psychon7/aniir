"""
Shopify Webhook Service.

Handles webhook registration, management, and deregistration with Shopify:
- Registering webhooks after OAuth completion
- Managing webhook subscriptions
- Deregistering webhooks on app uninstall
- Syncing webhook state with database
"""
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from fastapi import Depends

from app.database import get_db
from app.config import get_settings, Settings
from app.models.integrations.shopify import ShopifyIntegration, ShopifyWebhook
from app.integrations.shopify.exceptions import (
    ShopifyError,
    ShopifyWebhookError,
    ShopifyConfigurationError,
    ShopifyAuthenticationError,
    ShopifyNetworkError,
    ShopifyRateLimitError,
)

logger = logging.getLogger(__name__)


# Default webhook topics to register after OAuth
DEFAULT_WEBHOOK_TOPICS = [
    "orders/create",
    "orders/updated",
    "orders/paid",
    "orders/fulfilled",
    "orders/cancelled",
    "products/create",
    "products/update",
    "products/delete",
    "inventory_levels/update",
    "customers/create",
    "customers/update",
    "app/uninstalled",
]


class WebhookRegistrationResult:
    """Result of a webhook registration attempt."""

    def __init__(
        self,
        topic: str,
        success: bool,
        shopify_id: Optional[int] = None,
        error: Optional[str] = None,
    ):
        self.topic = topic
        self.success = success
        self.shopify_id = shopify_id
        self.error = error

    def to_dict(self) -> Dict[str, Any]:
        return {
            "topic": self.topic,
            "success": self.success,
            "shopify_id": self.shopify_id,
            "error": self.error,
        }


class ShopifyWebhookService:
    """Service for managing Shopify webhooks."""

    def __init__(self, db: AsyncSession, settings: Optional[Settings] = None):
        """
        Initialize the webhook service.

        Args:
            db: Database session for webhook storage
            settings: Application settings (uses default if not provided)
        """
        self.db = db
        self.settings = settings or get_settings()
        self._validate_config()

    def _validate_config(self) -> None:
        """Validate required Shopify configuration."""
        missing = []
        if not self.settings.SHOPIFY_API_KEY:
            missing.append("SHOPIFY_API_KEY")
        if not self.settings.SHOPIFY_API_SECRET:
            missing.append("SHOPIFY_API_SECRET")

        if missing:
            raise ShopifyConfigurationError(
                message="Missing required Shopify webhook configuration",
                missing_config=missing,
            )

    def _get_webhook_address(self, topic: str) -> str:
        """
        Get the webhook callback URL for a given topic.

        Args:
            topic: Webhook topic (e.g., "orders/create")

        Returns:
            Full webhook callback URL
        """
        # Convert topic to URL-safe format (e.g., "orders/create" -> "orders-create")
        topic_path = topic.replace("/", "-")

        # Get base URL from CORS origins or use default
        base_url = (
            self.settings.CORS_ORIGINS[0]
            if self.settings.CORS_ORIGINS
            else "http://localhost:8000"
        )

        # Ensure we're using the backend URL, not frontend
        # In production, this should be configured separately
        if "localhost:3000" in base_url or "localhost:5173" in base_url:
            base_url = "http://localhost:8000"

        return f"{base_url}/api/v1/integrations/shopify/webhooks/{topic_path}"

    async def register_webhook(
        self,
        shop_domain: str,
        access_token: str,
        topic: str,
        integration_id: int,
    ) -> WebhookRegistrationResult:
        """
        Register a single webhook with Shopify.

        Args:
            shop_domain: Shopify store domain
            access_token: Store access token
            topic: Webhook topic to register
            integration_id: Database ID of the ShopifyIntegration

        Returns:
            WebhookRegistrationResult with registration status
        """
        webhook_url = f"https://{shop_domain}/admin/api/{self.settings.SHOPIFY_API_VERSION}/webhooks.json"
        address = self._get_webhook_address(topic)

        payload = {
            "webhook": {
                "topic": topic,
                "address": address,
                "format": "json",
            }
        }

        headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.SHOPIFY_REQUEST_TIMEOUT) as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers=headers,
                )

                if response.status_code == 201:
                    # Successful registration
                    data = response.json()
                    shopify_webhook_id = data.get("webhook", {}).get("id")

                    # Store webhook in database
                    await self._save_webhook_to_db(
                        integration_id=integration_id,
                        shopify_id=shopify_webhook_id,
                        topic=topic,
                        address=address,
                    )

                    logger.info(
                        f"Successfully registered webhook: {topic}",
                        extra={
                            "shop_domain": shop_domain,
                            "topic": topic,
                            "shopify_webhook_id": shopify_webhook_id,
                        },
                    )

                    return WebhookRegistrationResult(
                        topic=topic,
                        success=True,
                        shopify_id=shopify_webhook_id,
                    )

                elif response.status_code == 422:
                    # Webhook might already exist - check for duplicate
                    error_data = response.json()
                    errors = error_data.get("errors", {})

                    # Check if it's a duplicate address error
                    if "address" in errors and "has already been taken" in str(errors["address"]):
                        logger.info(
                            f"Webhook already exists: {topic}",
                            extra={"shop_domain": shop_domain, "topic": topic},
                        )

                        # Try to fetch existing webhook and store it
                        existing_id = await self._find_existing_webhook(
                            shop_domain, access_token, topic
                        )

                        if existing_id:
                            await self._save_webhook_to_db(
                                integration_id=integration_id,
                                shopify_id=existing_id,
                                topic=topic,
                                address=address,
                            )

                        return WebhookRegistrationResult(
                            topic=topic,
                            success=True,
                            shopify_id=existing_id,
                            error="Webhook already registered",
                        )

                    logger.warning(
                        f"Failed to register webhook: {topic}",
                        extra={
                            "shop_domain": shop_domain,
                            "topic": topic,
                            "errors": errors,
                        },
                    )

                    return WebhookRegistrationResult(
                        topic=topic,
                        success=False,
                        error=str(errors),
                    )

                elif response.status_code == 401:
                    raise ShopifyAuthenticationError(
                        message="Invalid access token for webhook registration",
                        details={"shop_domain": shop_domain, "topic": topic},
                    )

                elif response.status_code == 429:
                    retry_after = response.headers.get("Retry-After", "60")
                    raise ShopifyRateLimitError(
                        message="Rate limit exceeded during webhook registration",
                        retry_after=float(retry_after),
                    )

                else:
                    error_message = f"Webhook registration failed with status {response.status_code}"
                    logger.error(
                        error_message,
                        extra={
                            "shop_domain": shop_domain,
                            "topic": topic,
                            "status_code": response.status_code,
                            "response": response.text,
                        },
                    )

                    return WebhookRegistrationResult(
                        topic=topic,
                        success=False,
                        error=error_message,
                    )

        except httpx.RequestError as e:
            logger.error(
                f"Network error during webhook registration: {e}",
                extra={"shop_domain": shop_domain, "topic": topic},
            )
            return WebhookRegistrationResult(
                topic=topic,
                success=False,
                error=f"Network error: {str(e)}",
            )

    async def _find_existing_webhook(
        self,
        shop_domain: str,
        access_token: str,
        topic: str,
    ) -> Optional[int]:
        """
        Find an existing webhook by topic.

        Args:
            shop_domain: Shopify store domain
            access_token: Store access token
            topic: Webhook topic to find

        Returns:
            Shopify webhook ID if found, None otherwise
        """
        list_url = f"https://{shop_domain}/admin/api/{self.settings.SHOPIFY_API_VERSION}/webhooks.json"

        headers = {
            "X-Shopify-Access-Token": access_token,
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.SHOPIFY_REQUEST_TIMEOUT) as client:
                response = await client.get(list_url, headers=headers, params={"topic": topic})

                if response.status_code == 200:
                    data = response.json()
                    webhooks = data.get("webhooks", [])

                    for webhook in webhooks:
                        if webhook.get("topic") == topic:
                            return webhook.get("id")

        except httpx.RequestError as e:
            logger.warning(f"Failed to fetch existing webhooks: {e}")

        return None

    async def _save_webhook_to_db(
        self,
        integration_id: int,
        shopify_id: Optional[int],
        topic: str,
        address: str,
    ) -> ShopifyWebhook:
        """
        Save webhook registration to database.

        Args:
            integration_id: ShopifyIntegration ID
            shopify_id: Shopify webhook ID
            topic: Webhook topic
            address: Webhook callback address

        Returns:
            ShopifyWebhook model instance
        """
        # Check if webhook already exists for this integration and topic
        stmt = select(ShopifyWebhook).where(
            ShopifyWebhook.shp_id == integration_id,
            ShopifyWebhook.swh_topic == topic,
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing record
            existing.swh_shopify_id = shopify_id
            existing.swh_address = address
            existing.swh_is_active = True
            existing.swh_updated_at = datetime.utcnow()
            await self.db.commit()
            return existing

        # Create new record
        webhook = ShopifyWebhook(
            shp_id=integration_id,
            swh_shopify_id=shopify_id,
            swh_topic=topic,
            swh_address=address,
            swh_format="json",
            swh_is_active=True,
        )

        self.db.add(webhook)
        await self.db.commit()
        await self.db.refresh(webhook)

        return webhook

    async def register_webhooks_after_oauth(
        self,
        shop_domain: str,
        access_token: str,
        integration_id: int,
        topics: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Register all required webhooks after successful OAuth.

        This is the main method to call after OAuth completion to set up
        all necessary webhook subscriptions.

        Args:
            shop_domain: Shopify store domain
            access_token: Store access token
            integration_id: Database ID of the ShopifyIntegration
            topics: Optional list of topics to register (defaults to all)

        Returns:
            Summary of registration results
        """
        topics_to_register = topics or DEFAULT_WEBHOOK_TOPICS

        logger.info(
            f"Registering webhooks for shop: {shop_domain}",
            extra={
                "shop_domain": shop_domain,
                "integration_id": integration_id,
                "topics_count": len(topics_to_register),
            },
        )

        results: List[WebhookRegistrationResult] = []

        for topic in topics_to_register:
            result = await self.register_webhook(
                shop_domain=shop_domain,
                access_token=access_token,
                topic=topic,
                integration_id=integration_id,
            )
            results.append(result)

        # Summarize results
        successful = [r for r in results if r.success]
        failed = [r for r in results if not r.success]

        summary = {
            "shop_domain": shop_domain,
            "total_topics": len(topics_to_register),
            "successful": len(successful),
            "failed": len(failed),
            "results": [r.to_dict() for r in results],
        }

        if failed:
            logger.warning(
                f"Some webhooks failed to register for {shop_domain}",
                extra=summary,
            )
        else:
            logger.info(
                f"All webhooks registered successfully for {shop_domain}",
                extra=summary,
            )

        return summary

    async def deregister_webhook(
        self,
        shop_domain: str,
        access_token: str,
        shopify_webhook_id: int,
        db_webhook_id: Optional[int] = None,
    ) -> bool:
        """
        Deregister a webhook from Shopify.

        Args:
            shop_domain: Shopify store domain
            access_token: Store access token
            shopify_webhook_id: Shopify's webhook ID
            db_webhook_id: Optional database webhook ID to update

        Returns:
            True if successful, False otherwise
        """
        delete_url = f"https://{shop_domain}/admin/api/{self.settings.SHOPIFY_API_VERSION}/webhooks/{shopify_webhook_id}.json"

        headers = {
            "X-Shopify-Access-Token": access_token,
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.SHOPIFY_REQUEST_TIMEOUT) as client:
                response = await client.delete(delete_url, headers=headers)

                if response.status_code in (200, 404):
                    # 404 means already deleted, which is fine

                    # Mark as inactive in database
                    if db_webhook_id:
                        stmt = (
                            update(ShopifyWebhook)
                            .where(ShopifyWebhook.swh_id == db_webhook_id)
                            .values(swh_is_active=False, swh_updated_at=datetime.utcnow())
                        )
                        await self.db.execute(stmt)
                        await self.db.commit()

                    logger.info(
                        f"Webhook deregistered successfully",
                        extra={
                            "shop_domain": shop_domain,
                            "shopify_webhook_id": shopify_webhook_id,
                        },
                    )

                    return True

                elif response.status_code == 401:
                    logger.warning(
                        f"Unauthorized to deregister webhook",
                        extra={
                            "shop_domain": shop_domain,
                            "shopify_webhook_id": shopify_webhook_id,
                        },
                    )
                    return False

                else:
                    logger.error(
                        f"Failed to deregister webhook: status {response.status_code}",
                        extra={
                            "shop_domain": shop_domain,
                            "shopify_webhook_id": shopify_webhook_id,
                            "response": response.text,
                        },
                    )
                    return False

        except httpx.RequestError as e:
            logger.error(
                f"Network error during webhook deregistration: {e}",
                extra={
                    "shop_domain": shop_domain,
                    "shopify_webhook_id": shopify_webhook_id,
                },
            )
            return False

    async def deregister_all_webhooks(
        self,
        integration_id: int,
        shop_domain: str,
        access_token: str,
    ) -> Dict[str, Any]:
        """
        Deregister all webhooks for an integration.

        Used when app is uninstalled or store is disconnected.

        Args:
            integration_id: ShopifyIntegration ID
            shop_domain: Shopify store domain
            access_token: Store access token

        Returns:
            Summary of deregistration results
        """
        logger.info(
            f"Deregistering all webhooks for integration: {integration_id}",
            extra={"shop_domain": shop_domain},
        )

        # Get all active webhooks from database
        stmt = select(ShopifyWebhook).where(
            ShopifyWebhook.shp_id == integration_id,
            ShopifyWebhook.swh_is_active == True,
        )
        result = await self.db.execute(stmt)
        webhooks = result.scalars().all()

        successful = 0
        failed = 0

        for webhook in webhooks:
            if webhook.swh_shopify_id:
                success = await self.deregister_webhook(
                    shop_domain=shop_domain,
                    access_token=access_token,
                    shopify_webhook_id=webhook.swh_shopify_id,
                    db_webhook_id=webhook.swh_id,
                )
                if success:
                    successful += 1
                else:
                    failed += 1
            else:
                # No Shopify ID, just mark as inactive
                webhook.swh_is_active = False
                webhook.swh_updated_at = datetime.utcnow()
                successful += 1

        await self.db.commit()

        summary = {
            "shop_domain": shop_domain,
            "total_webhooks": len(webhooks),
            "successful": successful,
            "failed": failed,
        }

        logger.info(
            f"Webhook deregistration complete for {shop_domain}",
            extra=summary,
        )

        return summary

    async def handle_app_uninstalled(
        self,
        shop_domain: str,
    ) -> Dict[str, Any]:
        """
        Handle app/uninstalled webhook.

        This is called when the app is uninstalled from a Shopify store.
        Marks the integration as inactive and cleans up webhooks.

        Args:
            shop_domain: Shopify store domain

        Returns:
            Summary of cleanup actions
        """
        logger.info(
            f"Processing app uninstall for shop: {shop_domain}",
        )

        # Find the integration
        stmt = select(ShopifyIntegration).where(
            ShopifyIntegration.shp_shop == shop_domain,
            ShopifyIntegration.shp_is_active == True,
        )
        result = await self.db.execute(stmt)
        integration = result.scalar_one_or_none()

        if not integration:
            logger.warning(
                f"No active integration found for uninstalled shop: {shop_domain}",
            )
            return {
                "success": False,
                "message": "Integration not found",
                "shop_domain": shop_domain,
            }

        # Mark integration as inactive
        integration.shp_is_active = False
        integration.shp_updated_at = datetime.utcnow()

        # Mark all webhooks as inactive (we can't deregister since app is uninstalled)
        stmt = (
            update(ShopifyWebhook)
            .where(ShopifyWebhook.shp_id == integration.shp_id)
            .values(swh_is_active=False, swh_updated_at=datetime.utcnow())
        )
        await self.db.execute(stmt)
        await self.db.commit()

        logger.info(
            f"App uninstall processed for shop: {shop_domain}",
            extra={"integration_id": integration.shp_id},
        )

        return {
            "success": True,
            "message": "Integration deactivated",
            "shop_domain": shop_domain,
            "integration_id": integration.shp_id,
        }

    async def list_webhooks(
        self,
        shop_domain: str,
        access_token: str,
    ) -> List[Dict[str, Any]]:
        """
        List all registered webhooks for a shop.

        Args:
            shop_domain: Shopify store domain
            access_token: Store access token

        Returns:
            List of webhook details from Shopify
        """
        list_url = f"https://{shop_domain}/admin/api/{self.settings.SHOPIFY_API_VERSION}/webhooks.json"

        headers = {
            "X-Shopify-Access-Token": access_token,
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.SHOPIFY_REQUEST_TIMEOUT) as client:
                response = await client.get(list_url, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    return data.get("webhooks", [])

                elif response.status_code == 401:
                    raise ShopifyAuthenticationError(
                        message="Invalid access token for listing webhooks",
                        details={"shop_domain": shop_domain},
                    )

                else:
                    logger.error(
                        f"Failed to list webhooks: status {response.status_code}",
                        extra={
                            "shop_domain": shop_domain,
                            "response": response.text,
                        },
                    )
                    return []

        except httpx.RequestError as e:
            raise ShopifyNetworkError(
                message=f"Network error listing webhooks: {str(e)}",
                original_error=e,
                request_url=list_url,
            )

    async def sync_webhooks_with_db(
        self,
        integration_id: int,
        shop_domain: str,
        access_token: str,
    ) -> Dict[str, Any]:
        """
        Sync webhook state between Shopify and database.

        Useful for ensuring database records match actual Shopify webhooks.

        Args:
            integration_id: ShopifyIntegration ID
            shop_domain: Shopify store domain
            access_token: Store access token

        Returns:
            Sync summary
        """
        # Get webhooks from Shopify
        shopify_webhooks = await self.list_webhooks(shop_domain, access_token)
        shopify_by_topic = {w["topic"]: w for w in shopify_webhooks}

        # Get webhooks from database
        stmt = select(ShopifyWebhook).where(
            ShopifyWebhook.shp_id == integration_id,
        )
        result = await self.db.execute(stmt)
        db_webhooks = result.scalars().all()

        added = 0
        updated = 0
        deactivated = 0

        # Update database with Shopify state
        for db_webhook in db_webhooks:
            if db_webhook.swh_topic in shopify_by_topic:
                shopify_webhook = shopify_by_topic[db_webhook.swh_topic]
                if db_webhook.swh_shopify_id != shopify_webhook["id"]:
                    db_webhook.swh_shopify_id = shopify_webhook["id"]
                    updated += 1
                db_webhook.swh_is_active = True
                del shopify_by_topic[db_webhook.swh_topic]
            else:
                # Webhook exists in DB but not in Shopify
                if db_webhook.swh_is_active:
                    db_webhook.swh_is_active = False
                    deactivated += 1

        # Add webhooks that exist in Shopify but not in DB
        for topic, shopify_webhook in shopify_by_topic.items():
            webhook = ShopifyWebhook(
                shp_id=integration_id,
                swh_shopify_id=shopify_webhook["id"],
                swh_topic=topic,
                swh_address=shopify_webhook.get("address", ""),
                swh_format=shopify_webhook.get("format", "json"),
                swh_is_active=True,
            )
            self.db.add(webhook)
            added += 1

        await self.db.commit()

        return {
            "shop_domain": shop_domain,
            "added": added,
            "updated": updated,
            "deactivated": deactivated,
        }


def get_shopify_webhook_service(db: AsyncSession = Depends(get_db)) -> ShopifyWebhookService:
    """Factory function to get ShopifyWebhookService instance."""
    return ShopifyWebhookService(db)

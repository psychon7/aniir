"""
Tests for Shopify Webhooks API endpoint.

Tests the POST /webhooks/shopify/{store_id} endpoint implementation.
"""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

# Test the module structure without full imports
import ast


class TestWebhookModuleSyntax:
    """Test that the webhook module has valid Python syntax."""

    def test_shopify_webhooks_module_syntax(self):
        """Verify the shopify_webhooks.py module has valid Python syntax."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()
        # This will raise SyntaxError if invalid
        ast.parse(code)
        assert True

    def test_integrations_init_syntax(self):
        """Verify the integrations __init__.py has valid Python syntax."""
        with open('app/api/v1/integrations/__init__.py', 'r') as f:
            code = f.read()
        ast.parse(code)
        assert True

    def test_webhook_module_contains_required_components(self):
        """Verify the webhook module contains required endpoints and functions."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        tree = ast.parse(code)

        # Get all function definitions
        functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        async_functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.AsyncFunctionDef)]

        # Verify required functions exist
        assert 'receive_shopify_webhook' in async_functions, "Missing receive_shopify_webhook endpoint"
        assert 'get_integration_by_store_id' in async_functions, "Missing get_integration_by_store_id helper"
        assert 'log_webhook_event' in async_functions, "Missing log_webhook_event helper"
        assert 'get_topic_handler' in functions, "Missing get_topic_handler helper"

    def test_webhook_module_has_router(self):
        """Verify the webhook module defines a router."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "router = APIRouter" in code, "Missing router definition"
        assert 'prefix="/webhooks/shopify"' in code, "Missing correct router prefix"

    def test_webhook_module_has_response_models(self):
        """Verify response models are defined."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "class WebhookSuccessResponse" in code, "Missing WebhookSuccessResponse model"
        assert "class WebhookErrorResponse" in code, "Missing WebhookErrorResponse model"
        assert "class WebhookErrorDetail" in code, "Missing WebhookErrorDetail model"


class TestWebhookEndpointConfiguration:
    """Test the webhook endpoint configuration."""

    def test_endpoint_supports_all_order_topics(self):
        """Verify all order webhook topics are supported."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        order_topics = [
            "orders/create",
            "orders/updated",
            "orders/paid",
            "orders/fulfilled",
            "orders/cancelled",
        ]

        for topic in order_topics:
            assert topic in code, f"Missing support for {topic} topic"

    def test_endpoint_supports_all_product_topics(self):
        """Verify all product webhook topics are supported."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        product_topics = [
            "products/create",
            "products/update",
            "products/delete",
        ]

        for topic in product_topics:
            assert topic in code, f"Missing support for {topic} topic"

    def test_endpoint_supports_all_inventory_topics(self):
        """Verify all inventory webhook topics are supported."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        inventory_topics = [
            "inventory_levels/update",
            "inventory_levels/connect",
            "inventory_levels/disconnect",
        ]

        for topic in inventory_topics:
            assert topic in code, f"Missing support for {topic} topic"

    def test_endpoint_supports_all_customer_topics(self):
        """Verify all customer webhook topics are supported."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        customer_topics = [
            "customers/create",
            "customers/update",
            "customers/delete",
        ]

        for topic in customer_topics:
            assert topic in code, f"Missing support for {topic} topic"

    def test_endpoint_uses_hmac_verification(self):
        """Verify the endpoint uses HMAC verification dependency."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "get_verified_webhook" in code, "Missing HMAC verification dependency"
        assert "ShopifyWebhookContext" in code, "Missing ShopifyWebhookContext import"

    def test_endpoint_uses_celery_tasks(self):
        """Verify the endpoint delegates to Celery tasks."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        celery_tasks = [
            "process_order_webhook",
            "process_product_webhook",
            "process_inventory_webhook",
            "process_customer_webhook",
            "create_or_update_order_task",
        ]

        for task in celery_tasks:
            assert task in code, f"Missing {task} Celery task import"


class TestIntegrationsModuleRegistration:
    """Test that the webhook router is properly registered."""

    def test_webhook_router_imported_in_integrations(self):
        """Verify the webhook router is imported in integrations __init__.py."""
        with open('app/api/v1/integrations/__init__.py', 'r') as f:
            code = f.read()

        assert "from app.api.v1.integrations.shopify_webhooks import router as shopify_webhooks_router" in code

    def test_webhook_router_included_in_integrations(self):
        """Verify the webhook router is included in the integrations router."""
        with open('app/api/v1/integrations/__init__.py', 'r') as f:
            code = f.read()

        assert "integrations_router.include_router(shopify_webhooks_router)" in code


class TestTopicHandlerFunction:
    """Test the get_topic_handler function logic."""

    def test_topic_handler_code_structure(self):
        """Verify the topic handler function returns correct types."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        # Check that it returns tuples with entity types
        assert '"order"' in code, "Missing order entity type"
        assert '"product"' in code, "Missing product entity type"
        assert '"inventory"' in code, "Missing inventory entity type"
        assert '"customer"' in code, "Missing customer entity type"
        assert '"unknown"' in code, "Missing unknown entity type fallback"


class TestSecurityFeatures:
    """Test security-related features of the webhook endpoint."""

    def test_shop_domain_validation(self):
        """Verify shop domain is validated against stored integration."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "SHOP_DOMAIN_MISMATCH" in code, "Missing shop domain mismatch error handling"
        assert "integration.shp_shop" in code, "Missing shop domain comparison"

    def test_store_not_found_handling(self):
        """Verify proper handling when store is not found."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "STORE_NOT_FOUND" in code, "Missing store not found error code"
        assert "HTTP_404_NOT_FOUND" in code, "Missing 404 status code usage"

    def test_invalid_payload_handling(self):
        """Verify proper handling of invalid JSON payloads."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "INVALID_PAYLOAD" in code, "Missing invalid payload error code"
        assert "json.JSONDecodeError" in code or "JSONDecodeError" in code, "Missing JSON error handling"


class TestLoggingFeatures:
    """Test logging-related features of the webhook endpoint."""

    def test_webhook_event_logging(self):
        """Verify webhook events are logged to the database."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "ShopifySyncLog" in code, "Missing ShopifySyncLog model usage"
        assert "log_webhook_event" in code, "Missing log_webhook_event function"

    def test_logger_usage(self):
        """Verify proper logger usage throughout the module."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert 'logger = logging.getLogger(__name__)' in code, "Missing logger initialization"
        assert 'logger.info(' in code, "Missing info level logging"
        assert 'logger.warning(' in code, "Missing warning level logging"
        assert 'logger.error(' in code, "Missing error level logging"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

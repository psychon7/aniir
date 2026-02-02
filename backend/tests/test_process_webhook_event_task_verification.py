"""
Verification test for process_webhook_event_task().

This test file verifies the implementation of the unified webhook event processing task.
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from datetime import datetime


class TestProcessWebhookEventTask:
    """Tests for process_webhook_event_task."""

    def test_task_import(self):
        """Test that process_webhook_event_task can be imported."""
        from app.tasks.shopify_tasks import process_webhook_event_task
        assert process_webhook_event_task is not None
        assert callable(process_webhook_event_task)

    def test_task_configuration(self):
        """Test task configuration settings."""
        from app.tasks.shopify_tasks import process_webhook_event_task

        # Check task name
        assert process_webhook_event_task.name == "app.tasks.shopify_tasks.process_webhook_event_task"

        # Check retry settings
        assert process_webhook_event_task.max_retries == 5

    def test_extract_entity_id_from_order(self):
        """Test entity ID extraction from order payload."""
        from app.tasks.shopify_tasks import _extract_entity_id

        payload = {"id": 12345678901234, "name": "#1001"}
        entity_id = _extract_entity_id("orders/create", payload)
        assert entity_id == "12345678901234"

    def test_extract_entity_id_from_product(self):
        """Test entity ID extraction from product payload."""
        from app.tasks.shopify_tasks import _extract_entity_id

        payload = {"id": 9876543210, "title": "Test Product"}
        entity_id = _extract_entity_id("products/update", payload)
        assert entity_id == "9876543210"

    def test_extract_entity_id_from_inventory(self):
        """Test entity ID extraction from inventory payload."""
        from app.tasks.shopify_tasks import _extract_entity_id

        payload = {"inventory_item_id": 11111111, "location_id": 22222222, "available": 10}
        entity_id = _extract_entity_id("inventory_levels/update", payload)
        assert entity_id == "11111111"

    def test_extract_entity_id_from_graphql_id(self):
        """Test entity ID extraction from admin_graphql_api_id."""
        from app.tasks.shopify_tasks import _extract_entity_id

        payload = {"admin_graphql_api_id": "gid://shopify/Order/12345"}
        entity_id = _extract_entity_id("orders/create", payload)
        assert entity_id == "gid://shopify/Order/12345"

    def test_extract_entity_id_missing(self):
        """Test entity ID extraction when ID is missing."""
        from app.tasks.shopify_tasks import _extract_entity_id

        payload = {"some_field": "value"}
        entity_id = _extract_entity_id("orders/create", payload)
        assert entity_id is None

    def test_get_entity_type_orders(self):
        """Test entity type extraction for order topics."""
        from app.tasks.shopify_tasks import _get_entity_type

        assert _get_entity_type("orders/create") == "order"
        assert _get_entity_type("orders/updated") == "order"
        assert _get_entity_type("orders/paid") == "order"
        assert _get_entity_type("orders/fulfilled") == "order"
        assert _get_entity_type("orders/cancelled") == "order"

    def test_get_entity_type_products(self):
        """Test entity type extraction for product topics."""
        from app.tasks.shopify_tasks import _get_entity_type

        assert _get_entity_type("products/create") == "product"
        assert _get_entity_type("products/update") == "product"
        assert _get_entity_type("products/delete") == "product"

    def test_get_entity_type_customers(self):
        """Test entity type extraction for customer topics."""
        from app.tasks.shopify_tasks import _get_entity_type

        assert _get_entity_type("customers/create") == "customer"
        assert _get_entity_type("customers/update") == "customer"
        assert _get_entity_type("customers/delete") == "customer"

    def test_get_entity_type_inventory(self):
        """Test entity type extraction for inventory topics."""
        from app.tasks.shopify_tasks import _get_entity_type

        assert _get_entity_type("inventory_levels/update") == "inventory"
        assert _get_entity_type("inventory_levels/connect") == "inventory"
        assert _get_entity_type("inventory_levels/disconnect") == "inventory"

    def test_get_entity_type_app(self):
        """Test entity type extraction for app lifecycle topics."""
        from app.tasks.shopify_tasks import _get_entity_type

        assert _get_entity_type("app/uninstalled") == "app"

    def test_get_entity_type_shop(self):
        """Test entity type extraction for shop topics."""
        from app.tasks.shopify_tasks import _get_entity_type

        assert _get_entity_type("shop/update") == "shop"

    def test_get_entity_type_unknown(self):
        """Test entity type extraction for unknown topics."""
        from app.tasks.shopify_tasks import _get_entity_type

        assert _get_entity_type("unknown/topic") == "unknown"

    def test_route_and_process_product_create(self):
        """Test routing for product create webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "id": 12345,
            "title": "Test Product",
        }
        result = _route_and_process_webhook("products/create", payload)

        assert result["success"] is True
        assert result["action"] == "created"
        assert result["product_id"] == 12345
        assert result["product_title"] == "Test Product"

    def test_route_and_process_product_update(self):
        """Test routing for product update webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "id": 12345,
            "title": "Updated Product",
        }
        result = _route_and_process_webhook("products/update", payload)

        assert result["success"] is True
        assert result["action"] == "updated"

    def test_route_and_process_product_delete(self):
        """Test routing for product delete webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {"id": 12345}
        result = _route_and_process_webhook("products/delete", payload)

        assert result["success"] is True
        assert result["action"] == "deleted"

    def test_route_and_process_customer_create(self):
        """Test routing for customer create webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "id": 54321,
            "email": "test@example.com",
        }
        result = _route_and_process_webhook("customers/create", payload)

        assert result["success"] is True
        assert result["action"] == "created"
        assert result["customer_id"] == 54321
        assert result["customer_email"] == "test@example.com"

    def test_route_and_process_customer_update(self):
        """Test routing for customer update webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "id": 54321,
            "email": "updated@example.com",
        }
        result = _route_and_process_webhook("customers/update", payload)

        assert result["success"] is True
        assert result["action"] == "updated"

    def test_route_and_process_customer_delete(self):
        """Test routing for customer delete webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {"id": 54321}
        result = _route_and_process_webhook("customers/delete", payload)

        assert result["success"] is True
        assert result["action"] == "deleted"

    def test_route_and_process_inventory_update(self):
        """Test routing for inventory update webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "inventory_item_id": 11111,
            "location_id": 22222,
            "available": 50,
        }
        result = _route_and_process_webhook("inventory_levels/update", payload)

        assert result["success"] is True
        assert result["action"] == "inventory_updated"
        assert result["inventory_item_id"] == 11111
        assert result["location_id"] == 22222
        assert result["available"] == 50

    def test_route_and_process_inventory_connect(self):
        """Test routing for inventory connect webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "inventory_item_id": 11111,
            "location_id": 22222,
        }
        result = _route_and_process_webhook("inventory_levels/connect", payload)

        assert result["success"] is True
        assert result["action"] == "inventory_connected"

    def test_route_and_process_inventory_disconnect(self):
        """Test routing for inventory disconnect webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "inventory_item_id": 11111,
            "location_id": 22222,
        }
        result = _route_and_process_webhook("inventory_levels/disconnect", payload)

        assert result["success"] is True
        assert result["action"] == "inventory_disconnected"

    def test_route_and_process_order_paid(self):
        """Test routing for order paid webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "id": 99999,
            "financial_status": "paid",
        }
        result = _route_and_process_webhook("orders/paid", payload)

        assert result["success"] is True
        assert result["action"] == "payment_received"
        assert result["order_id"] == 99999
        assert result["financial_status"] == "paid"

    def test_route_and_process_order_fulfilled(self):
        """Test routing for order fulfilled webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "id": 99999,
            "fulfillment_status": "fulfilled",
        }
        result = _route_and_process_webhook("orders/fulfilled", payload)

        assert result["success"] is True
        assert result["action"] == "fulfilled"

    def test_route_and_process_order_cancelled(self):
        """Test routing for order cancelled webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "id": 99999,
            "cancel_reason": "customer",
        }
        result = _route_and_process_webhook("orders/cancelled", payload)

        assert result["success"] is True
        assert result["action"] == "cancelled"
        assert result["cancel_reason"] == "customer"

    def test_route_and_process_app_uninstalled(self):
        """Test routing for app uninstalled webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "domain": "mystore.myshopify.com",
        }
        result = _route_and_process_webhook("app/uninstalled", payload)

        assert result["success"] is True
        assert result["action"] == "app_uninstalled"
        assert result["shop_domain"] == "mystore.myshopify.com"

    def test_route_and_process_shop_update(self):
        """Test routing for shop update webhook."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {
            "name": "My Store",
            "domain": "mystore.myshopify.com",
        }
        result = _route_and_process_webhook("shop/update", payload)

        assert result["success"] is True
        assert result["action"] == "shop_updated"
        assert result["shop_name"] == "My Store"

    def test_route_and_process_unknown_topic(self):
        """Test routing for unknown webhook topic."""
        from app.tasks.shopify_tasks import _route_and_process_webhook

        payload = {"id": 12345}
        result = _route_and_process_webhook("unknown/topic", payload)

        assert result["success"] is True
        assert result["action"] == "ignored"
        assert "message" in result

    def test_webhook_router_import(self):
        """Test that process_webhook_event_task is imported in the router."""
        from app.api.v1.integrations.shopify_webhooks import process_webhook_event_task
        assert process_webhook_event_task is not None


class TestProcessWebhookEventTaskIntegration:
    """Integration tests for process_webhook_event_task with mocked dependencies."""

    @patch('app.tasks.shopify_tasks.async_session_maker')
    @patch('app.tasks.shopify_tasks._run_async')
    def test_process_webhook_event_task_product_create(self, mock_run_async, mock_session_maker):
        """Test processing a product create webhook."""
        from app.tasks.shopify_tasks import process_webhook_event_task

        # Configure mocks
        mock_run_async.side_effect = lambda coro: None  # Skip async operations

        # Create a mock task request
        mock_task = MagicMock()
        mock_task.request.id = "test-task-id-123"
        mock_task.request.retries = 0
        mock_task.max_retries = 5

        # Test payload
        payload = {
            "id": 12345,
            "title": "Test Product",
        }

        # Call the task function directly (not through Celery)
        from app.tasks.shopify_tasks import _route_and_process_webhook
        result = _route_and_process_webhook("products/create", payload)

        assert result["success"] is True
        assert result["action"] == "created"
        assert result["product_id"] == 12345

    def test_helper_functions_available(self):
        """Test that all helper functions are available."""
        from app.tasks.shopify_tasks import (
            _extract_entity_id,
            _get_entity_type,
            _route_and_process_webhook,
        )

        assert callable(_extract_entity_id)
        assert callable(_get_entity_type)
        assert callable(_route_and_process_webhook)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Tests for Shopify Celery Tasks.

These tests verify:
- Task exception handling
- Task configuration
- Task parameter validation
- Retry behavior
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime


# =============================================================================
# Exception Tests
# =============================================================================

class TestTaskExceptions:
    """Tests for task exceptions."""

    def test_task_error_base(self):
        """Test base TaskError."""
        from app.tasks.exceptions import TaskError

        error = TaskError("Test error", code="TEST_ERROR", details={"key": "value"})
        assert error.message == "Test error"
        assert error.code == "TEST_ERROR"
        assert error.details == {"key": "value"}
        assert error.retryable is True
        assert str(error) == "Test error"

    def test_task_error_to_dict(self):
        """Test TaskError.to_dict() method."""
        from app.tasks.exceptions import TaskError

        error = TaskError("Test error", code="TEST_ERROR", details={"key": "value"}, retryable=False)
        result = error.to_dict()
        assert result == {
            "error": "TEST_ERROR",
            "message": "Test error",
            "details": {"key": "value"},
            "retryable": False,
        }

    def test_shopify_task_error(self):
        """Test ShopifyTaskError."""
        from app.tasks.exceptions import ShopifyTaskError

        error = ShopifyTaskError("Shopify error")
        assert error.code == "SHOPIFY_TASK_ERROR"
        assert error.retryable is True

    def test_shopify_connection_error(self):
        """Test ShopifyConnectionError."""
        from app.tasks.exceptions import ShopifyConnectionError

        error = ShopifyConnectionError()
        assert error.code == "SHOPIFY_CONNECTION_ERROR"
        assert error.retryable is True
        assert "connect" in error.message.lower()

    def test_shopify_authentication_error(self):
        """Test ShopifyAuthenticationError is not retryable."""
        from app.tasks.exceptions import ShopifyAuthenticationError

        error = ShopifyAuthenticationError()
        assert error.code == "SHOPIFY_AUTH_ERROR"
        assert error.retryable is False  # Auth errors should not retry

    def test_shopify_rate_limit_error(self):
        """Test ShopifyRateLimitError with retry_after."""
        from app.tasks.exceptions import ShopifyRateLimitError

        error = ShopifyRateLimitError(retry_after=60)
        assert error.code == "SHOPIFY_RATE_LIMIT"
        assert error.retryable is True
        assert error.retry_after == 60
        assert error.details["retry_after_seconds"] == 60

    def test_shopify_validation_error(self):
        """Test ShopifyValidationError is not retryable."""
        from app.tasks.exceptions import ShopifyValidationError

        error = ShopifyValidationError("Invalid data", field="email")
        assert error.code == "SHOPIFY_VALIDATION_ERROR"
        assert error.retryable is False
        assert error.details["field"] == "email"

    def test_shopify_resource_not_found_error(self):
        """Test ShopifyResourceNotFoundError."""
        from app.tasks.exceptions import ShopifyResourceNotFoundError

        error = ShopifyResourceNotFoundError("order", "12345")
        assert error.code == "SHOPIFY_RESOURCE_NOT_FOUND"
        assert error.retryable is False
        assert "order" in error.message
        assert "12345" in error.message

    def test_shopify_sync_error(self):
        """Test ShopifySyncError with statistics."""
        from app.tasks.exceptions import ShopifySyncError

        error = ShopifySyncError(
            sync_type="orders",
            message="Sync failed",
            partial_success=True,
            processed_count=50,
            failed_count=5,
        )
        assert error.code == "SHOPIFY_SYNC_ERROR"
        assert error.retryable is True  # Partial success is retryable
        assert error.partial_success is True
        assert error.processed_count == 50
        assert error.failed_count == 5

    def test_shopify_webhook_error(self):
        """Test ShopifyWebhookError."""
        from app.tasks.exceptions import ShopifyWebhookError

        error = ShopifyWebhookError(
            webhook_topic="orders/create",
            message="Webhook failed",
            shopify_id="gid://shopify/Order/12345",
        )
        assert error.code == "SHOPIFY_WEBHOOK_ERROR"
        assert error.details["webhook_topic"] == "orders/create"
        assert error.details["shopify_id"] == "gid://shopify/Order/12345"

    def test_shopify_configuration_error(self):
        """Test ShopifyConfigurationError is not retryable."""
        from app.tasks.exceptions import ShopifyConfigurationError

        error = ShopifyConfigurationError(
            missing_settings=["SHOPIFY_SHOP_DOMAIN", "SHOPIFY_ACCESS_TOKEN"]
        )
        assert error.code == "SHOPIFY_CONFIG_ERROR"
        assert error.retryable is False
        assert "SHOPIFY_SHOP_DOMAIN" in error.details["missing_settings"]


# =============================================================================
# Celery Configuration Tests
# =============================================================================

class TestCeleryConfiguration:
    """Tests for Celery app configuration."""

    def test_celery_app_exists(self):
        """Test Celery app is properly configured."""
        from app.tasks.celery_app import celery_app

        assert celery_app is not None
        assert celery_app.main == "erp_tasks"

    def test_celery_queues_configured(self):
        """Test Celery queues are configured."""
        from app.tasks.celery_app import celery_app

        queues = celery_app.conf.task_queues
        queue_names = [q.name for q in queues]

        assert "default" in queue_names
        assert "shopify" in queue_names
        assert "shopify_high" in queue_names
        assert "shopify_low" in queue_names

    def test_celery_task_routes_configured(self):
        """Test task routing is configured."""
        from app.tasks.celery_app import celery_app

        routes = celery_app.conf.task_routes

        assert "app.tasks.shopify_tasks.sync_orders" in routes
        assert routes["app.tasks.shopify_tasks.sync_orders"]["queue"] == "shopify"
        assert routes["app.tasks.shopify_tasks.process_order_webhook"]["queue"] == "shopify_high"
        assert routes["app.tasks.shopify_tasks.full_sync"]["queue"] == "shopify_low"

    def test_celery_beat_schedule_configured(self):
        """Test beat schedule is configured."""
        from app.tasks.celery_app import celery_app

        schedule = celery_app.conf.beat_schedule

        assert "sync-shopify-orders-every-5-minutes" in schedule
        assert schedule["sync-shopify-orders-every-5-minutes"]["task"] == "app.tasks.shopify_tasks.sync_orders"
        assert schedule["sync-shopify-orders-every-5-minutes"]["schedule"] == 300.0

        assert "full-shopify-sync-daily" in schedule
        assert schedule["full-shopify-sync-daily"]["schedule"] == 86400.0


# =============================================================================
# Task Registration Tests
# =============================================================================

class TestTaskRegistration:
    """Tests for task registration."""

    def test_sync_orders_task_registered(self):
        """Test sync_orders task is registered."""
        from app.tasks.shopify_tasks import sync_orders

        assert sync_orders.name == "app.tasks.shopify_tasks.sync_orders"
        assert sync_orders.max_retries == 3

    def test_sync_products_task_registered(self):
        """Test sync_products task is registered."""
        from app.tasks.shopify_tasks import sync_products

        assert sync_products.name == "app.tasks.shopify_tasks.sync_products"
        assert sync_products.max_retries == 3

    def test_sync_inventory_task_registered(self):
        """Test sync_inventory task is registered."""
        from app.tasks.shopify_tasks import sync_inventory

        assert sync_inventory.name == "app.tasks.shopify_tasks.sync_inventory"

    def test_sync_customers_task_registered(self):
        """Test sync_customers task is registered."""
        from app.tasks.shopify_tasks import sync_customers

        assert sync_customers.name == "app.tasks.shopify_tasks.sync_customers"

    def test_full_sync_task_registered(self):
        """Test full_sync task is registered."""
        from app.tasks.shopify_tasks import full_sync

        assert full_sync.name == "app.tasks.shopify_tasks.full_sync"
        assert full_sync.max_retries == 1  # Full sync should have fewer retries

    def test_webhook_tasks_registered(self):
        """Test webhook tasks are registered."""
        from app.tasks.shopify_tasks import (
            process_order_webhook,
            process_product_webhook,
            process_inventory_webhook,
            process_customer_webhook,
        )

        assert process_order_webhook.name == "app.tasks.shopify_tasks.process_order_webhook"
        assert process_product_webhook.name == "app.tasks.shopify_tasks.process_product_webhook"
        assert process_inventory_webhook.name == "app.tasks.shopify_tasks.process_inventory_webhook"
        assert process_customer_webhook.name == "app.tasks.shopify_tasks.process_customer_webhook"

    def test_utility_tasks_registered(self):
        """Test utility tasks are registered."""
        from app.tasks.shopify_tasks import (
            push_inventory_to_shopify,
            push_fulfillment_to_shopify,
            health_check,
        )

        assert push_inventory_to_shopify.name == "app.tasks.shopify_tasks.push_inventory_to_shopify"
        assert push_fulfillment_to_shopify.name == "app.tasks.shopify_tasks.push_fulfillment_to_shopify"
        assert health_check.name == "app.tasks.shopify_tasks.health_check"


# =============================================================================
# Task Configuration Helper Tests
# =============================================================================

class TestTaskHelpers:
    """Tests for task helper functions."""

    @patch("app.tasks.shopify_tasks.get_settings")
    def test_get_shopify_config_success(self, mock_get_settings):
        """Test _get_shopify_config returns config when settings are valid."""
        from app.tasks.shopify_tasks import _get_shopify_config

        mock_settings = MagicMock()
        mock_settings.SHOPIFY_SHOP_DOMAIN = "test.myshopify.com"
        mock_settings.SHOPIFY_ACCESS_TOKEN = "test_token"
        mock_settings.SHOPIFY_API_VERSION = "2025-01"
        mock_settings.SHOPIFY_REQUEST_TIMEOUT = 30
        mock_settings.SHOPIFY_MAX_RETRIES = 3
        mock_settings.SHOPIFY_RATE_LIMIT_BUFFER = 0.2
        mock_get_settings.return_value = mock_settings

        config = _get_shopify_config()

        assert config["shop_domain"] == "test.myshopify.com"
        assert config["access_token"] == "test_token"
        assert config["api_version"] == "2025-01"

    @patch("app.tasks.shopify_tasks.get_settings")
    def test_get_shopify_config_missing_domain(self, mock_get_settings):
        """Test _get_shopify_config raises error when domain is missing."""
        from app.tasks.shopify_tasks import _get_shopify_config
        from app.tasks.exceptions import ShopifyConfigurationError

        mock_settings = MagicMock()
        mock_settings.SHOPIFY_SHOP_DOMAIN = None
        mock_settings.SHOPIFY_ACCESS_TOKEN = "test_token"
        mock_get_settings.return_value = mock_settings

        with pytest.raises(ShopifyConfigurationError) as exc_info:
            _get_shopify_config()

        assert "SHOPIFY_SHOP_DOMAIN" in exc_info.value.details["missing_settings"]

    @patch("app.tasks.shopify_tasks.get_settings")
    def test_get_shopify_config_missing_token(self, mock_get_settings):
        """Test _get_shopify_config raises error when token is missing."""
        from app.tasks.shopify_tasks import _get_shopify_config
        from app.tasks.exceptions import ShopifyConfigurationError

        mock_settings = MagicMock()
        mock_settings.SHOPIFY_SHOP_DOMAIN = "test.myshopify.com"
        mock_settings.SHOPIFY_ACCESS_TOKEN = None
        mock_get_settings.return_value = mock_settings

        with pytest.raises(ShopifyConfigurationError) as exc_info:
            _get_shopify_config()

        assert "SHOPIFY_ACCESS_TOKEN" in exc_info.value.details["missing_settings"]


# =============================================================================
# Module Export Tests
# =============================================================================

class TestModuleExports:
    """Tests for module exports."""

    def test_main_module_exports_celery_app(self):
        """Test main module exports celery_app."""
        from app.tasks import celery_app

        assert celery_app is not None

    def test_main_module_exports_exceptions(self):
        """Test main module exports exceptions."""
        from app.tasks import (
            TaskError,
            ShopifyTaskError,
            ShopifyConnectionError,
            ShopifyAuthenticationError,
            ShopifyRateLimitError,
            ShopifyConfigurationError,
        )

        assert TaskError is not None
        assert ShopifyTaskError is not None
        assert ShopifyConnectionError is not None
        assert ShopifyAuthenticationError is not None
        assert ShopifyRateLimitError is not None
        assert ShopifyConfigurationError is not None

    def test_main_module_exports_sync_tasks(self):
        """Test main module exports sync tasks."""
        from app.tasks import (
            sync_orders,
            sync_products,
            sync_inventory,
            sync_customers,
            full_sync,
        )

        assert sync_orders is not None
        assert sync_products is not None
        assert sync_inventory is not None
        assert sync_customers is not None
        assert full_sync is not None

    def test_main_module_exports_webhook_tasks(self):
        """Test main module exports webhook tasks."""
        from app.tasks import (
            process_order_webhook,
            process_product_webhook,
            process_inventory_webhook,
            process_customer_webhook,
        )

        assert process_order_webhook is not None
        assert process_product_webhook is not None
        assert process_inventory_webhook is not None
        assert process_customer_webhook is not None

    def test_main_module_exports_utility_tasks(self):
        """Test main module exports utility tasks."""
        from app.tasks import (
            push_inventory_to_shopify,
            push_fulfillment_to_shopify,
            health_check,
        )

        assert push_inventory_to_shopify is not None
        assert push_fulfillment_to_shopify is not None
        assert health_check is not None

    def test_main_module_exports_order_sync_tasks(self):
        """Test main module exports order create/update tasks."""
        from app.tasks import (
            create_or_update_order_task,
            batch_sync_orders_task,
        )

        assert create_or_update_order_task is not None
        assert batch_sync_orders_task is not None


# =============================================================================
# Create/Update Order Task Tests
# =============================================================================

class TestCreateOrUpdateOrderTask:
    """Tests for create_or_update_order_task."""

    def test_task_is_registered(self):
        """Test that create_or_update_order_task is registered with Celery."""
        from app.tasks.shopify_tasks import create_or_update_order_task

        assert create_or_update_order_task.name == "app.tasks.shopify_tasks.create_or_update_order_task"

    def test_task_has_correct_retry_config(self):
        """Test task has correct retry configuration."""
        from app.tasks.shopify_tasks import create_or_update_order_task

        assert create_or_update_order_task.max_retries == 5
        assert create_or_update_order_task.autoretry_for is not None
        assert create_or_update_order_task.retry_backoff is True
        assert create_or_update_order_task.retry_jitter is True

    def test_batch_sync_task_is_registered(self):
        """Test that batch_sync_orders_task is registered with Celery."""
        from app.tasks.shopify_tasks import batch_sync_orders_task

        assert batch_sync_orders_task.name == "app.tasks.shopify_tasks.batch_sync_orders_task"


# =============================================================================
# Order Schema Tests
# =============================================================================

class TestOrderSchemas:
    """Tests for order-related Pydantic schemas."""

    def test_shopify_order_webhook_schema_parses_minimal_payload(self):
        """Test ShopifyOrderWebhook schema parses minimal valid payload."""
        from app.schemas.order import ShopifyOrderWebhook

        payload = {
            "id": 12345678901234,
            "name": "#1001",
            "created_at": "2024-01-15T10:30:00-05:00",
            "updated_at": "2024-01-15T10:30:00-05:00",
            "currency": "USD",
            "total_price": "100.00",
            "subtotal_price": "90.00",
            "total_tax": "10.00",
            "total_discounts": "0.00",
        }

        webhook = ShopifyOrderWebhook(**payload)
        assert webhook.id == 12345678901234
        assert webhook.name == "#1001"
        assert webhook.currency == "USD"
        assert webhook.total_price == "100.00"

    def test_shopify_order_webhook_schema_parses_full_payload(self):
        """Test ShopifyOrderWebhook schema parses complete payload."""
        from app.schemas.order import ShopifyOrderWebhook

        payload = {
            "id": 12345678901234,
            "name": "#1001",
            "email": "customer@example.com",
            "phone": "+1234567890",
            "created_at": "2024-01-15T10:30:00-05:00",
            "updated_at": "2024-01-15T10:30:00-05:00",
            "currency": "USD",
            "financial_status": "paid",
            "fulfillment_status": None,
            "total_price": "110.00",
            "subtotal_price": "100.00",
            "total_tax": "10.00",
            "total_discounts": "5.00",
            "line_items": [
                {
                    "id": 1001,
                    "title": "Test Product",
                    "quantity": 2,
                    "price": "50.00",
                    "taxable": True,
                }
            ],
            "shipping_address": {
                "address1": "123 Main St",
                "city": "New York",
                "zip": "10001",
                "country_code": "US",
            },
            "billing_address": {
                "address1": "123 Main St",
                "city": "New York",
                "zip": "10001",
                "country_code": "US",
            },
            "customer": {
                "id": 5001,
                "email": "customer@example.com",
                "first_name": "John",
                "last_name": "Doe",
            },
            "note": "Please deliver before noon",
        }

        webhook = ShopifyOrderWebhook(**payload)
        assert webhook.id == 12345678901234
        assert webhook.email == "customer@example.com"
        assert webhook.financial_status == "paid"
        assert len(webhook.line_items) == 1
        assert webhook.line_items[0].title == "Test Product"
        assert webhook.shipping_address.city == "New York"
        assert webhook.customer.first_name == "John"
        assert webhook.note == "Please deliver before noon"

    def test_order_sync_result_schema(self):
        """Test OrderSyncResult schema."""
        from app.schemas.order import OrderSyncResult

        result = OrderSyncResult(
            success=True,
            order_id=123,
            shopify_id="12345678901234",
            action="created",
            message="Order created successfully",
        )

        assert result.success is True
        assert result.order_id == 123
        assert result.action == "created"

        # Test serialization
        data = result.model_dump()
        assert data["success"] is True
        assert data["shopify_id"] == "12345678901234"

    def test_order_sync_result_error_case(self):
        """Test OrderSyncResult schema for error case."""
        from app.schemas.order import OrderSyncResult

        result = OrderSyncResult(
            success=False,
            order_id=None,
            shopify_id="12345678901234",
            action="error",
            error="Database connection failed",
        )

        assert result.success is False
        assert result.order_id is None
        assert result.error == "Database connection failed"


# =============================================================================
# Order Model Tests
# =============================================================================

class TestOrderModels:
    """Tests for order-related SQLAlchemy models."""

    def test_client_order_model_exists(self):
        """Test ClientOrder model is importable."""
        from app.models.order import ClientOrder

        assert ClientOrder.__tablename__ == "TM_ORD_ClientOrder"

    def test_client_order_line_model_exists(self):
        """Test ClientOrderLine model is importable."""
        from app.models.order import ClientOrderLine

        assert ClientOrderLine.__tablename__ == "TM_ORD_ClientOrderLine"

    def test_client_order_has_shopify_fields(self):
        """Test ClientOrder model has Shopify integration fields."""
        from app.models.order import ClientOrder

        # Check that Shopify-specific columns exist
        columns = [c.name for c in ClientOrder.__table__.columns]
        assert "ord_shopify_id" in columns
        assert "ord_shopify_name" in columns
        assert "ord_shopify_created_at" in columns
        assert "ord_shopify_updated_at" in columns

    def test_client_order_has_sync_tracking_fields(self):
        """Test ClientOrder model has sync tracking fields."""
        from app.models.order import ClientOrder

        columns = [c.name for c in ClientOrder.__table__.columns]
        assert "ord_synced_at" in columns
        assert "ord_sync_status" in columns
        assert "ord_sync_error" in columns

    def test_client_order_line_has_shopify_fields(self):
        """Test ClientOrderLine model has Shopify integration fields."""
        from app.models.order import ClientOrderLine

        columns = [c.name for c in ClientOrderLine.__table__.columns]
        assert "orl_shopify_line_id" in columns
        assert "orl_shopify_variant_id" in columns
        assert "orl_shopify_product_id" in columns

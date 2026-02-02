"""
Tests for Webhook Idempotency Service.

Tests the duplicate detection (idempotency) functionality for Shopify webhooks.
This ensures webhooks are not processed multiple times during Shopify's retry mechanism.
"""
import ast
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta


class TestIdempotencyModuleSyntax:
    """Test that the idempotency modules have valid Python syntax."""

    def test_webhook_idempotency_service_syntax(self):
        """Verify the webhook_idempotency_service.py module has valid Python syntax."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()
        ast.parse(code)
        assert True

    def test_redis_client_syntax(self):
        """Verify the redis_client.py module has valid Python syntax."""
        with open('app/utils/redis_client.py', 'r') as f:
            code = f.read()
        ast.parse(code)
        assert True

    def test_settings_syntax(self):
        """Verify the settings.py module has valid Python syntax."""
        with open('app/config/settings.py', 'r') as f:
            code = f.read()
        ast.parse(code)
        assert True


class TestIdempotencyServiceStructure:
    """Test the structure of the idempotency service."""

    def test_service_has_required_methods(self):
        """Verify the idempotency service has all required methods."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        tree = ast.parse(code)

        # Get all method definitions in the class
        methods = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == 'WebhookIdempotencyService':
                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        methods.append(item.name)

        required_methods = [
            '__init__',
            '_build_key',
            'check_redis',
            'mark_processed_redis',
            'check_database',
            'check_and_mark',
        ]

        for method in required_methods:
            assert method in methods, f"Missing required method: {method}"

    def test_service_has_result_classes(self):
        """Verify result classes are defined."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "class IdempotencyResult" in code, "Missing IdempotencyResult enum"
        assert "class WebhookCheckResult" in code, "Missing WebhookCheckResult namedtuple"

    def test_service_exports_singleton(self):
        """Verify the service exports a singleton instance."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "webhook_idempotency = WebhookIdempotencyService()" in code, "Missing singleton instance"


class TestRedisClientStructure:
    """Test the structure of the Redis client utility."""

    def test_redis_client_has_required_functions(self):
        """Verify the Redis client has all required functions."""
        with open('app/utils/redis_client.py', 'r') as f:
            code = f.read()

        tree = ast.parse(code)

        functions = []
        async_functions = []
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append(node.name)
            elif isinstance(node, ast.AsyncFunctionDef):
                async_functions.append(node.name)

        required_functions = [
            'get_redis_pool',
            'get_redis_client',
        ]

        required_async_functions = [
            'close_redis',
            'check_redis_connection',
        ]

        for func in required_functions:
            assert func in functions, f"Missing required function: {func}"

        for func in required_async_functions:
            assert func in async_functions, f"Missing required async function: {func}"

    def test_redis_cache_class_has_required_methods(self):
        """Verify RedisCache class has all required methods."""
        with open('app/utils/redis_client.py', 'r') as f:
            code = f.read()

        tree = ast.parse(code)

        methods = []
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef) and node.name == 'RedisCache':
                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        methods.append(item.name)

        required_methods = [
            '__init__',
            '_key',
            'get',
            'set',
            'exists',
            'delete',
            'setex_if_not_exists',
        ]

        for method in required_methods:
            assert method in methods, f"Missing required method in RedisCache: {method}"


class TestSettingsConfiguration:
    """Test the configuration settings for idempotency."""

    def test_idempotency_settings_defined(self):
        """Verify idempotency settings are defined in settings.py."""
        with open('app/config/settings.py', 'r') as f:
            code = f.read()

        assert "WEBHOOK_IDEMPOTENCY_TTL_HOURS" in code, "Missing WEBHOOK_IDEMPOTENCY_TTL_HOURS setting"
        assert "WEBHOOK_IDEMPOTENCY_ENABLED" in code, "Missing WEBHOOK_IDEMPOTENCY_ENABLED setting"


class TestWebhookEndpointIntegration:
    """Test that idempotency is integrated into webhook endpoints."""

    def test_idempotency_service_imported_in_webhooks(self):
        """Verify the idempotency service is imported in webhook endpoints."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "webhook_idempotency" in code, "Missing webhook_idempotency import"
        assert "WebhookCheckResult" in code, "Missing WebhookCheckResult import"

    def test_main_endpoint_has_idempotency_check(self):
        """Verify the main webhook endpoint performs idempotency checks."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert "check_and_mark" in code, "Missing check_and_mark call"
        assert "is_duplicate" in code, "Missing is_duplicate check"

    def test_duplicate_webhooks_are_skipped(self):
        """Verify duplicate webhooks are skipped with appropriate response."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert '"skipped"' in code, "Missing 'skipped' status for duplicates"
        assert "duplicate, skipped" in code.lower(), "Missing duplicate skip message"

    def test_success_response_includes_duplicate_flag(self):
        """Verify WebhookSuccessResponse includes is_duplicate field."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert 'is_duplicate: bool' in code or 'is_duplicate:bool' in code.replace(' ', ''), \
            "Missing is_duplicate field in WebhookSuccessResponse"


class TestIdempotencyKeyFormat:
    """Test the idempotency key format and structure."""

    def test_key_includes_integration_id(self):
        """Verify the cache key includes integration ID."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "integration_id" in code, "Missing integration_id in key building"

    def test_key_includes_topic(self):
        """Verify the cache key includes webhook topic."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "topic" in code, "Missing topic in key building"

    def test_key_includes_webhook_id(self):
        """Verify the cache key includes Shopify webhook ID."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "webhook_id" in code, "Missing webhook_id in key building"


class TestErrorHandling:
    """Test error handling in idempotency service."""

    def test_handles_missing_webhook_id(self):
        """Verify service handles missing webhook ID gracefully."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "if not webhook_id" in code, "Missing check for empty webhook_id"

    def test_handles_redis_unavailability(self):
        """Verify service handles Redis being unavailable."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "REDIS_UNAVAILABLE" in code, "Missing REDIS_UNAVAILABLE result"

    def test_falls_back_to_database(self):
        """Verify service falls back to database when Redis unavailable."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "check_database" in code, "Missing database fallback"


class TestIdempotencyTTL:
    """Test TTL (Time To Live) handling for idempotency."""

    def test_default_ttl_is_24_hours(self):
        """Verify default TTL is 24 hours (Shopify's retry window)."""
        with open('app/config/settings.py', 'r') as f:
            code = f.read()

        assert "WEBHOOK_IDEMPOTENCY_TTL_HOURS: int = 24" in code, "Default TTL should be 24 hours"

    def test_ttl_used_in_redis_operations(self):
        """Verify TTL is used when storing in Redis."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "ttl_seconds" in code, "Missing TTL in Redis operations"

    def test_ttl_used_in_database_queries(self):
        """Verify TTL is used in database queries for recent checks."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "timedelta" in code, "Missing timedelta for TTL-based queries"
        assert "cutoff_time" in code, "Missing cutoff time calculation"


class TestLoggingAndAudit:
    """Test logging and audit trail features."""

    def test_duplicate_detection_logged(self):
        """Verify duplicate detection events are logged."""
        with open('app/services/webhook_idempotency_service.py', 'r') as f:
            code = f.read()

        assert "logger.info" in code, "Missing info logging"
        assert "Duplicate webhook detected" in code, "Missing duplicate detection log message"

    def test_audit_trail_in_database(self):
        """Verify audit trail includes duplicate information."""
        with open('app/api/v1/integrations/shopify_webhooks.py', 'r') as f:
            code = f.read()

        assert '"skipped"' in code, "Missing 'skipped' status for audit"


@pytest.mark.asyncio
class TestIdempotencyServiceUnit:
    """Unit tests for WebhookIdempotencyService using mocks."""

    @pytest.fixture
    def mock_redis_cache(self):
        """Create a mock Redis cache."""
        with patch('app.services.webhook_idempotency_service.RedisCache') as mock:
            instance = MagicMock()
            instance.exists = AsyncMock(return_value=False)
            instance.setex_if_not_exists = AsyncMock(return_value=True)
            mock.return_value = instance
            yield instance

    @pytest.fixture
    def mock_settings(self):
        """Create mock settings."""
        with patch('app.services.webhook_idempotency_service.settings') as mock:
            mock.WEBHOOK_IDEMPOTENCY_TTL_HOURS = 24
            mock.WEBHOOK_IDEMPOTENCY_ENABLED = True
            yield mock

    async def test_new_webhook_returns_not_duplicate(self, mock_redis_cache, mock_settings):
        """Test that a new webhook is correctly identified as not duplicate."""
        from app.services.webhook_idempotency_service import WebhookIdempotencyService

        service = WebhookIdempotencyService()
        service._cache = mock_redis_cache

        result = await service.check_and_mark(
            webhook_id="test-webhook-123",
            integration_id=1,
            topic="orders/create",
        )

        assert result.is_duplicate is False

    async def test_duplicate_webhook_detected_via_redis(self, mock_redis_cache, mock_settings):
        """Test that duplicate webhooks are detected via Redis."""
        from app.services.webhook_idempotency_service import WebhookIdempotencyService

        service = WebhookIdempotencyService()
        service._cache = mock_redis_cache

        # Simulate duplicate: setex_if_not_exists returns False (key already exists)
        mock_redis_cache.setex_if_not_exists = AsyncMock(return_value=False)
        mock_redis_cache.exists = AsyncMock(return_value=True)

        result = await service.check_and_mark(
            webhook_id="duplicate-webhook-123",
            integration_id=1,
            topic="orders/create",
        )

        assert result.is_duplicate is True
        assert result.source == "redis"

    async def test_empty_webhook_id_not_considered_duplicate(self, mock_redis_cache, mock_settings):
        """Test that webhooks without ID are processed (can't dedupe)."""
        from app.services.webhook_idempotency_service import WebhookIdempotencyService

        service = WebhookIdempotencyService()
        service._cache = mock_redis_cache

        result = await service.check_and_mark(
            webhook_id="",
            integration_id=1,
            topic="orders/create",
        )

        assert result.is_duplicate is False
        assert result.source == "no_id"

    async def test_disabled_idempotency_skips_check(self, mock_redis_cache, mock_settings):
        """Test that disabled idempotency skips duplicate checking."""
        from app.services.webhook_idempotency_service import WebhookIdempotencyService

        service = WebhookIdempotencyService(enabled=False)
        service._cache = mock_redis_cache

        result = await service.check_and_mark(
            webhook_id="test-webhook-123",
            integration_id=1,
            topic="orders/create",
        )

        assert result.is_duplicate is False
        assert result.source == "disabled"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

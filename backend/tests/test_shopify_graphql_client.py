"""
Tests for Shopify GraphQL Client.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.integrations.shopify.graphql_client import (
    ShopifyGraphQLClient,
    ShopifyConfig,
    ThrottleStatus,
    QueryResult,
    get_shopify_client_from_settings,
)
from app.integrations.shopify.exceptions import (
    ShopifyAuthenticationError,
    ShopifyRateLimitError,
    ShopifyGraphQLError,
    ShopifyNetworkError,
    ShopifyConfigurationError,
)


class TestShopifyConfig:
    """Tests for ShopifyConfig class."""

    def test_valid_config(self):
        """Test creating valid configuration."""
        config = ShopifyConfig(
            shop_domain="test-store.myshopify.com",
            access_token="shpat_test_token",
        )
        assert config.shop_domain == "test-store.myshopify.com"
        assert config.access_token == "shpat_test_token"
        assert config.api_version == "2025-01"
        assert config.timeout == 30
        assert config.max_retries == 3

    def test_config_normalizes_domain_with_https(self):
        """Test domain normalization removes https://"""
        config = ShopifyConfig(
            shop_domain="https://test-store.myshopify.com",
            access_token="token",
        )
        assert config.shop_domain == "test-store.myshopify.com"

    def test_config_normalizes_domain_with_http(self):
        """Test domain normalization removes http://"""
        config = ShopifyConfig(
            shop_domain="http://test-store.myshopify.com",
            access_token="token",
        )
        assert config.shop_domain == "test-store.myshopify.com"

    def test_config_normalizes_domain_trailing_slash(self):
        """Test domain normalization removes trailing slash."""
        config = ShopifyConfig(
            shop_domain="test-store.myshopify.com/",
            access_token="token",
        )
        assert config.shop_domain == "test-store.myshopify.com"

    def test_graphql_endpoint_property(self):
        """Test GraphQL endpoint URL construction."""
        config = ShopifyConfig(
            shop_domain="test-store.myshopify.com",
            access_token="token",
            api_version="2025-01",
        )
        assert config.graphql_endpoint == (
            "https://test-store.myshopify.com/admin/api/2025-01/graphql.json"
        )

    def test_config_missing_shop_domain(self):
        """Test configuration error with missing shop domain."""
        with pytest.raises(ShopifyConfigurationError) as exc_info:
            ShopifyConfig(shop_domain="", access_token="token")
        assert "shop_domain" in exc_info.value.missing_config

    def test_config_missing_access_token(self):
        """Test configuration error with missing access token."""
        with pytest.raises(ShopifyConfigurationError) as exc_info:
            ShopifyConfig(shop_domain="store.myshopify.com", access_token="")
        assert "access_token" in exc_info.value.missing_config


class TestThrottleStatus:
    """Tests for ThrottleStatus class."""

    def test_default_values(self):
        """Test default throttle status values."""
        status = ThrottleStatus()
        assert status.maximum_available == 1000.0
        assert status.currently_available == 1000.0
        assert status.restore_rate == 50.0

    def test_can_execute_with_capacity(self):
        """Test can_execute returns True when capacity available."""
        status = ThrottleStatus(currently_available=100)
        assert status.can_execute(50) is True

    def test_can_execute_without_capacity(self):
        """Test can_execute returns False when capacity insufficient."""
        status = ThrottleStatus(currently_available=50)
        # With 20% buffer, need 60 points for 50 cost query
        assert status.can_execute(50, buffer_ratio=0.2) is False

    def test_wait_time_calculation(self):
        """Test wait time calculation for capacity restoration."""
        status = ThrottleStatus(currently_available=50, restore_rate=50.0)
        # Need 100, have 50, restore at 50/s = 1s wait
        wait_time = status.wait_time_for_capacity(100)
        assert wait_time == 1.0

    def test_wait_time_when_sufficient_capacity(self):
        """Test no wait time when capacity is sufficient."""
        status = ThrottleStatus(currently_available=200)
        assert status.wait_time_for_capacity(100) == 0.0

    def test_update_from_response(self):
        """Test updating throttle status from API response."""
        status = ThrottleStatus()
        extensions = {
            "cost": {
                "throttleStatus": {
                    "maximumAvailable": 2000,
                    "currentlyAvailable": 1500,
                    "restoreRate": 100.0,
                }
            }
        }
        status.update_from_response(extensions)
        assert status.maximum_available == 2000
        assert status.currently_available == 1500
        assert status.restore_rate == 100.0


class TestQueryResult:
    """Tests for QueryResult class."""

    def test_successful_result(self):
        """Test successful query result."""
        result = QueryResult(
            data={"shop": {"name": "Test Store"}},
            has_errors=False,
        )
        assert result.is_success is True
        assert result.data == {"shop": {"name": "Test Store"}}

    def test_failed_result(self):
        """Test failed query result."""
        result = QueryResult(
            data=None,
            errors=[{"message": "Error"}],
            has_errors=True,
        )
        assert result.is_success is False

    def test_result_with_data_but_errors(self):
        """Test result with both data and errors."""
        result = QueryResult(
            data={"partial": "data"},
            errors=[{"message": "Warning"}],
            has_errors=True,
        )
        assert result.is_success is False


class TestShopifyGraphQLClient:
    """Tests for ShopifyGraphQLClient class."""

    @pytest.fixture
    def config(self):
        """Create test configuration."""
        return ShopifyConfig(
            shop_domain="test-store.myshopify.com",
            access_token="shpat_test_token",
            api_version="2025-01",
            max_retries=2,
        )

    @pytest.fixture
    def client(self, config):
        """Create test client."""
        return ShopifyGraphQLClient(config)

    @pytest.fixture
    def mock_response(self):
        """Create mock successful response."""
        response = MagicMock(spec=httpx.Response)
        response.status_code = 200
        response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {
                "cost": {
                    "requestedQueryCost": 5,
                    "throttleStatus": {
                        "maximumAvailable": 1000,
                        "currentlyAvailable": 995,
                        "restoreRate": 50.0,
                    }
                }
            }
        }
        return response

    @pytest.mark.asyncio
    async def test_context_manager(self, client):
        """Test async context manager."""
        async with client as c:
            assert c._client is not None
        assert client._client is None

    @pytest.mark.asyncio
    async def test_execute_successful_query(self, client, mock_response):
        """Test successful query execution."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_response

            async with client:
                result = await client.execute("query { shop { name } }")

            assert result.is_success
            assert result.data == {"shop": {"name": "Test Store"}}

    @pytest.mark.asyncio
    async def test_execute_with_variables(self, client, mock_response):
        """Test query execution with variables."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_response

            async with client:
                await client.execute(
                    "query($first: Int!) { products(first: $first) { edges { node { id } } } }",
                    variables={"first": 10},
                )

            # Verify variables were included in request
            call_kwargs = mock_post.call_args[1]
            assert call_kwargs["json"]["variables"] == {"first": 10}

    @pytest.mark.asyncio
    async def test_authentication_error(self, client):
        """Test authentication error handling."""
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 401

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_response

            async with client:
                with pytest.raises(ShopifyAuthenticationError) as exc_info:
                    await client.execute("query { shop { name } }")

            assert exc_info.value.code == "SHOPIFY_AUTH_ERROR"

    @pytest.mark.asyncio
    async def test_rate_limit_error_with_retry(self, client):
        """Test rate limit error triggers retry."""
        # First call returns rate limit, second succeeds
        rate_limit_response = MagicMock(spec=httpx.Response)
        rate_limit_response.status_code = 429
        rate_limit_response.headers = {"Retry-After": "0.1"}

        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = [rate_limit_response, success_response]

            async with client:
                result = await client.execute("query { shop { name } }")

            assert result.is_success
            assert mock_post.call_count == 2

    @pytest.mark.asyncio
    async def test_rate_limit_exhausted_retries(self, client):
        """Test rate limit error after exhausting retries."""
        rate_limit_response = MagicMock(spec=httpx.Response)
        rate_limit_response.status_code = 429
        rate_limit_response.headers = {"Retry-After": "0.1"}

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = rate_limit_response

            async with client:
                with pytest.raises(ShopifyRateLimitError):
                    await client.execute("query { shop { name } }")

            # max_retries is 2, so 3 total attempts (initial + 2 retries)
            assert mock_post.call_count == 3

    @pytest.mark.asyncio
    async def test_graphql_error_handling(self, client):
        """Test GraphQL error handling."""
        error_response = MagicMock(spec=httpx.Response)
        error_response.status_code = 200
        error_response.json.return_value = {
            "errors": [
                {
                    "message": "Field 'invalid' doesn't exist",
                    "extensions": {"code": "FIELD_NOT_FOUND"},
                }
            ],
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = error_response

            async with client:
                with pytest.raises(ShopifyGraphQLError) as exc_info:
                    await client.execute("query { shop { invalid } }")

            assert "invalid" in exc_info.value.message.lower() or "Field" in exc_info.value.message

    @pytest.mark.asyncio
    async def test_network_error_with_retry(self, client):
        """Test network error triggers retry."""
        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            # First call raises network error, second succeeds
            mock_post.side_effect = [
                httpx.RequestError("Connection failed"),
                success_response,
            ]

            async with client:
                result = await client.execute("query { shop { name } }")

            assert result.is_success
            assert mock_post.call_count == 2

    @pytest.mark.asyncio
    async def test_timeout_error_with_retry(self, client):
        """Test timeout error triggers retry."""
        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = [
                httpx.TimeoutException("Timeout"),
                success_response,
            ]

            async with client:
                result = await client.execute("query { shop { name } }")

            assert result.is_success

    @pytest.mark.asyncio
    async def test_throttle_status_updated(self, client, mock_response):
        """Test throttle status is updated from response."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_response

            async with client:
                await client.execute("query { shop { name } }")

                assert client.throttle_status.currently_available == 995

    @pytest.mark.asyncio
    async def test_get_shop_info(self, client, mock_response):
        """Test get_shop_info helper method."""
        mock_response.json.return_value = {
            "data": {
                "shop": {
                    "id": "gid://shopify/Shop/12345",
                    "name": "Test Store",
                }
            },
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_response

            async with client:
                result = await client.get_shop_info()

            assert result.is_success
            assert result.data["shop"]["name"] == "Test Store"

    @pytest.mark.asyncio
    async def test_health_check_success(self, client, mock_response):
        """Test health check returns True on success."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_response

            async with client:
                is_healthy = await client.health_check()

            assert is_healthy is True

    @pytest.mark.asyncio
    async def test_health_check_failure(self, client):
        """Test health check returns False on error."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = httpx.RequestError("Connection failed")

            async with client:
                # Override max_retries to speed up test
                client.config.max_retries = 0
                is_healthy = await client.health_check()

            assert is_healthy is False

    def test_estimate_query_cost(self, client):
        """Test query cost estimation."""
        # Simple query
        simple_query = "query { shop { name } }"
        simple_cost = client._estimate_query_cost(simple_query)
        assert simple_cost >= 1

        # Complex query with pagination
        complex_query = """
            query($first: Int!, $after: String) {
                products(first: $first, after: $after) {
                    edges {
                        node {
                            id
                            title
                            variants(first: 10) {
                                edges {
                                    node { id }
                                }
                            }
                        }
                    }
                }
            }
        """
        complex_cost = client._estimate_query_cost(complex_query)
        assert complex_cost > simple_cost

    def test_get_nested_value(self, client):
        """Test nested value extraction."""
        data = {
            "shop": {
                "products": {
                    "pageInfo": {
                        "hasNextPage": True,
                        "endCursor": "abc123",
                    }
                }
            }
        }

        # Valid path
        assert client._get_nested_value(data, "shop.products.pageInfo.hasNextPage") is True
        assert client._get_nested_value(data, "shop.products.pageInfo.endCursor") == "abc123"

        # Invalid path
        assert client._get_nested_value(data, "shop.invalid.path") is None


class TestExecuteQuery:
    """Tests for the execute_query method with retry and rate limiting."""

    @pytest.fixture
    def config(self):
        """Create test configuration with fast retries for testing."""
        return ShopifyConfig(
            shop_domain="test-store.myshopify.com",
            access_token="shpat_test_token",
            api_version="2025-01",
            max_retries=3,
            retry_base_delay=0.01,  # Fast retries for testing
            retry_max_delay=0.1,
            retry_jitter=False,  # Disable jitter for predictable tests
        )

    @pytest.fixture
    def client(self, config):
        """Create test client."""
        return ShopifyGraphQLClient(config)

    @pytest.fixture
    def mock_success_response(self):
        """Create mock successful response."""
        response = MagicMock(spec=httpx.Response)
        response.status_code = 200
        response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {
                "cost": {
                    "requestedQueryCost": 5,
                    "actualQueryCost": 4,
                    "throttleStatus": {
                        "maximumAvailable": 1000,
                        "currentlyAvailable": 995,
                        "restoreRate": 50.0,
                    }
                }
            }
        }
        return response

    @pytest.mark.asyncio
    async def test_execute_query_success(self, client, mock_success_response):
        """Test successful query execution with execute_query."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_success_response

            async with client:
                result = await client.execute_query("query { shop { name } }")

            assert result.is_success
            assert result.data == {"shop": {"name": "Test Store"}}
            assert client._successful_queries == 1
            assert client._failed_queries == 0

    @pytest.mark.asyncio
    async def test_execute_query_with_variables(self, client, mock_success_response):
        """Test execute_query with variables."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_success_response

            async with client:
                await client.execute_query(
                    "query GetProducts($first: Int!) { products(first: $first) { edges { node { id } } } }",
                    variables={"first": 10},
                    operation_name="GetProducts",
                )

            call_kwargs = mock_post.call_args[1]
            assert call_kwargs["json"]["variables"] == {"first": 10}
            assert call_kwargs["json"]["operationName"] == "GetProducts"

    @pytest.mark.asyncio
    async def test_execute_query_retry_on_rate_limit(self, client):
        """Test execute_query retries on rate limit."""
        rate_limit_response = MagicMock(spec=httpx.Response)
        rate_limit_response.status_code = 429
        rate_limit_response.headers = {"Retry-After": "0.01"}

        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {
                "cost": {
                    "throttleStatus": {
                        "maximumAvailable": 1000,
                        "currentlyAvailable": 900,
                        "restoreRate": 50.0,
                    }
                }
            },
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = [rate_limit_response, success_response]

            async with client:
                result = await client.execute_query("query { shop { name } }")

            assert result.is_success
            assert mock_post.call_count == 2
            assert client._total_retries == 1

    @pytest.mark.asyncio
    async def test_execute_query_retry_on_network_error(self, client):
        """Test execute_query retries on network error."""
        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = [
                httpx.RequestError("Connection failed"),
                success_response,
            ]

            async with client:
                result = await client.execute_query("query { shop { name } }")

            assert result.is_success
            assert mock_post.call_count == 2
            assert client._total_retries == 1

    @pytest.mark.asyncio
    async def test_execute_query_retry_on_timeout(self, client):
        """Test execute_query retries on timeout."""
        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = [
                httpx.TimeoutException("Timeout"),
                success_response,
            ]

            async with client:
                result = await client.execute_query("query { shop { name } }")

            assert result.is_success
            assert mock_post.call_count == 2

    @pytest.mark.asyncio
    async def test_execute_query_no_retry_on_auth_error(self, client):
        """Test execute_query does not retry on authentication error."""
        auth_error_response = MagicMock(spec=httpx.Response)
        auth_error_response.status_code = 401

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = auth_error_response

            async with client:
                with pytest.raises(ShopifyAuthenticationError):
                    await client.execute_query("query { shop { name } }")

            # Should only be called once (no retries)
            assert mock_post.call_count == 1
            assert client._failed_queries == 1

    @pytest.mark.asyncio
    async def test_execute_query_no_retry_on_graphql_error(self, client):
        """Test execute_query does not retry on non-throttle GraphQL errors."""
        graphql_error_response = MagicMock(spec=httpx.Response)
        graphql_error_response.status_code = 200
        graphql_error_response.json.return_value = {
            "errors": [
                {
                    "message": "Field 'invalid' doesn't exist",
                    "extensions": {"code": "FIELD_NOT_FOUND"},
                }
            ],
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = graphql_error_response

            async with client:
                with pytest.raises(ShopifyGraphQLError):
                    await client.execute_query("query { shop { invalid } }")

            # Should only be called once (no retries)
            assert mock_post.call_count == 1

    @pytest.mark.asyncio
    async def test_execute_query_exhausts_retries(self, client):
        """Test execute_query raises after exhausting retries."""
        rate_limit_response = MagicMock(spec=httpx.Response)
        rate_limit_response.status_code = 429
        rate_limit_response.headers = {"Retry-After": "0.01"}

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = rate_limit_response

            async with client:
                with pytest.raises(ShopifyRateLimitError):
                    await client.execute_query("query { shop { name } }")

            # max_retries is 3, so 3 total attempts
            assert mock_post.call_count == 3
            assert client._failed_queries == 1

    @pytest.mark.asyncio
    async def test_execute_query_on_retry_callback(self, client):
        """Test execute_query calls on_retry callback."""
        rate_limit_response = MagicMock(spec=httpx.Response)
        rate_limit_response.status_code = 429
        rate_limit_response.headers = {"Retry-After": "0.01"}

        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {},
        }

        retry_calls = []

        async def on_retry(exc, attempt, delay):
            retry_calls.append({"exception": exc, "attempt": attempt, "delay": delay})

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = [rate_limit_response, success_response]

            async with client:
                await client.execute_query(
                    "query { shop { name } }",
                    on_retry=on_retry,
                )

        assert len(retry_calls) == 1
        assert retry_calls[0]["attempt"] == 0
        assert isinstance(retry_calls[0]["exception"], ShopifyRateLimitError)

    @pytest.mark.asyncio
    async def test_execute_query_with_estimated_cost(self, client, mock_success_response):
        """Test execute_query with pre-calculated estimated cost."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_success_response

            async with client:
                await client.execute_query(
                    "query { shop { name } }",
                    estimated_cost=100,
                )

            # Rate limiter should have used the estimated cost
            # (We can't directly verify this, but the query should succeed)
            assert mock_post.call_count == 1

    @pytest.mark.asyncio
    async def test_execute_query_updates_rate_limiter(self, client):
        """Test execute_query updates rate limiter from response."""
        response = MagicMock(spec=httpx.Response)
        response.status_code = 200
        response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {
                "cost": {
                    "requestedQueryCost": 10,
                    "actualQueryCost": 8,
                    "throttleStatus": {
                        "maximumAvailable": 2000,
                        "currentlyAvailable": 1800,
                        "restoreRate": 100.0,
                    }
                }
            },
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = response

            async with client:
                await client.execute_query("query { shop { name } }")

                # Check throttle status was updated
                assert client.throttle_status.currently_available == 1800
                assert client.throttle_status.maximum_available == 2000

    @pytest.mark.asyncio
    async def test_execute_query_stats(self, client, mock_success_response):
        """Test execute_query updates stats correctly."""
        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.return_value = mock_success_response

            async with client:
                # Execute a few queries
                await client.execute_query("query { shop { name } }")
                await client.execute_query("query { shop { name } }")

                stats = client.stats

        assert stats["total_queries"] == 2
        assert stats["successful_queries"] == 2
        assert stats["failed_queries"] == 0
        assert stats["success_rate"] == 1.0
        assert "rate_limiter" in stats
        assert "throttle_status" in stats

    @pytest.mark.asyncio
    async def test_execute_query_graphql_throttle_error_retries(self, client):
        """Test execute_query retries on GraphQL THROTTLED error."""
        throttle_response = MagicMock(spec=httpx.Response)
        throttle_response.status_code = 200
        throttle_response.json.return_value = {
            "errors": [
                {
                    "message": "Throttled",
                    "extensions": {"code": "THROTTLED"},
                }
            ],
            "extensions": {
                "cost": {
                    "throttleStatus": {
                        "maximumAvailable": 1000,
                        "currentlyAvailable": 0,
                        "restoreRate": 50.0,
                    }
                }
            },
        }

        success_response = MagicMock(spec=httpx.Response)
        success_response.status_code = 200
        success_response.json.return_value = {
            "data": {"shop": {"name": "Test Store"}},
            "extensions": {},
        }

        with patch.object(
            httpx.AsyncClient, "post", new_callable=AsyncMock
        ) as mock_post:
            mock_post.side_effect = [throttle_response, success_response]

            async with client:
                result = await client.execute_query("query { shop { name } }")

            assert result.is_success
            assert mock_post.call_count == 2


class TestGetShopifyClientFromSettings:
    """Tests for get_shopify_client_from_settings factory function."""

    def test_creates_client_with_valid_settings(self):
        """Test client creation with valid settings."""
        mock_settings = MagicMock()
        mock_settings.SHOPIFY_SHOP_DOMAIN = "test-store.myshopify.com"
        mock_settings.SHOPIFY_ACCESS_TOKEN = "shpat_test_token"
        mock_settings.SHOPIFY_API_VERSION = "2025-01"
        mock_settings.SHOPIFY_REQUEST_TIMEOUT = 30
        mock_settings.SHOPIFY_MAX_RETRIES = 3
        mock_settings.SHOPIFY_RATE_LIMIT_BUFFER = 0.2

        with patch(
            "app.config.settings.get_settings",
            return_value=mock_settings,
        ):
            client = get_shopify_client_from_settings()

        assert isinstance(client, ShopifyGraphQLClient)
        assert client.config.shop_domain == "test-store.myshopify.com"

    def test_raises_error_with_missing_domain(self):
        """Test error raised when shop domain is missing."""
        mock_settings = MagicMock()
        mock_settings.SHOPIFY_SHOP_DOMAIN = None
        mock_settings.SHOPIFY_ACCESS_TOKEN = "token"

        with patch(
            "app.config.settings.get_settings",
            return_value=mock_settings,
        ):
            with pytest.raises(ShopifyConfigurationError) as exc_info:
                get_shopify_client_from_settings()

        assert "SHOPIFY_SHOP_DOMAIN" in exc_info.value.missing_config

    def test_raises_error_with_missing_token(self):
        """Test error raised when access token is missing."""
        mock_settings = MagicMock()
        mock_settings.SHOPIFY_SHOP_DOMAIN = "store.myshopify.com"
        mock_settings.SHOPIFY_ACCESS_TOKEN = None

        with patch(
            "app.config.settings.get_settings",
            return_value=mock_settings,
        ):
            with pytest.raises(ShopifyConfigurationError) as exc_info:
                get_shopify_client_from_settings()

        assert "SHOPIFY_ACCESS_TOKEN" in exc_info.value.missing_config

"""
Shopify GraphQL Admin API Client.

Provides async client for interacting with Shopify's GraphQL Admin API
with built-in rate limiting, retry logic, and comprehensive error handling.

Features:
- execute_query(): Main query method with integrated retry + rate limiting
- Adaptive rate limiting using token bucket algorithm
- Exponential backoff retry with configurable parameters
- Comprehensive error handling and logging
- Connection pooling via httpx
"""
import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List, TypeVar, Generic, Callable, Awaitable

import httpx

from app.integrations.shopify.exceptions import (
    ShopifyError,
    ShopifyAuthenticationError,
    ShopifyRateLimitError,
    ShopifyGraphQLError,
    ShopifyNetworkError,
    ShopifyConfigurationError,
)
from app.utils.rate_limiter import AdaptiveRateLimiter
from app.utils.retry import RetryConfig, calculate_delay

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class ShopifyConfig:
    """Configuration for Shopify GraphQL client."""

    shop_domain: str
    access_token: str
    api_version: str = "2025-01"
    timeout: int = 30
    max_retries: int = 3
    rate_limit_buffer: float = 0.2  # Keep 20% buffer for rate limiting
    max_cost_per_request: int = 1000  # Shopify's default max query cost

    # Retry configuration
    retry_base_delay: float = 1.0  # Base delay between retries in seconds
    retry_max_delay: float = 60.0  # Maximum delay between retries
    retry_exponential_base: float = 2.0  # Exponential backoff multiplier
    retry_jitter: bool = True  # Add jitter to prevent thundering herd

    # Rate limiting configuration
    rate_limit_max_points: float = 1000.0  # Shopify's default bucket size
    rate_limit_restore_rate: float = 50.0  # Points restored per second

    def __post_init__(self):
        """Validate configuration after initialization."""
        if not self.shop_domain:
            raise ShopifyConfigurationError(
                "Shopify shop domain is required",
                missing_config=["shop_domain"],
            )
        if not self.access_token:
            raise ShopifyConfigurationError(
                "Shopify access token is required",
                missing_config=["access_token"],
            )

        # Normalize shop domain (remove protocol if present)
        if self.shop_domain.startswith("https://"):
            self.shop_domain = self.shop_domain[8:]
        elif self.shop_domain.startswith("http://"):
            self.shop_domain = self.shop_domain[7:]

        # Remove trailing slash
        self.shop_domain = self.shop_domain.rstrip("/")

    @property
    def graphql_endpoint(self) -> str:
        """Get the GraphQL endpoint URL."""
        return f"https://{self.shop_domain}/admin/api/{self.api_version}/graphql.json"

    def get_retry_config(self) -> RetryConfig:
        """Create RetryConfig from this configuration."""
        return RetryConfig(
            max_attempts=self.max_retries,
            base_delay=self.retry_base_delay,
            max_delay=self.retry_max_delay,
            exponential_base=self.retry_exponential_base,
            jitter=self.retry_jitter,
        )


@dataclass
class ThrottleStatus:
    """Tracks Shopify API throttle status."""

    maximum_available: float = 1000.0
    currently_available: float = 1000.0
    restore_rate: float = 50.0  # Points restored per second

    def can_execute(self, estimated_cost: float, buffer_ratio: float = 0.2) -> bool:
        """Check if we have enough capacity to execute a query."""
        required = estimated_cost * (1 + buffer_ratio)
        return self.currently_available >= required

    def wait_time_for_capacity(self, required_cost: float) -> float:
        """Calculate wait time needed to restore required capacity."""
        if self.currently_available >= required_cost:
            return 0.0
        deficit = required_cost - self.currently_available
        return deficit / self.restore_rate

    def update_from_response(self, extensions: Dict[str, Any]) -> None:
        """Update throttle status from API response extensions."""
        cost_info = extensions.get("cost", {})
        throttle_status = cost_info.get("throttleStatus", {})

        if throttle_status:
            self.maximum_available = float(
                throttle_status.get("maximumAvailable", self.maximum_available)
            )
            self.currently_available = float(
                throttle_status.get("currentlyAvailable", self.currently_available)
            )
            self.restore_rate = float(
                throttle_status.get("restoreRate", self.restore_rate)
            )


@dataclass
class QueryResult(Generic[T]):
    """Result container for GraphQL query execution."""

    data: Optional[T] = None
    errors: List[Dict[str, Any]] = field(default_factory=list)
    extensions: Dict[str, Any] = field(default_factory=dict)
    cost_info: Optional[Dict[str, Any]] = None
    has_errors: bool = False

    @property
    def is_success(self) -> bool:
        """Check if query executed successfully."""
        return not self.has_errors and self.data is not None


class ShopifyGraphQLClient:
    """
    Async client for Shopify GraphQL Admin API.

    Features:
    - execute_query(): Primary method with integrated retry + rate limiting
    - Automatic rate limiting with adaptive throttle tracking
    - Exponential backoff retry logic with jitter
    - Comprehensive error handling and logging
    - Connection pooling via httpx
    - Query cost estimation support

    Example usage:
        config = ShopifyConfig(
            shop_domain="mystore.myshopify.com",
            access_token="shpat_xxxxx",
        )
        async with ShopifyGraphQLClient(config) as client:
            # Primary method with full retry + rate limiting
            result = await client.execute_query('''
                query {
                    shop {
                        name
                        primaryDomain { url }
                    }
                }
            ''')
            print(result.data)
    """

    def __init__(self, config: ShopifyConfig):
        """
        Initialize the Shopify GraphQL client.

        Args:
            config: ShopifyConfig instance with connection settings
        """
        self.config = config
        self._client: Optional[httpx.AsyncClient] = None
        self._throttle_status = ThrottleStatus()
        self._last_request_time: Optional[datetime] = None

        # Initialize adaptive rate limiter
        self._rate_limiter = AdaptiveRateLimiter(
            max_points=config.rate_limit_max_points,
            restore_rate=config.rate_limit_restore_rate,
            buffer_ratio=config.rate_limit_buffer,
            min_points_threshold=50.0,
            backoff_multiplier=config.retry_exponential_base,
            max_backoff_seconds=config.retry_max_delay,
        )

        # Track retry statistics
        self._total_queries = 0
        self._successful_queries = 0
        self._failed_queries = 0
        self._total_retries = 0

    async def __aenter__(self) -> "ShopifyGraphQLClient":
        """Async context manager entry."""
        await self._ensure_client()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_client(self) -> None:
        """Ensure HTTP client is initialized."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                headers={
                    "Content-Type": "application/json",
                    "X-Shopify-Access-Token": self.config.access_token,
                },
                timeout=httpx.Timeout(self.config.timeout),
                limits=httpx.Limits(
                    max_keepalive_connections=10,
                    max_connections=20,
                ),
            )
            logger.debug(
                f"Initialized Shopify GraphQL client for {self.config.shop_domain}"
            )

    async def close(self) -> None:
        """Close the HTTP client and release resources."""
        if self._client is not None:
            await self._client.aclose()
            self._client = None
            logger.debug("Closed Shopify GraphQL client")

    def _estimate_query_cost(self, query: str) -> int:
        """
        Estimate query cost based on query complexity.

        This is a simple heuristic. For more accurate costs,
        use Shopify's query cost calculation or the queryCost field.

        Args:
            query: GraphQL query string

        Returns:
            Estimated cost in points
        """
        # Base cost
        cost = 1

        # Count connection fields (typically high cost)
        connection_keywords = [
            "edges", "nodes", "first:", "last:",
            "products(", "orders(", "customers(", "collections(",
        ]
        for keyword in connection_keywords:
            cost += query.lower().count(keyword.lower()) * 10

        # Limit to max cost
        return min(cost, self.config.max_cost_per_request)

    async def _wait_for_capacity(self, estimated_cost: int) -> None:
        """
        Wait if necessary to ensure rate limit capacity.

        Args:
            estimated_cost: Estimated query cost in points
        """
        if not self._throttle_status.can_execute(
            estimated_cost, self.config.rate_limit_buffer
        ):
            wait_time = self._throttle_status.wait_time_for_capacity(
                estimated_cost * (1 + self.config.rate_limit_buffer)
            )
            if wait_time > 0:
                logger.info(
                    f"Rate limit: waiting {wait_time:.2f}s for capacity "
                    f"(need {estimated_cost}, have {self._throttle_status.currently_available:.0f})"
                )
                await asyncio.sleep(wait_time)

    def _handle_graphql_errors(
        self,
        errors: List[Dict[str, Any]],
        query: str,
        variables: Optional[Dict[str, Any]],
    ) -> None:
        """
        Process and raise appropriate exception for GraphQL errors.

        Args:
            errors: List of error objects from response
            query: Original query string
            variables: Query variables
        """
        if not errors:
            return

        # Check for specific error types
        for error in errors:
            extensions = error.get("extensions", {})
            error_code = extensions.get("code", "")

            # Rate limiting / throttling
            if error_code == "THROTTLED" or error_code == "MAX_COST_EXCEEDED":
                raise ShopifyRateLimitError(
                    message=error.get("message", "Rate limit exceeded"),
                    cost_used=extensions.get("cost"),
                    throttle_status=extensions.get("throttleStatus"),
                )

            # Authentication errors
            if error_code in ("ACCESS_DENIED", "UNAUTHORIZED"):
                raise ShopifyAuthenticationError(
                    message=error.get("message", "Authentication failed"),
                    details={"error_code": error_code},
                )

        # Generic GraphQL error
        raise ShopifyGraphQLError.from_response(
            errors=errors,
            query=query,
            variables=variables,
        )

    async def execute(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        operation_name: Optional[str] = None,
        retry_count: int = 0,
    ) -> QueryResult:
        """
        Execute a GraphQL query or mutation.

        Args:
            query: GraphQL query or mutation string
            variables: Optional variables for the query
            operation_name: Optional operation name
            retry_count: Current retry attempt (used internally)

        Returns:
            QueryResult containing data, errors, and metadata

        Raises:
            ShopifyAuthenticationError: If authentication fails
            ShopifyRateLimitError: If rate limit exceeded after retries
            ShopifyGraphQLError: If GraphQL execution fails
            ShopifyNetworkError: If network communication fails
        """
        await self._ensure_client()

        # Estimate cost and wait for capacity
        estimated_cost = self._estimate_query_cost(query)
        await self._wait_for_capacity(estimated_cost)

        # Build request payload
        payload: Dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = variables
        if operation_name:
            payload["operationName"] = operation_name

        try:
            logger.debug(
                f"Executing GraphQL query (estimated cost: {estimated_cost})"
            )

            response = await self._client.post(
                self.config.graphql_endpoint,
                json=payload,
            )

            # Track request time
            self._last_request_time = datetime.utcnow()

            # Handle HTTP errors
            if response.status_code == 401:
                raise ShopifyAuthenticationError(
                    message="Invalid or expired access token",
                    details={"status_code": 401},
                )

            if response.status_code == 429:
                # Explicit rate limit from HTTP
                retry_after = float(response.headers.get("Retry-After", "2.0"))
                raise ShopifyRateLimitError(
                    message="HTTP 429 rate limit exceeded",
                    retry_after=retry_after,
                )

            # Parse response
            try:
                response_data = response.json()
            except Exception as e:
                raise ShopifyNetworkError(
                    message=f"Failed to parse response: {e}",
                    original_error=e,
                    request_url=self.config.graphql_endpoint,
                )

            # Update throttle status from response
            extensions = response_data.get("extensions", {})
            self._throttle_status.update_from_response(extensions)

            # Extract cost info for logging
            cost_info = extensions.get("cost", {})
            if cost_info:
                actual_cost = cost_info.get("requestedQueryCost", estimated_cost)
                available = cost_info.get("throttleStatus", {}).get(
                    "currentlyAvailable", "N/A"
                )
                logger.debug(
                    f"Query cost: {actual_cost}, remaining: {available}"
                )

            # Check for GraphQL errors
            errors = response_data.get("errors", [])
            if errors:
                self._handle_graphql_errors(errors, query, variables)

            return QueryResult(
                data=response_data.get("data"),
                errors=errors,
                extensions=extensions,
                cost_info=cost_info,
                has_errors=bool(errors),
            )

        except ShopifyRateLimitError as e:
            # Retry with exponential backoff
            if retry_count < self.config.max_retries:
                wait_time = e.retry_after or (2 ** retry_count)
                logger.warning(
                    f"Rate limited, retrying in {wait_time:.2f}s "
                    f"(attempt {retry_count + 1}/{self.config.max_retries})"
                )
                await asyncio.sleep(wait_time)
                return await self.execute(
                    query=query,
                    variables=variables,
                    operation_name=operation_name,
                    retry_count=retry_count + 1,
                )
            raise

        except (ShopifyAuthenticationError, ShopifyGraphQLError):
            # Don't retry auth or GraphQL errors
            raise

        except httpx.TimeoutException as e:
            if retry_count < self.config.max_retries:
                wait_time = 2 ** retry_count
                logger.warning(
                    f"Request timeout, retrying in {wait_time}s "
                    f"(attempt {retry_count + 1}/{self.config.max_retries})"
                )
                await asyncio.sleep(wait_time)
                return await self.execute(
                    query=query,
                    variables=variables,
                    operation_name=operation_name,
                    retry_count=retry_count + 1,
                )
            raise ShopifyNetworkError(
                message=f"Request timeout after {self.config.max_retries} retries",
                original_error=e,
                request_url=self.config.graphql_endpoint,
            )

        except httpx.RequestError as e:
            if retry_count < self.config.max_retries:
                wait_time = 2 ** retry_count
                logger.warning(
                    f"Network error, retrying in {wait_time}s "
                    f"(attempt {retry_count + 1}/{self.config.max_retries})"
                )
                await asyncio.sleep(wait_time)
                return await self.execute(
                    query=query,
                    variables=variables,
                    operation_name=operation_name,
                    retry_count=retry_count + 1,
                )
            raise ShopifyNetworkError(
                message=f"Network error: {e}",
                original_error=e,
                request_url=self.config.graphql_endpoint,
            )

    async def execute_query(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        operation_name: Optional[str] = None,
        estimated_cost: Optional[int] = None,
        on_retry: Optional[Callable[[Exception, int, float], Awaitable[None]]] = None,
    ) -> QueryResult:
        """
        Execute a GraphQL query with integrated retry logic and rate limiting.

        This is the primary method for executing queries against the Shopify
        GraphQL API. It provides:

        - Automatic rate limiting using adaptive token bucket algorithm
        - Exponential backoff retry with configurable parameters
        - Jitter to prevent thundering herd problems
        - Detailed logging and statistics tracking
        - Integration with Shopify's cost-based throttling

        Args:
            query: GraphQL query or mutation string
            variables: Optional variables for the query
            operation_name: Optional GraphQL operation name
            estimated_cost: Optional pre-calculated query cost (auto-estimated if not provided)
            on_retry: Optional async callback invoked before each retry (exception, attempt, delay)

        Returns:
            QueryResult containing data, errors, extensions, and cost info

        Raises:
            ShopifyAuthenticationError: If authentication fails (not retried)
            ShopifyRateLimitError: If rate limit exceeded after all retries
            ShopifyGraphQLError: If GraphQL execution fails with non-retryable errors
            ShopifyNetworkError: If network communication fails after all retries

        Example:
            async with ShopifyGraphQLClient(config) as client:
                # Simple query
                result = await client.execute_query('''
                    query GetShop {
                        shop { name }
                    }
                ''')

                # Query with variables
                result = await client.execute_query(
                    '''
                    query GetProduct($id: ID!) {
                        product(id: $id) {
                            title
                            priceRange { minVariantPrice { amount } }
                        }
                    }
                    ''',
                    variables={"id": "gid://shopify/Product/123"},
                )

                # With retry callback
                async def log_retry(exc, attempt, delay):
                    print(f"Retry {attempt}: {exc}, waiting {delay}s")

                result = await client.execute_query(
                    query,
                    on_retry=log_retry,
                )
        """
        await self._ensure_client()
        self._total_queries += 1

        # Calculate or use provided cost estimate
        query_cost = estimated_cost or self._estimate_query_cost(query)

        # Acquire rate limit capacity (waits if necessary)
        async with self._rate_limiter.acquire(cost=query_cost) as rate_ctx:
            if rate_ctx.wait_time > 0:
                logger.info(
                    f"Rate limit: waited {rate_ctx.wait_time:.2f}s before query "
                    f"(cost: {query_cost}, utilization: {self._rate_limiter.utilization:.1%})"
                )

        # Build request payload
        payload: Dict[str, Any] = {"query": query}
        if variables:
            payload["variables"] = variables
        if operation_name:
            payload["operationName"] = operation_name

        # Retry loop with exponential backoff
        last_exception: Optional[Exception] = None
        for attempt in range(self.config.max_retries):
            try:
                logger.debug(
                    f"Executing query (attempt {attempt + 1}/{self.config.max_retries}, "
                    f"cost: {query_cost})"
                )

                response = await self._client.post(
                    self.config.graphql_endpoint,
                    json=payload,
                )

                self._last_request_time = datetime.utcnow()

                # Handle HTTP-level errors
                if response.status_code == 401:
                    self._failed_queries += 1
                    raise ShopifyAuthenticationError(
                        message="Invalid or expired access token",
                        details={"status_code": 401},
                    )

                if response.status_code == 429:
                    retry_after = float(response.headers.get("Retry-After", "2.0"))
                    self._rate_limiter.record_throttle(retry_after)
                    raise ShopifyRateLimitError(
                        message="HTTP 429 rate limit exceeded",
                        retry_after=retry_after,
                    )

                # Parse response
                try:
                    response_data = response.json()
                except Exception as e:
                    raise ShopifyNetworkError(
                        message=f"Failed to parse JSON response: {e}",
                        original_error=e,
                        request_url=self.config.graphql_endpoint,
                    )

                # Update rate limiter from response
                extensions = response_data.get("extensions", {})
                cost_info = extensions.get("cost", {})
                throttle_status = cost_info.get("throttleStatus")

                if throttle_status:
                    self._rate_limiter.update_from_shopify_response(throttle_status)
                    self._throttle_status.update_from_response(extensions)

                # Check for GraphQL errors
                errors = response_data.get("errors", [])
                if errors:
                    # Check if this is a throttle error (retryable)
                    for error in errors:
                        error_code = error.get("extensions", {}).get("code", "")
                        if error_code in ("THROTTLED", "MAX_COST_EXCEEDED"):
                            self._rate_limiter.record_throttle()
                            raise ShopifyRateLimitError(
                                message=error.get("message", "Rate limit exceeded"),
                                cost_used=cost_info.get("requestedQueryCost"),
                                throttle_status=throttle_status,
                            )
                        if error_code in ("ACCESS_DENIED", "UNAUTHORIZED"):
                            self._failed_queries += 1
                            raise ShopifyAuthenticationError(
                                message=error.get("message", "Authentication failed"),
                                details={"error_code": error_code},
                            )

                    # Non-retryable GraphQL errors
                    self._failed_queries += 1
                    raise ShopifyGraphQLError.from_response(
                        errors=errors,
                        query=query,
                        variables=variables,
                    )

                # Success!
                self._successful_queries += 1
                self._rate_limiter.record_success()

                if cost_info:
                    actual_cost = cost_info.get("requestedQueryCost", query_cost)
                    available = throttle_status.get("currentlyAvailable", "N/A") if throttle_status else "N/A"
                    logger.debug(f"Query succeeded: cost={actual_cost}, remaining={available}")

                return QueryResult(
                    data=response_data.get("data"),
                    errors=errors,
                    extensions=extensions,
                    cost_info=cost_info,
                    has_errors=bool(errors),
                )

            except ShopifyAuthenticationError:
                # Auth errors are not retried
                raise

            except ShopifyGraphQLError as e:
                # Only retry throttle errors, others are raised immediately
                if not any(code in ("THROTTLED", "MAX_COST_EXCEEDED") for code in getattr(e, "error_codes", [])):
                    raise
                last_exception = e

            except ShopifyRateLimitError as e:
                last_exception = e

            except (httpx.TimeoutException, httpx.RequestError) as e:
                last_exception = ShopifyNetworkError(
                    message=f"Network error: {e}",
                    original_error=e,
                    request_url=self.config.graphql_endpoint,
                )

            # Calculate delay for retry
            if attempt < self.config.max_retries - 1:
                delay = calculate_delay(
                    attempt=attempt,
                    base_delay=self.config.retry_base_delay,
                    max_delay=self.config.retry_max_delay,
                    exponential_base=self.config.retry_exponential_base,
                    jitter=self.config.retry_jitter,
                )

                # Use retry_after from rate limit error if available
                if isinstance(last_exception, ShopifyRateLimitError) and last_exception.retry_after:
                    delay = max(delay, last_exception.retry_after)

                self._total_retries += 1

                logger.warning(
                    f"Query failed (attempt {attempt + 1}/{self.config.max_retries}): "
                    f"{last_exception}. Retrying in {delay:.2f}s..."
                )

                # Call optional retry callback
                if on_retry:
                    await on_retry(last_exception, attempt, delay)

                await asyncio.sleep(delay)

        # All retries exhausted
        self._failed_queries += 1
        if last_exception:
            logger.error(
                f"Query failed after {self.config.max_retries} attempts: {last_exception}"
            )
            raise last_exception

        # Should not reach here
        raise ShopifyNetworkError(
            message=f"Query failed after {self.config.max_retries} attempts",
            request_url=self.config.graphql_endpoint,
        )

    @property
    def stats(self) -> Dict[str, Any]:
        """
        Get client statistics including query counts and rate limiter stats.

        Returns:
            Dictionary with query statistics and rate limiter status
        """
        return {
            "total_queries": self._total_queries,
            "successful_queries": self._successful_queries,
            "failed_queries": self._failed_queries,
            "total_retries": self._total_retries,
            "success_rate": (
                self._successful_queries / self._total_queries
                if self._total_queries > 0
                else 0.0
            ),
            "rate_limiter": self._rate_limiter.stats,
            "throttle_status": {
                "currently_available": self._throttle_status.currently_available,
                "maximum_available": self._throttle_status.maximum_available,
                "restore_rate": self._throttle_status.restore_rate,
            },
        }

    async def execute_with_pagination(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        page_size: int = 50,
        max_pages: Optional[int] = None,
        cursor_path: str = "pageInfo.endCursor",
        has_next_path: str = "pageInfo.hasNextPage",
        data_path: str = "edges",
    ) -> List[Dict[str, Any]]:
        """
        Execute a paginated GraphQL query and collect all results.

        Args:
            query: GraphQL query with pagination support ($first, $after)
            variables: Base variables (will add 'first' and 'after')
            page_size: Number of items per page
            max_pages: Maximum pages to fetch (None for all)
            cursor_path: Dot-notation path to endCursor in response
            has_next_path: Dot-notation path to hasNextPage in response
            data_path: Dot-notation path to data array in response

        Returns:
            List of all collected items across pages
        """
        all_items: List[Dict[str, Any]] = []
        page_count = 0
        cursor: Optional[str] = None

        while True:
            # Set pagination variables
            page_vars = {**(variables or {}), "first": page_size}
            if cursor:
                page_vars["after"] = cursor

            result = await self.execute_query(query, variables=page_vars)

            if not result.is_success or not result.data:
                break

            # Extract data using path
            data = self._get_nested_value(result.data, data_path)
            if data:
                if isinstance(data, list):
                    all_items.extend(data)
                else:
                    all_items.append(data)

            page_count += 1
            logger.debug(f"Fetched page {page_count}, total items: {len(all_items)}")

            # Check if there's more
            has_next = self._get_nested_value(result.data, has_next_path)
            if not has_next:
                break

            cursor = self._get_nested_value(result.data, cursor_path)
            if not cursor:
                break

            # Check max pages limit
            if max_pages and page_count >= max_pages:
                logger.info(f"Reached max pages limit ({max_pages})")
                break

        logger.info(f"Pagination complete: {len(all_items)} items from {page_count} pages")
        return all_items

    @staticmethod
    def _get_nested_value(data: Dict[str, Any], path: str) -> Any:
        """
        Get nested value from dict using dot notation path.

        Args:
            data: Dictionary to extract from
            path: Dot-notation path (e.g., "shop.products.edges")

        Returns:
            Value at path or None if not found
        """
        current = data
        for key in path.split("."):
            if isinstance(current, dict) and key in current:
                current = current[key]
            else:
                return None
        return current

    @property
    def throttle_status(self) -> ThrottleStatus:
        """Get current throttle status."""
        return self._throttle_status

    async def get_shop_info(self) -> QueryResult:
        """
        Get basic shop information.

        Returns:
            QueryResult with shop data
        """
        query = """
            query {
                shop {
                    id
                    name
                    email
                    primaryDomain {
                        url
                        host
                    }
                    currencyCode
                    plan {
                        displayName
                        partnerDevelopment
                        shopifyPlus
                    }
                    billingAddress {
                        country
                        countryCodeV2
                    }
                }
            }
        """
        return await self.execute_query(query)

    async def health_check(self) -> bool:
        """
        Check if the Shopify connection is healthy.

        Returns:
            True if connection is working, False otherwise
        """
        try:
            result = await self.execute_query("query { shop { name } }")
            return result.is_success
        except ShopifyError as e:
            logger.warning(f"Health check failed: {e.message}")
            return False


def get_shopify_client_from_settings() -> ShopifyGraphQLClient:
    """
    Create ShopifyGraphQLClient from application settings.

    Returns:
        Configured ShopifyGraphQLClient instance

    Raises:
        ShopifyConfigurationError: If required settings are missing
    """
    from app.config import get_settings

    settings = get_settings()

    if not settings.SHOPIFY_SHOP_DOMAIN or not settings.SHOPIFY_ACCESS_TOKEN:
        missing = []
        if not settings.SHOPIFY_SHOP_DOMAIN:
            missing.append("SHOPIFY_SHOP_DOMAIN")
        if not settings.SHOPIFY_ACCESS_TOKEN:
            missing.append("SHOPIFY_ACCESS_TOKEN")
        raise ShopifyConfigurationError(
            "Shopify configuration is incomplete",
            missing_config=missing,
        )

    config = ShopifyConfig(
        shop_domain=settings.SHOPIFY_SHOP_DOMAIN,
        access_token=settings.SHOPIFY_ACCESS_TOKEN,
        api_version=settings.SHOPIFY_API_VERSION,
        timeout=settings.SHOPIFY_REQUEST_TIMEOUT,
        max_retries=settings.SHOPIFY_MAX_RETRIES,
        rate_limit_buffer=settings.SHOPIFY_RATE_LIMIT_BUFFER,
    )

    return ShopifyGraphQLClient(config)

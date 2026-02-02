"""
Rate limiting utilities for API calls.

Implements a token bucket algorithm with support for:
- Async operations
- Redis-backed persistence (optional)
- In-memory fallback for single-instance deployments
- Shopify-specific rate limit header parsing
"""
import asyncio
import time
from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from loguru import logger


@dataclass
class RateLimitState:
    """Tracks the current state of rate limiting."""

    available_points: float
    maximum_points: float
    restore_rate: float  # Points restored per second
    last_update: float = field(default_factory=time.monotonic)

    def update(self) -> None:
        """Update available points based on elapsed time."""
        now = time.monotonic()
        elapsed = now - self.last_update
        restored = elapsed * self.restore_rate
        self.available_points = min(
            self.maximum_points,
            self.available_points + restored
        )
        self.last_update = now

    def can_proceed(self, cost: float = 1.0) -> bool:
        """Check if we have enough points to proceed."""
        self.update()
        return self.available_points >= cost

    def consume(self, cost: float = 1.0) -> bool:
        """
        Consume rate limit points if available.

        Returns True if points were consumed, False otherwise.
        """
        self.update()
        if self.available_points >= cost:
            self.available_points -= cost
            return True
        return False

    def time_until_available(self, cost: float = 1.0) -> float:
        """Calculate seconds until enough points are available."""
        self.update()
        if self.available_points >= cost:
            return 0.0
        needed = cost - self.available_points
        return needed / self.restore_rate

    @property
    def utilization(self) -> float:
        """Return current utilization as a percentage (0.0 to 1.0)."""
        self.update()
        return 1.0 - (self.available_points / self.maximum_points)


class RateLimiter:
    """
    Async rate limiter using token bucket algorithm.

    Supports Shopify's cost-based rate limiting where each GraphQL query
    has an associated cost that consumes from the available bucket.

    Example:
        limiter = RateLimiter(max_points=1000, restore_rate=50)

        async with limiter.acquire(cost=10):
            # Make API call
            response = await client.query(...)

        # Update from response headers
        limiter.update_from_shopify_response(response)
    """

    def __init__(
        self,
        max_points: float = 1000.0,
        restore_rate: float = 50.0,  # Points per second
        buffer_ratio: float = 0.2,  # Keep 20% buffer
        min_points_threshold: float = 50.0,  # Min points before blocking
    ):
        """
        Initialize the rate limiter.

        Args:
            max_points: Maximum points in the bucket
            restore_rate: Points restored per second
            buffer_ratio: Percentage of max_points to keep as buffer
            min_points_threshold: Minimum points to maintain before blocking
        """
        self.max_points = max_points
        self.restore_rate = restore_rate
        self.buffer_ratio = buffer_ratio
        self.min_points_threshold = min_points_threshold

        self._state = RateLimitState(
            available_points=max_points,
            maximum_points=max_points,
            restore_rate=restore_rate,
        )
        self._lock = asyncio.Lock()

        # Track request metrics
        self._total_requests = 0
        self._throttled_requests = 0
        self._total_wait_time = 0.0

    @property
    def available_points(self) -> float:
        """Get current available points."""
        self._state.update()
        return self._state.available_points

    @property
    def utilization(self) -> float:
        """Get current bucket utilization."""
        return self._state.utilization

    @property
    def stats(self) -> Dict[str, Any]:
        """Get rate limiter statistics."""
        return {
            "total_requests": self._total_requests,
            "throttled_requests": self._throttled_requests,
            "total_wait_time_seconds": round(self._total_wait_time, 2),
            "current_utilization": round(self.utilization * 100, 1),
            "available_points": round(self.available_points, 1),
            "max_points": self.max_points,
        }

    def _effective_threshold(self) -> float:
        """Calculate effective threshold considering buffer."""
        buffer_points = self.max_points * self.buffer_ratio
        return max(self.min_points_threshold, buffer_points)

    def acquire(self, cost: float = 1.0) -> "RateLimitContext":
        """
        Acquire rate limit capacity.

        Returns a context manager that handles waiting and consumption.

        Args:
            cost: The cost of the operation in points

        Returns:
            RateLimitContext for use in async with statement
        """
        return RateLimitContext(self, cost)

    async def wait_and_consume(self, cost: float = 1.0) -> float:
        """
        Wait until capacity is available, then consume it.

        Args:
            cost: The cost of the operation in points

        Returns:
            Time spent waiting in seconds
        """
        async with self._lock:
            self._total_requests += 1

            threshold = self._effective_threshold()
            effective_cost = cost + threshold  # Need cost + buffer

            wait_time = self._state.time_until_available(effective_cost)

            if wait_time > 0:
                self._throttled_requests += 1
                self._total_wait_time += wait_time
                logger.debug(
                    f"Rate limit: waiting {wait_time:.2f}s "
                    f"(available: {self._state.available_points:.1f}, "
                    f"need: {effective_cost:.1f})"
                )
                await asyncio.sleep(wait_time)

            self._state.consume(cost)
            return wait_time

    def update_from_shopify_response(
        self,
        throttle_status: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
    ) -> None:
        """
        Update rate limit state from Shopify GraphQL response.

        Shopify returns throttle status in the GraphQL extensions:
        {
            "extensions": {
                "cost": {
                    "requestedQueryCost": 10,
                    "actualQueryCost": 8,
                    "throttleStatus": {
                        "maximumAvailable": 1000.0,
                        "currentlyAvailable": 992,
                        "restoreRate": 50.0
                    }
                }
            }
        }

        Args:
            throttle_status: The throttleStatus object from response
            headers: Response headers (for REST API fallback)
        """
        if throttle_status:
            self._state.available_points = float(
                throttle_status.get("currentlyAvailable", self._state.available_points)
            )
            self._state.maximum_points = float(
                throttle_status.get("maximumAvailable", self._state.maximum_points)
            )
            self._state.restore_rate = float(
                throttle_status.get("restoreRate", self._state.restore_rate)
            )
            self._state.last_update = time.monotonic()

            logger.debug(
                f"Rate limit updated: {self._state.available_points:.1f}/"
                f"{self._state.maximum_points:.1f} "
                f"(restore: {self._state.restore_rate}/s)"
            )

        elif headers:
            # Fallback for REST API rate limiting
            # X-Shopify-Shop-Api-Call-Limit: 32/40
            limit_header = headers.get("X-Shopify-Shop-Api-Call-Limit", "")
            if "/" in limit_header:
                try:
                    used, total = limit_header.split("/")
                    self._state.available_points = float(total) - float(used)
                    self._state.maximum_points = float(total)
                    self._state.last_update = time.monotonic()
                except ValueError:
                    pass

    def reset(self) -> None:
        """Reset rate limiter to initial state."""
        self._state = RateLimitState(
            available_points=self.max_points,
            maximum_points=self.max_points,
            restore_rate=self.restore_rate,
        )
        self._total_requests = 0
        self._throttled_requests = 0
        self._total_wait_time = 0.0


class RateLimitContext:
    """Context manager for rate-limited operations."""

    def __init__(self, limiter: RateLimiter, cost: float):
        self.limiter = limiter
        self.cost = cost
        self.wait_time = 0.0

    async def __aenter__(self) -> "RateLimitContext":
        self.wait_time = await self.limiter.wait_and_consume(self.cost)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        # Could add cleanup or metrics here if needed
        pass


class AdaptiveRateLimiter(RateLimiter):
    """
    Rate limiter that adapts based on response patterns.

    Automatically adjusts behavior when approaching limits or
    receiving 429 responses.
    """

    def __init__(
        self,
        max_points: float = 1000.0,
        restore_rate: float = 50.0,
        buffer_ratio: float = 0.2,
        min_points_threshold: float = 50.0,
        backoff_multiplier: float = 1.5,
        max_backoff_seconds: float = 60.0,
    ):
        super().__init__(
            max_points=max_points,
            restore_rate=restore_rate,
            buffer_ratio=buffer_ratio,
            min_points_threshold=min_points_threshold,
        )
        self.backoff_multiplier = backoff_multiplier
        self.max_backoff_seconds = max_backoff_seconds
        self._consecutive_throttles = 0
        self._current_backoff = 0.0

    def record_throttle(self, retry_after: Optional[float] = None) -> float:
        """
        Record a throttle event (429 response).

        Returns the recommended wait time.
        """
        self._consecutive_throttles += 1

        if retry_after:
            self._current_backoff = retry_after
        else:
            # Exponential backoff
            base_backoff = 1.0
            self._current_backoff = min(
                base_backoff * (self.backoff_multiplier ** self._consecutive_throttles),
                self.max_backoff_seconds
            )

        logger.warning(
            f"Rate limit throttle recorded. "
            f"Consecutive: {self._consecutive_throttles}, "
            f"Backoff: {self._current_backoff:.1f}s"
        )

        return self._current_backoff

    def record_success(self) -> None:
        """Record a successful request, reducing backoff."""
        if self._consecutive_throttles > 0:
            self._consecutive_throttles = max(0, self._consecutive_throttles - 1)
            self._current_backoff = max(0, self._current_backoff / self.backoff_multiplier)

    async def wait_and_consume(self, cost: float = 1.0) -> float:
        """
        Wait with adaptive backoff consideration.
        """
        # Add any adaptive backoff
        if self._current_backoff > 0:
            logger.debug(f"Applying adaptive backoff: {self._current_backoff:.2f}s")
            await asyncio.sleep(self._current_backoff)
            self._total_wait_time += self._current_backoff

        return await super().wait_and_consume(cost)

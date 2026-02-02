"""
Tests for rate limiter utilities.
"""
import pytest
import asyncio
from unittest.mock import patch
import time

from app.utils.rate_limiter import (
    RateLimiter,
    AdaptiveRateLimiter,
    RateLimitState,
    RateLimitContext,
)


class TestRateLimitState:
    """Tests for RateLimitState class."""

    def test_initial_state(self):
        """Test initial state values."""
        state = RateLimitState(
            available_points=100.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        assert state.available_points == 100.0
        assert state.maximum_points == 100.0
        assert state.restore_rate == 10.0

    def test_can_proceed_with_capacity(self):
        """Test can_proceed returns True when capacity available."""
        state = RateLimitState(
            available_points=50.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        assert state.can_proceed(cost=30.0) is True

    def test_can_proceed_without_capacity(self):
        """Test can_proceed returns False when capacity insufficient."""
        state = RateLimitState(
            available_points=20.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        assert state.can_proceed(cost=30.0) is False

    def test_consume_with_capacity(self):
        """Test consume returns True and deducts points."""
        state = RateLimitState(
            available_points=50.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        result = state.consume(cost=30.0)
        assert result is True
        # Use pytest.approx for floating point comparison due to time-based updates
        assert state.available_points == pytest.approx(20.0, abs=0.1)

    def test_consume_without_capacity(self):
        """Test consume returns False without deducting."""
        state = RateLimitState(
            available_points=20.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        result = state.consume(cost=30.0)
        assert result is False
        # Use pytest.approx for floating point comparison due to time-based updates
        assert state.available_points == pytest.approx(20.0, abs=0.1)

    def test_time_until_available(self):
        """Test time calculation for availability."""
        state = RateLimitState(
            available_points=20.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        # Need 50, have 20, restore at 10/s = 3s
        wait = state.time_until_available(cost=50.0)
        assert wait == pytest.approx(3.0, abs=0.1)

    def test_time_until_available_when_sufficient(self):
        """Test no wait when capacity sufficient."""
        state = RateLimitState(
            available_points=100.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        wait = state.time_until_available(cost=50.0)
        assert wait == 0.0

    def test_utilization(self):
        """Test utilization calculation."""
        state = RateLimitState(
            available_points=25.0,
            maximum_points=100.0,
            restore_rate=10.0,
        )
        assert state.utilization == pytest.approx(0.75, abs=0.01)


class TestRateLimiter:
    """Tests for RateLimiter class."""

    def test_initial_state(self):
        """Test rate limiter initial state."""
        limiter = RateLimiter(max_points=1000.0, restore_rate=50.0)
        assert limiter.available_points == 1000.0
        assert limiter.max_points == 1000.0

    def test_stats_property(self):
        """Test stats property returns correct information."""
        limiter = RateLimiter(max_points=1000.0, restore_rate=50.0)
        stats = limiter.stats

        assert stats["total_requests"] == 0
        assert stats["throttled_requests"] == 0
        assert stats["max_points"] == 1000.0

    @pytest.mark.asyncio
    async def test_acquire_context_manager(self):
        """Test acquire returns context manager."""
        limiter = RateLimiter(max_points=1000.0, restore_rate=50.0)
        ctx = limiter.acquire(cost=10.0)  # acquire returns RateLimitContext directly
        assert isinstance(ctx, RateLimitContext)

    @pytest.mark.asyncio
    async def test_wait_and_consume_immediate(self):
        """Test immediate consumption when capacity available."""
        limiter = RateLimiter(max_points=1000.0, restore_rate=50.0, buffer_ratio=0.0)
        wait_time = await limiter.wait_and_consume(cost=10.0)
        assert wait_time == 0.0
        assert limiter._total_requests == 1

    def test_update_from_shopify_throttle_status(self):
        """Test updating from Shopify throttle status."""
        limiter = RateLimiter()
        limiter.update_from_shopify_response(
            throttle_status={
                "currentlyAvailable": 500,
                "maximumAvailable": 1000,
                "restoreRate": 50.0,
            }
        )
        assert limiter._state.available_points == 500.0
        assert limiter._state.maximum_points == 1000.0

    def test_update_from_http_headers(self):
        """Test updating from HTTP rate limit headers."""
        limiter = RateLimiter()
        limiter.update_from_shopify_response(
            headers={"X-Shopify-Shop-Api-Call-Limit": "32/40"}
        )
        assert limiter._state.available_points == 8.0
        assert limiter._state.maximum_points == 40.0

    def test_reset(self):
        """Test resetting rate limiter."""
        limiter = RateLimiter(max_points=1000.0, restore_rate=50.0)
        limiter._state.available_points = 100.0
        limiter._total_requests = 10

        limiter.reset()

        assert limiter._state.available_points == 1000.0
        assert limiter._total_requests == 0


class TestAdaptiveRateLimiter:
    """Tests for AdaptiveRateLimiter class."""

    def test_record_throttle(self):
        """Test recording throttle events."""
        limiter = AdaptiveRateLimiter()
        wait_time = limiter.record_throttle()

        assert limiter._consecutive_throttles == 1
        assert wait_time > 0

    def test_record_throttle_with_retry_after(self):
        """Test recording throttle with retry_after."""
        limiter = AdaptiveRateLimiter()
        wait_time = limiter.record_throttle(retry_after=5.0)

        assert wait_time == 5.0
        assert limiter._current_backoff == 5.0

    def test_record_throttle_exponential_backoff(self):
        """Test exponential backoff on consecutive throttles."""
        limiter = AdaptiveRateLimiter(backoff_multiplier=2.0)

        wait1 = limiter.record_throttle()
        wait2 = limiter.record_throttle()

        assert wait2 > wait1

    def test_record_success_reduces_backoff(self):
        """Test recording success reduces backoff."""
        limiter = AdaptiveRateLimiter()
        limiter.record_throttle()
        limiter.record_throttle()

        initial_throttles = limiter._consecutive_throttles
        limiter.record_success()

        assert limiter._consecutive_throttles < initial_throttles

    def test_max_backoff_cap(self):
        """Test backoff is capped at maximum."""
        limiter = AdaptiveRateLimiter(max_backoff_seconds=10.0)

        # Record many throttles
        for _ in range(20):
            limiter.record_throttle()

        assert limiter._current_backoff <= 10.0


class TestRateLimitContext:
    """Tests for RateLimitContext class."""

    @pytest.mark.asyncio
    async def test_context_manager_flow(self):
        """Test context manager entry and exit."""
        limiter = RateLimiter(max_points=1000.0, buffer_ratio=0.0)
        ctx = RateLimitContext(limiter, cost=10.0)

        async with ctx:
            pass

        assert ctx.wait_time == 0.0

    @pytest.mark.asyncio
    async def test_context_records_wait_time(self):
        """Test context records actual wait time."""
        limiter = RateLimiter(max_points=1000.0, buffer_ratio=0.0)
        ctx = RateLimitContext(limiter, cost=10.0)

        async with ctx:
            pass

        # With full capacity and no buffer, should be instant
        assert ctx.wait_time == 0.0

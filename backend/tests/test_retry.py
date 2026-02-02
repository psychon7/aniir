"""
Tests for retry utilities.
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from app.utils.retry import (
    RetryConfig,
    RetryContext,
    RetryStats,
    calculate_delay,
    retry_async,
    with_retry,
    is_retryable_http_status,
    create_http_retry_config,
)


class TestCalculateDelay:
    """Tests for calculate_delay function."""

    def test_base_delay(self):
        """Test base delay for first attempt."""
        delay = calculate_delay(
            attempt=0,
            base_delay=1.0,
            jitter=False,
        )
        assert delay == 1.0

    def test_exponential_backoff(self):
        """Test exponential backoff for subsequent attempts."""
        delay0 = calculate_delay(attempt=0, base_delay=1.0, jitter=False)
        delay1 = calculate_delay(attempt=1, base_delay=1.0, jitter=False)
        delay2 = calculate_delay(attempt=2, base_delay=1.0, jitter=False)

        assert delay0 == 1.0  # 1 * 2^0 = 1
        assert delay1 == 2.0  # 1 * 2^1 = 2
        assert delay2 == 4.0  # 1 * 2^2 = 4

    def test_max_delay_cap(self):
        """Test delay is capped at max_delay."""
        delay = calculate_delay(
            attempt=10,  # Would be 1 * 2^10 = 1024
            base_delay=1.0,
            max_delay=60.0,
            jitter=False,
        )
        assert delay == 60.0

    def test_jitter_adds_randomness(self):
        """Test jitter adds some randomness."""
        delays = [
            calculate_delay(
                attempt=0,
                base_delay=10.0,
                jitter=True,
                jitter_factor=0.1,
            )
            for _ in range(10)
        ]
        # With jitter, not all delays should be exactly the same
        # (statistically very unlikely to all be identical)
        unique_delays = set(delays)
        # Allow for the small possibility some might be similar
        assert len(unique_delays) >= 2 or len(delays) == len(unique_delays)

    def test_custom_exponential_base(self):
        """Test custom exponential base."""
        delay = calculate_delay(
            attempt=2,
            base_delay=1.0,
            exponential_base=3.0,  # Use base 3
            jitter=False,
        )
        assert delay == 9.0  # 1 * 3^2 = 9


class TestRetryConfig:
    """Tests for RetryConfig class."""

    def test_default_values(self):
        """Test default configuration values."""
        config = RetryConfig()
        assert config.max_attempts == 3
        assert config.base_delay == 1.0
        assert config.max_delay == 60.0
        assert config.exponential_base == 2.0
        assert config.jitter is True

    def test_custom_values(self):
        """Test custom configuration values."""
        config = RetryConfig(
            max_attempts=5,
            base_delay=2.0,
            max_delay=120.0,
            jitter=False,
        )
        assert config.max_attempts == 5
        assert config.base_delay == 2.0
        assert config.max_delay == 120.0
        assert config.jitter is False


class TestRetryStats:
    """Tests for RetryStats class."""

    def test_initial_values(self):
        """Test initial stats values."""
        stats = RetryStats()
        assert stats.total_attempts == 0
        assert stats.successful_attempts == 0
        assert stats.failed_attempts == 0

    def test_success_rate_calculation(self):
        """Test success rate calculation."""
        stats = RetryStats(
            total_attempts=10,
            successful_attempts=8,
            failed_attempts=2,
        )
        assert stats.success_rate == 0.8

    def test_success_rate_zero_attempts(self):
        """Test success rate with zero attempts."""
        stats = RetryStats()
        assert stats.success_rate == 0.0


class TestRetryAsync:
    """Tests for retry_async function."""

    @pytest.mark.asyncio
    async def test_successful_first_attempt(self):
        """Test successful execution on first attempt."""
        mock_func = AsyncMock(return_value="success")

        result = await retry_async(mock_func)

        assert result == "success"
        assert mock_func.call_count == 1

    @pytest.mark.asyncio
    async def test_retry_on_retryable_exception(self):
        """Test retry on retryable exception."""
        mock_func = AsyncMock(
            side_effect=[ConnectionError("Failed"), "success"]
        )
        config = RetryConfig(
            max_attempts=3,
            base_delay=0.01,
            jitter=False,
        )

        result = await retry_async(mock_func, config=config)

        assert result == "success"
        assert mock_func.call_count == 2

    @pytest.mark.asyncio
    async def test_no_retry_on_non_retryable_exception(self):
        """Test no retry on non-retryable exception."""
        mock_func = AsyncMock(side_effect=ValueError("Invalid"))
        config = RetryConfig(
            max_attempts=3,
            base_delay=0.01,
        )

        with pytest.raises(ValueError):
            await retry_async(mock_func, config=config)

        assert mock_func.call_count == 1

    @pytest.mark.asyncio
    async def test_exhausts_retries(self):
        """Test all retries are exhausted."""
        mock_func = AsyncMock(
            side_effect=ConnectionError("Always fails")
        )
        config = RetryConfig(
            max_attempts=3,
            base_delay=0.01,
            jitter=False,
        )

        with pytest.raises(ConnectionError):
            await retry_async(mock_func, config=config)

        assert mock_func.call_count == 3

    @pytest.mark.asyncio
    async def test_custom_should_retry(self):
        """Test custom should_retry callback."""
        call_count = 0

        async def failing_func():
            nonlocal call_count
            call_count += 1
            raise ValueError("Custom error")

        def should_retry(exc, attempt):
            # Retry ValueError for first 2 attempts
            return isinstance(exc, ValueError) and attempt < 2

        config = RetryConfig(
            max_attempts=5,
            base_delay=0.01,
            should_retry=should_retry,
        )

        with pytest.raises(ValueError):
            await retry_async(failing_func, config=config)

        assert call_count == 3  # Initial + 2 retries

    @pytest.mark.asyncio
    async def test_on_retry_callback(self):
        """Test on_retry callback is called."""
        mock_func = AsyncMock(
            side_effect=[ConnectionError("Failed"), "success"]
        )
        on_retry_calls = []

        async def on_retry(exc, attempt, delay):
            on_retry_calls.append({
                "exc_type": type(exc).__name__,
                "attempt": attempt,
            })

        config = RetryConfig(
            max_attempts=3,
            base_delay=0.01,
            jitter=False,
            on_retry=on_retry,
        )

        await retry_async(mock_func, config=config)

        assert len(on_retry_calls) == 1
        assert on_retry_calls[0]["exc_type"] == "ConnectionError"
        assert on_retry_calls[0]["attempt"] == 0

    @pytest.mark.asyncio
    async def test_passes_args_and_kwargs(self):
        """Test args and kwargs are passed to function."""
        async def func(a, b, c=None):
            return f"{a}-{b}-{c}"

        result = await retry_async(func, "x", "y", c="z")

        assert result == "x-y-z"


class TestWithRetryDecorator:
    """Tests for with_retry decorator."""

    @pytest.mark.asyncio
    async def test_decorator_basic(self):
        """Test basic decorator usage."""

        @with_retry(max_attempts=3, base_delay=0.01, jitter=False)
        async def my_func():
            return "success"

        result = await my_func()
        assert result == "success"

    @pytest.mark.asyncio
    async def test_decorator_retries(self):
        """Test decorator retries on failure."""
        call_count = 0

        @with_retry(max_attempts=3, base_delay=0.01, jitter=False)
        async def my_func():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise ConnectionError("Failed")
            return "success"

        result = await my_func()
        assert result == "success"
        assert call_count == 2

    @pytest.mark.asyncio
    async def test_decorator_preserves_function_name(self):
        """Test decorator preserves function metadata."""

        @with_retry()
        async def my_special_func():
            """My docstring."""
            pass

        assert my_special_func.__name__ == "my_special_func"
        assert my_special_func.__doc__ == "My docstring."


class TestRetryContext:
    """Tests for RetryContext class."""

    @pytest.mark.asyncio
    async def test_basic_retry_loop(self):
        """Test basic retry loop pattern."""
        attempts = 0

        async with RetryContext(max_attempts=3, base_delay=0.01) as ctx:
            while await ctx.next_attempt():
                attempts += 1
                if attempts < 2:
                    ctx.record_failure(ValueError("Failed"))
                else:
                    ctx.record_success()
                    break

        assert attempts == 2
        assert ctx.stats.successful_attempts == 1

    @pytest.mark.asyncio
    async def test_exhausts_attempts(self):
        """Test context exhausts all attempts."""
        attempts = 0

        with pytest.raises(ValueError):
            async with RetryContext(max_attempts=3, base_delay=0.01) as ctx:
                while await ctx.next_attempt():
                    attempts += 1
                    ctx.record_failure(ValueError("Always fails"))

        assert attempts == 3

    @pytest.mark.asyncio
    async def test_should_continue(self):
        """Test should_continue method."""
        ctx = RetryContext(max_attempts=3)

        assert ctx.should_continue() is True

        ctx._attempt = 3
        assert ctx.should_continue() is False

        ctx._attempt = 0
        ctx._succeeded = True
        assert ctx.should_continue() is False


class TestIsRetryableHttpStatus:
    """Tests for is_retryable_http_status function."""

    def test_retryable_status_codes(self):
        """Test known retryable status codes."""
        retryable = [408, 429, 500, 502, 503, 504]
        for code in retryable:
            assert is_retryable_http_status(code) is True

    def test_non_retryable_status_codes(self):
        """Test non-retryable status codes."""
        non_retryable = [200, 201, 400, 401, 403, 404, 422]
        for code in non_retryable:
            assert is_retryable_http_status(code) is False


class TestCreateHttpRetryConfig:
    """Tests for create_http_retry_config function."""

    def test_default_config(self):
        """Test default HTTP retry config."""
        config = create_http_retry_config()
        assert config.max_attempts == 3
        assert config.base_delay == 1.0

    def test_custom_config(self):
        """Test custom HTTP retry config."""
        config = create_http_retry_config(
            max_attempts=5,
            base_delay=2.0,
        )
        assert config.max_attempts == 5
        assert config.base_delay == 2.0

    def test_has_http_exceptions(self):
        """Test config includes HTTP-related exceptions."""
        config = create_http_retry_config()
        # Check that httpx exceptions are included
        import httpx
        assert any(
            exc in config.retryable_exceptions
            for exc in [httpx.ConnectError, httpx.ConnectTimeout]
        )

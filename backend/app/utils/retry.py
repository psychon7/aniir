"""
Retry utilities with exponential backoff for async operations.

Provides decorators and context managers for handling transient failures
in external API calls with configurable retry strategies.
"""
import asyncio
import functools
import random
from dataclasses import dataclass, field
from typing import (
    TypeVar,
    Callable,
    Awaitable,
    Optional,
    Tuple,
    Type,
    Union,
    Any,
    List,
)
from loguru import logger

T = TypeVar("T")

# Default exceptions that should trigger retries
DEFAULT_RETRYABLE_EXCEPTIONS: Tuple[Type[Exception], ...] = (
    ConnectionError,
    TimeoutError,
    asyncio.TimeoutError,
)


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""

    max_attempts: int = 3
    base_delay: float = 1.0  # Base delay in seconds
    max_delay: float = 60.0  # Maximum delay cap
    exponential_base: float = 2.0  # Exponential multiplier
    jitter: bool = True  # Add randomness to prevent thundering herd
    jitter_factor: float = 0.1  # Jitter as fraction of delay

    # Exceptions that should trigger retries
    retryable_exceptions: Tuple[Type[Exception], ...] = field(
        default_factory=lambda: DEFAULT_RETRYABLE_EXCEPTIONS
    )

    # Optional callback for custom retry decisions
    should_retry: Optional[Callable[[Exception, int], bool]] = None

    # Optional callback when retry occurs
    on_retry: Optional[Callable[[Exception, int, float], Awaitable[None]]] = None


@dataclass
class RetryStats:
    """Statistics about retry operations."""

    total_attempts: int = 0
    successful_attempts: int = 0
    failed_attempts: int = 0
    total_retries: int = 0
    total_delay_seconds: float = 0.0

    @property
    def success_rate(self) -> float:
        """Calculate success rate."""
        if self.total_attempts == 0:
            return 0.0
        return self.successful_attempts / self.total_attempts


def calculate_delay(
    attempt: int,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    jitter_factor: float = 0.1,
) -> float:
    """
    Calculate delay for a given attempt using exponential backoff.

    Args:
        attempt: Current attempt number (0-indexed)
        base_delay: Base delay in seconds
        max_delay: Maximum delay cap
        exponential_base: Base for exponential calculation
        jitter: Whether to add jitter
        jitter_factor: Fraction of delay to use as jitter range

    Returns:
        Delay in seconds
    """
    # Exponential backoff: delay = base * (exponential_base ^ attempt)
    delay = base_delay * (exponential_base ** attempt)

    # Cap at maximum
    delay = min(delay, max_delay)

    # Add jitter to prevent thundering herd
    if jitter:
        jitter_range = delay * jitter_factor
        delay = delay + random.uniform(-jitter_range, jitter_range)
        delay = max(0, delay)  # Ensure non-negative

    return delay


async def retry_async(
    func: Callable[..., Awaitable[T]],
    *args,
    config: Optional[RetryConfig] = None,
    **kwargs,
) -> T:
    """
    Execute an async function with retry logic.

    Args:
        func: Async function to execute
        *args: Positional arguments for func
        config: Retry configuration (uses defaults if None)
        **kwargs: Keyword arguments for func

    Returns:
        Result of the function

    Raises:
        The last exception if all retries are exhausted
    """
    if config is None:
        config = RetryConfig()

    last_exception: Optional[Exception] = None

    for attempt in range(config.max_attempts):
        try:
            result = await func(*args, **kwargs)
            return result

        except Exception as e:
            last_exception = e

            # Check if we should retry this exception
            is_retryable = isinstance(e, config.retryable_exceptions)

            # Allow custom retry decision
            if config.should_retry:
                is_retryable = config.should_retry(e, attempt)

            # Check if we have retries left
            if not is_retryable or attempt >= config.max_attempts - 1:
                logger.error(
                    f"Retry exhausted after {attempt + 1} attempts: {e}"
                )
                raise

            # Calculate delay for next attempt
            delay = calculate_delay(
                attempt=attempt,
                base_delay=config.base_delay,
                max_delay=config.max_delay,
                exponential_base=config.exponential_base,
                jitter=config.jitter,
                jitter_factor=config.jitter_factor,
            )

            logger.warning(
                f"Attempt {attempt + 1}/{config.max_attempts} failed: {e}. "
                f"Retrying in {delay:.2f}s..."
            )

            # Call optional retry callback
            if config.on_retry:
                await config.on_retry(e, attempt, delay)

            await asyncio.sleep(delay)

    # Should not reach here, but satisfy type checker
    if last_exception:
        raise last_exception
    raise RuntimeError("Unexpected retry state")


def with_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Optional[Tuple[Type[Exception], ...]] = None,
    should_retry: Optional[Callable[[Exception, int], bool]] = None,
) -> Callable[[Callable[..., Awaitable[T]]], Callable[..., Awaitable[T]]]:
    """
    Decorator for adding retry logic to async functions.

    Example:
        @with_retry(max_attempts=3, base_delay=1.0)
        async def fetch_data():
            async with httpx.AsyncClient() as client:
                return await client.get(url)

    Args:
        max_attempts: Maximum number of attempts
        base_delay: Base delay between retries in seconds
        max_delay: Maximum delay cap
        exponential_base: Base for exponential backoff
        jitter: Whether to add jitter to delays
        retryable_exceptions: Tuple of exceptions that should trigger retries
        should_retry: Optional callback for custom retry decisions

    Returns:
        Decorated function with retry logic
    """
    config = RetryConfig(
        max_attempts=max_attempts,
        base_delay=base_delay,
        max_delay=max_delay,
        exponential_base=exponential_base,
        jitter=jitter,
        retryable_exceptions=retryable_exceptions or DEFAULT_RETRYABLE_EXCEPTIONS,
        should_retry=should_retry,
    )

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            return await retry_async(func, *args, config=config, **kwargs)

        return wrapper

    return decorator


class RetryContext:
    """
    Context manager for manual retry control.

    Useful when you need more control over the retry loop or
    need to handle retries differently based on response content.

    Example:
        async with RetryContext(max_attempts=3) as ctx:
            while ctx.should_continue():
                try:
                    result = await make_request()
                    if result.errors:
                        ctx.record_failure(RetryableError())
                    else:
                        ctx.record_success()
                        break
                except ConnectionError as e:
                    ctx.record_failure(e)
    """

    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter

        self._attempt = 0
        self._last_exception: Optional[Exception] = None
        self._succeeded = False
        self._stats = RetryStats()

    @property
    def attempt(self) -> int:
        """Current attempt number (1-indexed)."""
        return self._attempt

    @property
    def stats(self) -> RetryStats:
        """Get retry statistics."""
        return self._stats

    def should_continue(self) -> bool:
        """Check if we should continue retrying."""
        return self._attempt < self.max_attempts and not self._succeeded

    def record_success(self) -> None:
        """Record a successful attempt."""
        self._succeeded = True
        self._stats.successful_attempts += 1

    def record_failure(self, exception: Exception) -> None:
        """Record a failed attempt."""
        self._last_exception = exception
        self._stats.failed_attempts += 1

    async def wait_before_retry(self) -> float:
        """
        Wait appropriate time before next retry.

        Returns the actual delay used.
        """
        if self._attempt == 0:
            return 0.0

        delay = calculate_delay(
            attempt=self._attempt - 1,
            base_delay=self.base_delay,
            max_delay=self.max_delay,
            exponential_base=self.exponential_base,
            jitter=self.jitter,
        )

        self._stats.total_delay_seconds += delay
        self._stats.total_retries += 1

        logger.debug(
            f"Retry {self._attempt}/{self.max_attempts}: "
            f"waiting {delay:.2f}s"
        )

        await asyncio.sleep(delay)
        return delay

    async def __aenter__(self) -> "RetryContext":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        self._stats.total_attempts = self._attempt

    async def next_attempt(self) -> bool:
        """
        Prepare for next attempt.

        Waits if needed and increments attempt counter.
        Returns True if attempt should proceed, False if exhausted.
        """
        if self._succeeded:
            return False

        if self._attempt > 0:
            await self.wait_before_retry()

        if self._attempt >= self.max_attempts:
            if self._last_exception:
                raise self._last_exception
            return False

        self._attempt += 1
        return True


def is_retryable_http_status(status_code: int) -> bool:
    """
    Check if an HTTP status code indicates a retryable error.

    Retryable status codes:
    - 408: Request Timeout
    - 429: Too Many Requests
    - 500: Internal Server Error
    - 502: Bad Gateway
    - 503: Service Unavailable
    - 504: Gateway Timeout
    """
    return status_code in (408, 429, 500, 502, 503, 504)


def create_http_retry_config(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    include_status_check: bool = True,
) -> RetryConfig:
    """
    Create a retry config suitable for HTTP requests.

    Args:
        max_attempts: Maximum retry attempts
        base_delay: Base delay between retries
        include_status_check: Whether to include HTTP status in retry decision

    Returns:
        RetryConfig configured for HTTP operations
    """
    import httpx

    retryable_exceptions: List[Type[Exception]] = [
        ConnectionError,
        TimeoutError,
        asyncio.TimeoutError,
        httpx.ConnectError,
        httpx.ConnectTimeout,
        httpx.ReadTimeout,
        httpx.WriteTimeout,
        httpx.PoolTimeout,
    ]

    def should_retry(exc: Exception, attempt: int) -> bool:
        # Always retry on connection/timeout errors
        if isinstance(exc, tuple(retryable_exceptions)):
            return True

        # Check HTTP status codes
        if include_status_check and hasattr(exc, "response"):
            response = getattr(exc, "response", None)
            if response and hasattr(response, "status_code"):
                return is_retryable_http_status(response.status_code)

        return False

    return RetryConfig(
        max_attempts=max_attempts,
        base_delay=base_delay,
        retryable_exceptions=tuple(retryable_exceptions),
        should_retry=should_retry,
    )

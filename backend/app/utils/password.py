"""
Password Utility Functions.

Provides reusable helpers for hashing and verifying passwords using the bcrypt
library. The helpers keep password handling consistent across the application.
"""
import logging
from typing import Final

import bcrypt

logger = logging.getLogger(__name__)

# Default work factor for bcrypt hashing. Higher costs increase CPU usage.
DEFAULT_BCRYPT_ROUNDS: Final[int] = 12


def hash_password(password: str, rounds: int = DEFAULT_BCRYPT_ROUNDS) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password.
        rounds: Work factor (cost) for bcrypt.

    Returns:
        Hashed password string.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=rounds)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify.
        hashed_password: Hashed password to compare against.

    Returns:
        True if the password matches, False otherwise.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except ValueError as exc:
        logger.warning("Password verification error: %s", exc)
        return False


def needs_rehash(
    hashed_password: str,
    rounds: int = DEFAULT_BCRYPT_ROUNDS,
) -> bool:
    """
    Determine whether a stored password hash should be rehashed.

    Args:
        hashed_password: Hashed password to inspect.
        rounds: Current desired work factor.

    Returns:
        True if the hash needs to be regenerated with new parameters.
    """
    try:
        parts = hashed_password.split("$")
        # Example format: $2b$12$salt...
        if len(parts) < 4:
            return True

        cost = int(parts[2])
        return cost != rounds
    except (ValueError, AttributeError) as exc:
        logger.warning("Invalid bcrypt hash provided: %s", exc)
        return True


__all__ = [
    "hash_password",
    "verify_password",
    "needs_rehash",
]

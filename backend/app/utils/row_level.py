"""
Row-level security helpers for commercial hierarchy filtering.
"""
from typing import Any, Iterable, Optional

from sqlalchemy import or_


def get_user_id(user: Any) -> Optional[int]:
    """Extract a numeric user ID from multiple common attribute names."""
    if user is None:
        return None

    for attr in ("usr_id", "id", "Id", "user_id"):
        value = getattr(user, attr, None)
        if isinstance(value, int) and value > 0:
            return value

    return None


def is_admin_user(user: Any) -> bool:
    """Return True when the user has admin/super rights."""
    if user is None:
        return False

    return bool(
        getattr(user, "is_admin", False)
        or getattr(user, "usr_super_right", False)
        or getattr(user, "IsSuperAdmin", False)
    )


def apply_commercial_filter(query: Any, model: Any, user: Any, fields: Iterable[str]) -> Any:
    """
    Apply row-level filter to a query for non-admin users.

    The filter allows records where at least one configured commercial field
    matches current user ID.
    """
    if is_admin_user(user):
        return query

    user_id = get_user_id(user)
    if user_id is None:
        return query

    conditions = []
    for field in fields:
        if hasattr(model, field):
            conditions.append(getattr(model, field) == user_id)

    if not conditions:
        return query

    return query.where(or_(*conditions))


"""
Email Log Service - DISABLED.

WARNING: The EmailLog model is disabled because its database table
(TM_SET_EmailLog) does NOT exist in the database (DEV_ERP_ECOLED).

This service has been disabled to prevent runtime errors. All methods will raise
NotImplementedError if called.

To re-enable:
1. Create the database table TM_SET_EmailLog
2. Restore the EmailLog model in app/models/email_log.py
3. Restore the EmailLogRepository in app/repositories/email_log_repository.py
4. Restore this service's implementation

Disabled on: 2026-02-01
Reason: Database alignment - email log table does not exist in production database
"""
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailLogServiceDisabledError(Exception):
    """Raised when the email log service is called but is disabled."""
    pass


class EmailLogService:
    """
    DISABLED: Service for email log operations.

    This service is disabled because the EmailLog database table
    does not exist. All methods will raise EmailLogServiceDisabledError.
    """
    __disabled__ = True

    def __init__(self, db=None):
        """
        Initialize the disabled email log service.

        Note: Service is disabled - all operations will raise errors.
        """
        self.db = db
        logger.warning(
            "EmailLogService instantiated but is DISABLED - "
            "EmailLog table does not exist in database"
        )

    def _raise_disabled(self):
        """Raise disabled error with helpful message."""
        raise EmailLogServiceDisabledError(
            "EmailLogService is disabled - database table TM_SET_EmailLog "
            "does not exist. Create the table first to enable email logging."
        )

    def get_by_id(self, log_id: int):
        """DISABLED: Get email log by ID."""
        self._raise_disabled()

    def get_list(
        self,
        filters=None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ):
        """DISABLED: Get paginated list of email logs."""
        self._raise_disabled()

    def create(self, data, created_by_id: Optional[int] = None):
        """DISABLED: Create a new email log entry."""
        self._raise_disabled()

    def mark_as_sent(self, log_id: int):
        """DISABLED: Mark email as sent."""
        self._raise_disabled()

    def mark_as_failed(self, log_id: int, error_message: str):
        """DISABLED: Mark email as failed."""
        self._raise_disabled()

    def get_stats(self, society_id: Optional[int] = None):
        """DISABLED: Get email statistics."""
        self._raise_disabled()

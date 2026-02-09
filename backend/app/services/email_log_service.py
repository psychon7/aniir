"""
Email Log Service - SUPERSEDED.

NOTE: This service has been superseded by EmailService in
app/services/email_service.py, which handles both email sending
and email log management.

The EmailLog model and database table (TM_SET_EmailLog) are now active
as of migration V1.0.0.5.

This file is kept for backward compatibility. New code should use
EmailService from app.services.email_service instead.

Previously disabled on: 2026-02-01
Re-enabled on: 2026-02-09
"""
from typing import Optional
import logging

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class EmailLogService:
    """
    SUPERSEDED: Use EmailService from app.services.email_service instead.

    This service is kept for backward compatibility but delegates to
    the main EmailService for all operations.
    """

    def __init__(self, db: Optional[Session] = None):
        """Initialize the email log service."""
        self.db = db
        logger.info(
            "EmailLogService is superseded - use EmailService from "
            "app.services.email_service for email log operations"
        )

    def get_by_id(self, log_id: int):
        """Get email log by ID. Use EmailService.get_email_log() instead."""
        from app.services.email_service import EmailService
        if self.db is None:
            raise RuntimeError("Database session required")
        service = EmailService(self.db)
        return service.get_email_log(log_id)

    def get_list(
        self,
        filters=None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ):
        """Get paginated list of email logs. Use EmailService.get_email_logs() instead."""
        from app.services.email_service import EmailService
        if self.db is None:
            raise RuntimeError("Database session required")
        service = EmailService(self.db)
        return service.get_email_logs(page=page, page_size=page_size)

    def create(self, data, created_by_id: Optional[int] = None):
        """Create a new email log entry. Use EmailService.create_email_log() instead."""
        from app.services.email_service import EmailService
        if self.db is None:
            raise RuntimeError("Database session required")
        service = EmailService(self.db)
        return service.create_email_log(data, created_by=created_by_id)

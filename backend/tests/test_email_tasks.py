"""
Tests for Email Celery Tasks.

These tests verify:
- Email task exception handling
- Task configuration
- Task parameter validation
- Email generation functions
"""
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from decimal import Decimal


# =============================================================================
# Exception Tests
# =============================================================================

class TestEmailExceptions:
    """Tests for email task exceptions."""

    def test_email_task_error_base(self):
        """Test base EmailTaskError."""
        from app.tasks.exceptions import EmailTaskError

        error = EmailTaskError("Test error", code="TEST_ERROR", details={"key": "value"})
        assert error.message == "Test error"
        assert error.code == "TEST_ERROR"
        assert error.details == {"key": "value"}
        assert error.retryable is True
        assert str(error) == "Test error"

    def test_email_task_error_to_dict(self):
        """Test EmailTaskError.to_dict() method."""
        from app.tasks.exceptions import EmailTaskError

        error = EmailTaskError("Test error", code="TEST_ERROR", details={"key": "value"}, retryable=False)
        result = error.to_dict()
        assert result == {
            "error": "TEST_ERROR",
            "message": "Test error",
            "details": {"key": "value"},
            "retryable": False,
        }

    def test_email_connection_error(self):
        """Test EmailConnectionError is retryable."""
        from app.tasks.exceptions import EmailConnectionError

        error = EmailConnectionError()
        assert error.code == "EMAIL_CONNECTION_ERROR"
        assert error.retryable is True
        assert "connect" in error.message.lower()

    def test_email_connection_error_with_details(self):
        """Test EmailConnectionError with custom details."""
        from app.tasks.exceptions import EmailConnectionError

        error = EmailConnectionError(
            message="Custom connection error",
            details={"smtp_host": "smtp.example.com", "smtp_port": 587}
        )
        assert error.message == "Custom connection error"
        assert error.details["smtp_host"] == "smtp.example.com"
        assert error.details["smtp_port"] == 587

    def test_email_configuration_error(self):
        """Test EmailConfigurationError is not retryable."""
        from app.tasks.exceptions import EmailConfigurationError

        error = EmailConfigurationError()
        assert error.code == "EMAIL_CONFIG_ERROR"
        assert error.retryable is False  # Config errors should not retry

    def test_email_configuration_error_with_missing_settings(self):
        """Test EmailConfigurationError with missing settings."""
        from app.tasks.exceptions import EmailConfigurationError

        error = EmailConfigurationError(
            message="Missing settings",
            missing_settings=["SMTP_HOST", "SMTP_PASSWORD"]
        )
        assert error.details["missing_settings"] == ["SMTP_HOST", "SMTP_PASSWORD"]
        assert error.retryable is False

    def test_email_delivery_error(self):
        """Test EmailDeliveryError is retryable."""
        from app.tasks.exceptions import EmailDeliveryError

        error = EmailDeliveryError()
        assert error.code == "EMAIL_DELIVERY_ERROR"
        assert error.retryable is True

    def test_email_delivery_error_with_recipients(self):
        """Test EmailDeliveryError with recipients."""
        from app.tasks.exceptions import EmailDeliveryError

        error = EmailDeliveryError(
            message="Delivery failed",
            recipients=["test@example.com", "test2@example.com"]
        )
        assert error.details["recipients"] == ["test@example.com", "test2@example.com"]

    def test_email_template_error(self):
        """Test EmailTemplateError is not retryable."""
        from app.tasks.exceptions import EmailTemplateError

        error = EmailTemplateError()
        assert error.code == "EMAIL_TEMPLATE_ERROR"
        assert error.retryable is False

    def test_email_template_error_with_template_name(self):
        """Test EmailTemplateError with template name."""
        from app.tasks.exceptions import EmailTemplateError

        error = EmailTemplateError(
            message="Template error",
            template_name="invoice_summary.html"
        )
        assert error.details["template_name"] == "invoice_summary.html"


# =============================================================================
# Task Import Tests
# =============================================================================

class TestEmailTaskImports:
    """Tests for email task imports."""

    def test_import_send_daily_invoices_task(self):
        """Test send_daily_invoices_task can be imported."""
        from app.tasks.email_tasks import send_daily_invoices_task
        assert send_daily_invoices_task is not None
        assert send_daily_invoices_task.name == "app.tasks.email_tasks.send_daily_invoices_task"

    def test_import_send_invoice_email_task(self):
        """Test send_invoice_email_task can be imported."""
        from app.tasks.email_tasks import send_invoice_email_task
        assert send_invoice_email_task is not None
        assert send_invoice_email_task.name == "app.tasks.email_tasks.send_invoice_email_task"

    def test_import_send_overdue_reminders_task(self):
        """Test send_overdue_reminders_task can be imported."""
        from app.tasks.email_tasks import send_overdue_reminders_task
        assert send_overdue_reminders_task is not None
        assert send_overdue_reminders_task.name == "app.tasks.email_tasks.send_overdue_reminders_task"

    def test_import_email_health_check(self):
        """Test email_health_check can be imported."""
        from app.tasks.email_tasks import email_health_check
        assert email_health_check is not None
        assert email_health_check.name == "app.tasks.email_tasks.email_health_check"

    def test_import_from_tasks_module(self):
        """Test all email tasks can be imported from tasks module."""
        from app.tasks import (
            send_daily_invoices_task,
            send_invoice_email_task,
            send_overdue_reminders_task,
            email_health_check,
            EmailTaskError,
            EmailConnectionError,
            EmailConfigurationError,
            EmailDeliveryError,
            EmailTemplateError,
        )
        assert send_daily_invoices_task is not None
        assert send_invoice_email_task is not None
        assert send_overdue_reminders_task is not None
        assert email_health_check is not None
        assert EmailTaskError is not None
        assert EmailConnectionError is not None
        assert EmailConfigurationError is not None
        assert EmailDeliveryError is not None
        assert EmailTemplateError is not None


# =============================================================================
# Email Template Generation Tests
# =============================================================================

class TestEmailTemplateGeneration:
    """Tests for email template generation functions."""

    def test_generate_daily_invoice_email_html(self):
        """Test HTML email generation for daily invoices."""
        from app.tasks.email_tasks import _generate_daily_invoice_email_html

        invoices = [
            {
                "reference": "INV-2025-00001",
                "date": datetime(2025, 1, 15),
                "due_date": datetime(2025, 2, 15),
                "total_amount": Decimal("1500.00"),
                "amount_due": Decimal("1500.00"),
                "is_overdue": False,
                "is_paid": False,
            },
            {
                "reference": "INV-2025-00002",
                "date": datetime(2025, 1, 10),
                "due_date": datetime(2025, 1, 25),
                "total_amount": Decimal("500.00"),
                "amount_due": Decimal("0.00"),
                "is_overdue": False,
                "is_paid": True,
            },
        ]

        html = _generate_daily_invoice_email_html(
            client_name="Test Company",
            invoices=invoices,
            total_amount=Decimal("2000.00"),
            total_due=Decimal("1500.00"),
            currency="EUR",
        )

        assert "Test Company" in html
        assert "INV-2025-00001" in html
        assert "INV-2025-00002" in html
        assert "EUR" in html
        assert "Daily Invoice Summary" in html
        assert "ECOLED" in html

    def test_generate_daily_invoice_email_text(self):
        """Test plain text email generation for daily invoices."""
        from app.tasks.email_tasks import _generate_daily_invoice_email_text

        invoices = [
            {
                "reference": "INV-2025-00001",
                "date": datetime(2025, 1, 15),
                "due_date": datetime(2025, 2, 15),
                "total_amount": Decimal("1500.00"),
                "amount_due": Decimal("1500.00"),
                "is_overdue": False,
                "is_paid": False,
            },
        ]

        text = _generate_daily_invoice_email_text(
            client_name="Test Company",
            invoices=invoices,
            total_amount=Decimal("1500.00"),
            total_due=Decimal("1500.00"),
            currency="EUR",
        )

        assert "Test Company" in text
        assert "INV-2025-00001" in text
        assert "DAILY INVOICE SUMMARY" in text
        assert "TOTAL" in text

    def test_generate_overdue_reminder_html(self):
        """Test HTML email generation for overdue reminders."""
        from app.tasks.email_tasks import _generate_overdue_reminder_html

        invoices = [
            {
                "reference": "INV-2025-00001",
                "date": datetime(2025, 1, 1),
                "due_date": datetime(2025, 1, 15),
                "total_amount": Decimal("1000.00"),
                "amount_due": Decimal("1000.00"),
                "is_overdue": True,
                "is_paid": False,
                "days_overdue": 15,
            },
        ]

        html = _generate_overdue_reminder_html(
            client_name="Test Company",
            invoices=invoices,
            total_overdue=Decimal("1000.00"),
            currency="EUR",
        )

        assert "Test Company" in html
        assert "INV-2025-00001" in html
        assert "15 days" in html
        assert "Payment Reminder" in html
        assert "overdue" in html.lower()


# =============================================================================
# Celery Configuration Tests
# =============================================================================

class TestEmailTaskConfiguration:
    """Tests for email task Celery configuration."""

    def test_email_task_routes(self):
        """Test email tasks are routed to correct queues."""
        from app.tasks.celery_app import celery_app

        routes = celery_app.conf.task_routes
        assert routes["app.tasks.email_tasks.send_daily_invoices_task"]["queue"] == "email_low"
        assert routes["app.tasks.email_tasks.send_invoice_email_task"]["queue"] == "email"
        assert routes["app.tasks.email_tasks.send_overdue_reminders_task"]["queue"] == "email_low"
        assert routes["app.tasks.email_tasks.email_health_check"]["queue"] == "email"

    def test_email_queues_exist(self):
        """Test email queues are configured."""
        from app.tasks.celery_app import celery_app

        queue_names = [q.name for q in celery_app.conf.task_queues]
        assert "email" in queue_names
        assert "email_low" in queue_names

    def test_email_task_beat_schedule(self):
        """Test email tasks are in beat schedule."""
        from app.tasks.celery_app import celery_app

        schedule = celery_app.conf.beat_schedule

        # Check daily invoices task is scheduled
        assert "send-daily-invoices-every-day" in schedule
        assert schedule["send-daily-invoices-every-day"]["task"] == "app.tasks.email_tasks.send_daily_invoices_task"
        assert schedule["send-daily-invoices-every-day"]["schedule"] == 86400.0  # 24 hours

        # Check overdue reminders task is scheduled
        assert "send-overdue-reminders-daily" in schedule
        assert schedule["send-overdue-reminders-daily"]["task"] == "app.tasks.email_tasks.send_overdue_reminders_task"
        assert schedule["send-overdue-reminders-daily"]["schedule"] == 86400.0  # 24 hours

    def test_email_task_rate_limits(self):
        """Test email tasks have rate limits configured."""
        from app.tasks.celery_app import celery_app

        annotations = celery_app.conf.task_annotations

        # Check rate limits are set
        assert "app.tasks.email_tasks.send_daily_invoices_task" in annotations
        assert "app.tasks.email_tasks.send_invoice_email_task" in annotations
        assert "app.tasks.email_tasks.send_overdue_reminders_task" in annotations

        # Verify rate limit values
        assert annotations["app.tasks.email_tasks.send_daily_invoices_task"]["rate_limit"] == "1/m"
        assert annotations["app.tasks.email_tasks.send_invoice_email_task"]["rate_limit"] == "10/m"
        assert annotations["app.tasks.email_tasks.send_overdue_reminders_task"]["rate_limit"] == "1/m"


# =============================================================================
# Task Retry Behavior Tests
# =============================================================================

class TestEmailTaskRetryBehavior:
    """Tests for email task retry configuration."""

    def test_send_daily_invoices_task_retry_config(self):
        """Test send_daily_invoices_task has correct retry config."""
        from app.tasks.email_tasks import send_daily_invoices_task

        # Check retry settings
        assert send_daily_invoices_task.max_retries == 3
        assert send_daily_invoices_task.default_retry_delay == 300

    def test_send_invoice_email_task_retry_config(self):
        """Test send_invoice_email_task has correct retry config."""
        from app.tasks.email_tasks import send_invoice_email_task

        # Check retry settings
        assert send_invoice_email_task.max_retries == 3
        assert send_invoice_email_task.default_retry_delay == 60

    def test_send_overdue_reminders_task_retry_config(self):
        """Test send_overdue_reminders_task has correct retry config."""
        from app.tasks.email_tasks import send_overdue_reminders_task

        # Check retry settings
        assert send_overdue_reminders_task.max_retries == 3
        assert send_overdue_reminders_task.default_retry_delay == 300

    def test_email_health_check_no_retry(self):
        """Test email_health_check has no retries."""
        from app.tasks.email_tasks import email_health_check

        # Health check should not retry
        assert email_health_check.max_retries == 0

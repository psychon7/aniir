"""
Tests for Email Service Module.

Tests cover:
- EmailProvider interface
- SMTP email provider
- Console email provider
- Email service main class
- Template rendering
- Business email methods
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path

from app.services.email_service import (
    # Enums
    EmailProvider,
    EmailPriority,
    EmailContentType,
    # Data classes
    EmailAttachment,
    EmailMessage,
    EmailResult,
    # Exceptions
    EmailServiceError,
    EmailConfigurationError,
    EmailDeliveryError,
    EmailValidationError,
    EmailTemplateError,
    EmailConnectionError,
    EmailRateLimitError,
    # Providers
    BaseEmailProvider,
    SMTPEmailProvider,
    ConsoleEmailProvider,
    # Main service
    EmailService,
    # Dependency injection
    get_email_service,
    create_email_service,
    create_email_provider,
)


# ==========================================================================
# Test Data Classes
# ==========================================================================

class TestEmailAttachment:
    """Tests for EmailAttachment dataclass."""

    def test_create_attachment(self):
        """Test creating an email attachment."""
        attachment = EmailAttachment(
            filename="test.pdf",
            content=b"PDF content",
            content_type="application/pdf"
        )
        assert attachment.filename == "test.pdf"
        assert attachment.content == b"PDF content"
        assert attachment.content_type == "application/pdf"

    def test_default_content_type(self):
        """Test default content type."""
        attachment = EmailAttachment(
            filename="file.bin",
            content=b"binary data"
        )
        assert attachment.content_type == "application/octet-stream"


class TestEmailMessage:
    """Tests for EmailMessage dataclass."""

    def test_create_message(self):
        """Test creating a basic email message."""
        message = EmailMessage(
            to=["test@example.com"],
            subject="Test Subject",
            body="Test Body"
        )
        assert message.to == ["test@example.com"]
        assert message.subject == "Test Subject"
        assert message.body == "Test Body"
        assert message.priority == EmailPriority.NORMAL
        assert message.content_type == EmailContentType.HTML

    def test_message_with_all_fields(self):
        """Test creating a message with all fields."""
        attachment = EmailAttachment(
            filename="test.pdf",
            content=b"content"
        )
        message = EmailMessage(
            to=["recipient@example.com"],
            subject="Full Test",
            body="<p>HTML Body</p>",
            from_address="sender@example.com",
            cc=["cc@example.com"],
            bcc=["bcc@example.com"],
            reply_to="reply@example.com",
            attachments=[attachment],
            priority=EmailPriority.HIGH,
            content_type=EmailContentType.HTML,
            headers={"X-Custom": "value"}
        )

        assert message.from_address == "sender@example.com"
        assert message.cc == ["cc@example.com"]
        assert message.bcc == ["bcc@example.com"]
        assert message.reply_to == "reply@example.com"
        assert len(message.attachments) == 1
        assert message.priority == EmailPriority.HIGH
        assert message.headers["X-Custom"] == "value"


class TestEmailResult:
    """Tests for EmailResult dataclass."""

    def test_success_result(self):
        """Test creating a success result."""
        result = EmailResult(
            success=True,
            message_id="msg-123",
            provider="smtp",
            recipients=["test@example.com"]
        )
        assert result.success is True
        assert result.message_id == "msg-123"
        assert result.error is None

    def test_failure_result(self):
        """Test creating a failure result."""
        result = EmailResult(
            success=False,
            error="SMTP connection failed",
            provider="smtp",
            recipients=["test@example.com"]
        )
        assert result.success is False
        assert result.error == "SMTP connection failed"


# ==========================================================================
# Test Exceptions
# ==========================================================================

class TestEmailExceptions:
    """Tests for email service exceptions."""

    def test_email_service_error(self):
        """Test base EmailServiceError."""
        error = EmailServiceError(
            code="TEST_ERROR",
            message="Test error message",
            details={"key": "value"}
        )
        assert error.code == "TEST_ERROR"
        assert error.message == "Test error message"
        assert error.details == {"key": "value"}

    def test_email_configuration_error(self):
        """Test EmailConfigurationError."""
        error = EmailConfigurationError("Invalid SMTP configuration")
        assert error.code == "EMAIL_CONFIGURATION_ERROR"
        assert "Invalid SMTP configuration" in error.message

    def test_email_delivery_error(self):
        """Test EmailDeliveryError with recipients."""
        error = EmailDeliveryError(
            "Failed to deliver",
            recipients=["test@example.com"]
        )
        assert error.code == "EMAIL_DELIVERY_ERROR"
        assert "test@example.com" in error.details["recipients"]

    def test_email_validation_error(self):
        """Test EmailValidationError with field."""
        error = EmailValidationError(
            "Invalid email format",
            field="to"
        )
        assert error.code == "EMAIL_VALIDATION_ERROR"
        assert error.details["field"] == "to"

    def test_email_template_error(self):
        """Test EmailTemplateError."""
        error = EmailTemplateError("missing_template.html")
        assert error.code == "EMAIL_TEMPLATE_ERROR"
        assert "missing_template.html" in error.details["template_name"]

    def test_email_connection_error(self):
        """Test EmailConnectionError with provider."""
        error = EmailConnectionError(
            "Connection refused",
            provider="smtp"
        )
        assert error.code == "EMAIL_CONNECTION_ERROR"
        assert error.details["provider"] == "smtp"

    def test_email_rate_limit_error(self):
        """Test EmailRateLimitError with retry_after."""
        error = EmailRateLimitError(
            "Rate limit exceeded",
            retry_after=60
        )
        assert error.code == "EMAIL_RATE_LIMIT_ERROR"
        assert error.details["retry_after"] == 60


# ==========================================================================
# Test Console Email Provider
# ==========================================================================

class TestConsoleEmailProvider:
    """Tests for ConsoleEmailProvider."""

    @pytest.fixture
    def provider(self):
        """Create a console email provider."""
        return ConsoleEmailProvider()

    def test_provider_name(self, provider):
        """Test provider name."""
        assert provider.provider_name == "console"

    @pytest.mark.asyncio
    async def test_send_email(self, provider):
        """Test sending email via console provider."""
        message = EmailMessage(
            to=["test@example.com"],
            subject="Test Subject",
            body="Test Body"
        )

        result = await provider.send(message)

        assert result.success is True
        assert result.provider == "console"
        assert "test@example.com" in result.recipients

    @pytest.mark.asyncio
    async def test_send_batch(self, provider):
        """Test sending multiple emails."""
        messages = [
            EmailMessage(
                to=["user1@example.com"],
                subject="Subject 1",
                body="Body 1"
            ),
            EmailMessage(
                to=["user2@example.com"],
                subject="Subject 2",
                body="Body 2"
            )
        ]

        results = await provider.send_batch(messages)

        assert len(results) == 2
        assert all(r.success for r in results)

    @pytest.mark.asyncio
    async def test_verify_connection(self, provider):
        """Test connection verification."""
        result = await provider.verify_connection()
        assert result is True

    @pytest.mark.asyncio
    async def test_validation_fails_without_recipients(self, provider):
        """Test validation fails without recipients."""
        message = EmailMessage(
            to=[],
            subject="Test Subject",
            body="Test Body"
        )

        with pytest.raises(EmailValidationError) as exc_info:
            await provider.send(message)

        assert "recipient" in exc_info.value.message.lower()

    @pytest.mark.asyncio
    async def test_validation_fails_without_subject(self, provider):
        """Test validation fails without subject."""
        message = EmailMessage(
            to=["test@example.com"],
            subject="",
            body="Test Body"
        )

        with pytest.raises(EmailValidationError) as exc_info:
            await provider.send(message)

        assert "subject" in exc_info.value.message.lower()

    @pytest.mark.asyncio
    async def test_validation_fails_with_invalid_email(self, provider):
        """Test validation fails with invalid email."""
        message = EmailMessage(
            to=["not-an-email"],
            subject="Test Subject",
            body="Test Body"
        )

        with pytest.raises(EmailValidationError) as exc_info:
            await provider.send(message)

        assert "invalid" in exc_info.value.message.lower()


# ==========================================================================
# Test SMTP Email Provider
# ==========================================================================

class TestSMTPEmailProvider:
    """Tests for SMTPEmailProvider."""

    @pytest.fixture
    def provider(self):
        """Create an SMTP email provider."""
        return SMTPEmailProvider(
            host="smtp.example.com",
            port=587,
            username="user",
            password="pass",
            use_tls=True
        )

    def test_provider_name(self, provider):
        """Test provider name."""
        assert provider.provider_name == "smtp"

    def test_provider_configuration(self, provider):
        """Test provider is configured correctly."""
        assert provider.host == "smtp.example.com"
        assert provider.port == 587
        assert provider.username == "user"
        assert provider.use_tls is True
        assert provider.use_ssl is False

    @pytest.mark.asyncio
    async def test_send_email_builds_mime_message(self, provider):
        """Test MIME message is built correctly."""
        message = EmailMessage(
            to=["test@example.com"],
            subject="Test Subject",
            body="<p>HTML Body</p>",
            cc=["cc@example.com"],
            priority=EmailPriority.HIGH
        )

        mime_msg = provider._build_mime_message(message)

        assert mime_msg["Subject"] == "Test Subject"
        assert "test@example.com" in mime_msg["To"]
        assert "cc@example.com" in mime_msg["Cc"]
        assert mime_msg["X-Priority"] == "1"  # High priority

    @pytest.mark.asyncio
    async def test_send_email_with_attachment(self, provider):
        """Test building MIME message with attachment."""
        attachment = EmailAttachment(
            filename="report.pdf",
            content=b"PDF content",
            content_type="application/pdf"
        )
        message = EmailMessage(
            to=["test@example.com"],
            subject="Test with Attachment",
            body="See attached",
            attachments=[attachment]
        )

        mime_msg = provider._build_mime_message(message)

        # Check that attachment is included
        parts = list(mime_msg.walk())
        assert len(parts) > 1  # Should have multiple parts

    @pytest.mark.asyncio
    @patch.object(SMTPEmailProvider, '_send_smtp')
    async def test_send_success(self, mock_send_smtp, provider):
        """Test successful email send."""
        mock_send_smtp.return_value = None

        message = EmailMessage(
            to=["test@example.com"],
            subject="Test Subject",
            body="Test Body"
        )

        result = await provider.send(message)

        assert result.success is True
        assert result.provider == "smtp"


# ==========================================================================
# Test Email Service
# ==========================================================================

class TestEmailService:
    """Tests for EmailService main class."""

    @pytest.fixture
    def service(self):
        """Create an email service with console provider."""
        provider = ConsoleEmailProvider()
        return EmailService(provider=provider)

    def test_service_initialization(self, service):
        """Test service initialization."""
        assert service.provider is not None
        assert service.template_env is not None

    def test_get_provider_name(self, service):
        """Test getting provider name."""
        assert service.get_provider_name() == "console"

    @pytest.mark.asyncio
    async def test_send_email(self, service):
        """Test sending a simple email."""
        result = await service.send_email(
            to="test@example.com",
            subject="Test Subject",
            body="Test Body"
        )

        assert result.success is True
        assert "test@example.com" in result.recipients

    @pytest.mark.asyncio
    async def test_send_email_with_list_recipients(self, service):
        """Test sending email to multiple recipients."""
        result = await service.send_email(
            to=["user1@example.com", "user2@example.com"],
            subject="Test Subject",
            body="Test Body",
            cc="cc@example.com",
            bcc=["bcc1@example.com", "bcc2@example.com"]
        )

        assert result.success is True
        assert "user1@example.com" in result.recipients
        assert "user2@example.com" in result.recipients

    @pytest.mark.asyncio
    async def test_send_batch(self, service):
        """Test sending multiple emails in batch."""
        messages = [
            EmailMessage(
                to=["user1@example.com"],
                subject="Subject 1",
                body="Body 1"
            ),
            EmailMessage(
                to=["user2@example.com"],
                subject="Subject 2",
                body="Body 2"
            )
        ]

        results = await service.send_batch(messages)

        assert len(results) == 2
        assert all(r.success for r in results)

    @pytest.mark.asyncio
    async def test_verify_connection(self, service):
        """Test connection verification."""
        result = await service.verify_connection()
        assert result is True

    @pytest.mark.asyncio
    async def test_send_invoice_email_fallback(self, service):
        """Test sending invoice email with fallback (no template)."""
        result = await service.send_invoice_email(
            to="client@example.com",
            invoice_reference="INV-2025-001",
            invoice_amount=1500.50,
            currency="EUR",
            due_date="2025-02-28",
            client_name="Test Company",
            cc_accounting=False
        )

        assert result.success is True

    @pytest.mark.asyncio
    async def test_send_payment_confirmation_fallback(self, service):
        """Test sending payment confirmation with fallback."""
        result = await service.send_payment_confirmation(
            to="client@example.com",
            invoice_reference="INV-2025-001",
            payment_amount=1500.50,
            currency="EUR",
            payment_date="2025-01-15",
            client_name="Test Company"
        )

        assert result.success is True

    @pytest.mark.asyncio
    async def test_send_overdue_reminder_fallback(self, service):
        """Test sending overdue reminder with fallback."""
        result = await service.send_overdue_reminder(
            to="client@example.com",
            invoice_reference="INV-2025-001",
            invoice_amount=1500.50,
            balance_due=1500.50,
            currency="EUR",
            due_date="2025-01-01",
            days_overdue=30,
            client_name="Test Company"
        )

        assert result.success is True


# ==========================================================================
# Test Dependency Injection
# ==========================================================================

class TestDependencyInjection:
    """Tests for dependency injection functions."""

    def test_get_email_service_singleton(self):
        """Test that get_email_service returns singleton."""
        # Reset the singleton
        import app.services.email_service as email_module
        email_module._email_service = None

        service1 = get_email_service()
        service2 = get_email_service()

        assert service1 is service2

        # Cleanup
        email_module._email_service = None

    def test_create_email_service(self):
        """Test creating custom email service."""
        provider = ConsoleEmailProvider()
        service = create_email_service(provider=provider)

        assert service.provider is provider


# ==========================================================================
# Test Provider Factory
# ==========================================================================

class TestProviderFactory:
    """Tests for provider factory function."""

    def test_create_smtp_provider(self):
        """Test creating SMTP provider."""
        provider = create_email_provider(
            EmailProvider.SMTP,
            host="smtp.example.com",
            port=587
        )

        assert isinstance(provider, SMTPEmailProvider)
        assert provider.host == "smtp.example.com"

    def test_create_console_provider(self):
        """Test creating console provider."""
        provider = create_email_provider(EmailProvider.CONSOLE)

        assert isinstance(provider, ConsoleEmailProvider)

    def test_create_smtp_provider_missing_config(self):
        """Test error when SMTP config is missing."""
        with pytest.raises(EmailConfigurationError) as exc_info:
            create_email_provider(EmailProvider.SMTP)

        assert "host" in str(exc_info.value.details)


# ==========================================================================
# Test Enums
# ==========================================================================

class TestEnums:
    """Tests for enum values."""

    def test_email_provider_values(self):
        """Test EmailProvider enum values."""
        assert EmailProvider.SMTP.value == "smtp"
        assert EmailProvider.SENDGRID.value == "sendgrid"
        assert EmailProvider.SES.value == "ses"
        assert EmailProvider.CONSOLE.value == "console"

    def test_email_priority_values(self):
        """Test EmailPriority enum values."""
        assert EmailPriority.LOW.value == "low"
        assert EmailPriority.NORMAL.value == "normal"
        assert EmailPriority.HIGH.value == "high"

    def test_email_content_type_values(self):
        """Test EmailContentType enum values."""
        assert EmailContentType.PLAIN.value == "plain"
        assert EmailContentType.HTML.value == "html"

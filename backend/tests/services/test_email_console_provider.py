"""
Tests for the ConsoleEmailProvider.
"""

import pytest
from io import StringIO
import sys

from app.services.email import (
    ConsoleEmailProvider,
    EmailMessage,
    EmailAttachment,
    EmailPriority,
)


@pytest.fixture
def provider():
    """Create a console email provider for testing."""
    return ConsoleEmailProvider(colorize=False)


@pytest.fixture
def sample_message():
    """Create a sample email message."""
    return EmailMessage(
        to=["test@example.com"],
        subject="Test Subject",
        body_text="This is a test email body.",
    )


class TestConsoleEmailProvider:
    """Tests for ConsoleEmailProvider."""
    
    @pytest.mark.asyncio
    async def test_send_basic_email(self, provider, sample_message, capsys):
        """Test sending a basic email."""
        result = await provider.send(sample_message, "sender@example.com")
        
        assert result.success is True
        assert result.message_id is not None
        assert result.message_id.startswith("console-")
        assert result.provider == "console"
        
        # Check console output
        captured = capsys.readouterr()
        assert "Test Subject" in captured.out
        assert "test@example.com" in captured.out
        assert "sender@example.com" in captured.out
    
    @pytest.mark.asyncio
    async def test_send_email_with_cc_bcc(self, provider, capsys):
        """Test sending email with CC and BCC."""
        message = EmailMessage(
            to=["to@example.com"],
            subject="CC/BCC Test",
            body_text="Test body",
            cc=["cc@example.com"],
            bcc=["bcc@example.com"],
        )
        
        result = await provider.send(message, "sender@example.com")
        
        assert result.success is True
        
        captured = capsys.readouterr()
        assert "cc@example.com" in captured.out
        assert "bcc@example.com" in captured.out
    
    @pytest.mark.asyncio
    async def test_send_email_with_html(self, provider, capsys):
        """Test sending email with HTML content."""
        message = EmailMessage(
            to=["test@example.com"],
            subject="HTML Test",
            body_text="Plain text",
            body_html="<html><body><h1>HTML Content</h1></body></html>",
        )
        
        result = await provider.send(message, "sender@example.com")
        
        assert result.success is True
        
        captured = capsys.readouterr()
        assert "HTML" in captured.out
    
    @pytest.mark.asyncio
    async def test_send_email_with_attachment(self, provider, capsys):
        """Test sending email with attachment."""
        attachment = EmailAttachment(
            filename="test.pdf",
            content=b"PDF content here",
            content_type="application/pdf",
        )
        
        message = EmailMessage(
            to=["test@example.com"],
            subject="Attachment Test",
            body_text="See attached",
            attachments=[attachment],
        )
        
        result = await provider.send(message, "sender@example.com")
        
        assert result.success is True
        
        captured = capsys.readouterr()
        assert "test.pdf" in captured.out
        assert "application/pdf" in captured.out
    
    @pytest.mark.asyncio
    async def test_send_bulk_emails(self, provider, capsys):
        """Test sending multiple emails."""
        messages = [
            EmailMessage(
                to=[f"user{i}@example.com"],
                subject=f"Bulk Email {i}",
                body_text=f"Body {i}",
            )
            for i in range(3)
        ]
        
        results = await provider.send_bulk(messages, "sender@example.com")
        
        assert len(results) == 3
        assert all(r.success for r in results)
        
        captured = capsys.readouterr()
        assert "BULK EMAIL SUMMARY" in captured.out
        assert "Success: 3" in captured.out
    
    def test_validate_email_address(self, provider):
        """Test email address validation."""
        assert provider.validate_address("valid@example.com") is True
        assert provider.validate_address("user.name@domain.co.uk") is True
        assert provider.validate_address("invalid") is False
        assert provider.validate_address("@example.com") is False
        assert provider.validate_address("user@") is False
        assert provider.validate_address("") is False
        assert provider.validate_address(None) is False
    
    @pytest.mark.asyncio
    async def test_simulated_failure(self, capsys):
        """Test simulated email failure."""
        provider = ConsoleEmailProvider(colorize=False, fail_rate=1.0)
        
        message = EmailMessage(
            to=["test@example.com"],
            subject="Will Fail",
            body_text="This will fail",
        )
        
        result = await provider.send(message, "sender@example.com")
        
        assert result.success is False
        assert "Simulated" in result.error
    
    def test_sent_count(self, provider):
        """Test sent count tracking."""
        assert provider.sent_count == 0
    
    @pytest.mark.asyncio
    async def test_sent_count_increments(self, provider, sample_message):
        """Test that sent count increments after sending."""
        await provider.send(sample_message, "sender@example.com")
        assert provider.sent_count == 1
        
        await provider.send(sample_message, "sender@example.com")
        assert provider.sent_count == 2
    
    def test_provider_name(self, provider):
        """Test provider name."""
        assert provider.name == "console"

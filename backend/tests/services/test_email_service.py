"""
Tests for the EmailService.
"""

import pytest

from app.services.email import EmailService, ConsoleEmailProvider


@pytest.fixture
def email_service():
    """Create an email service with console provider."""
    provider = ConsoleEmailProvider(colorize=False)
    return EmailService(
        provider=provider,
        default_from_address="test@ecoled.com",
    )


class TestEmailService:
    """Tests for EmailService."""
    
    @pytest.mark.asyncio
    async def test_send_email_basic(self, email_service, capsys):
        """Test sending a basic email."""
        result = await email_service.send_email(
            to="recipient@example.com",
            subject="Test Email",
            body_text="Hello, World!",
        )
        
        assert result.success is True
        assert result.provider == "console"
    
    @pytest.mark.asyncio
    async def test_send_email_with_list_recipients(self, email_service, capsys):
        """Test sending email to multiple recipients."""
        result = await email_service.send_email(
            to=["user1@example.com", "user2@example.com"],
            subject="Multi-recipient Test",
            body_text="Hello everyone!",
        )
        
        assert result.success is True
    
    @pytest.mark.asyncio
    async def test_send_email_invalid_address(self, email_service):
        """Test sending email with invalid address."""
        result = await email_service.send_email(
            to="invalid-email",
            subject="Test",
            body_text="Test",
        )
        
        assert result.success is False
        assert "Invalid email" in result.error
    
    @pytest.mark.asyncio
    async def test_send_invoice_email(self, email_service, capsys):
        """Test sending an invoice email."""
        result = await email_service.send_invoice_email(
            to="client@example.com",
            invoice_reference="INV-2024-0001",
            client_name="Test Client",
            total_ttc=1234.56,
            due_date="2024-02-15",
            pdf_content=b"PDF content",
        )
        
        assert result.success is True
        
        captured = capsys.readouterr()
        assert "INV-2024-0001" in captured.out
        assert "Test Client" in captured.out
    
    @pytest.mark.asyncio
    async def test_send_bulk_emails(self, email_service, capsys):
        """Test sending bulk emails."""
        messages = [
            {
                "to": f"user{i}@example.com",
                "subject": f"Bulk {i}",
                "body_text": f"Content {i}",
            }
            for i in range(3)
        ]
        
        results = await email_service.send_bulk_emails(messages)
        
        assert len(results) == 3
        assert all(r.success for r in results)
    
    def test_provider_name(self, email_service):
        """Test getting provider name."""
        assert email_service.provider_name == "console"

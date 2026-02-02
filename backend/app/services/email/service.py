"""
Email service for sending emails through configured providers.
"""

import logging
from typing import Optional
from functools import lru_cache

from app.core.config import settings
from .base import EmailProvider, EmailMessage, EmailResult
from .console_provider import ConsoleEmailProvider


logger = logging.getLogger(__name__)


class EmailService:
    """
    High-level email service that manages email providers and sending.
    
    This service:
    - Selects the appropriate provider based on configuration
    - Provides a unified interface for sending emails
    - Handles provider fallback (future enhancement)
    - Manages email templates (future enhancement)
    
    Usage:
        service = EmailService()
        result = await service.send_email(
            to=["user@example.com"],
            subject="Hello",
            body_text="Hello, World!",
        )
    """
    
    def __init__(
        self,
        provider: Optional[EmailProvider] = None,
        default_from_address: Optional[str] = None,
    ):
        """
        Initialize the email service.
        
        Args:
            provider: Email provider to use (auto-detected if not provided)
            default_from_address: Default sender address
        """
        self._provider = provider or self._create_default_provider()
        self._default_from_address = (
            default_from_address 
            or getattr(settings, "EMAIL_FROM_ADDRESS", "noreply@ecoled.com")
        )
        
    def _create_default_provider(self) -> EmailProvider:
        """
        Create the default email provider based on settings.
        
        Returns:
            Configured email provider
        """
        # Check environment/settings for provider type
        provider_type = getattr(settings, "EMAIL_PROVIDER", "console").lower()
        
        if provider_type == "console":
            # Use console provider for development
            return ConsoleEmailProvider(
                colorize=True,
                simulate_delay=False,
            )
        elif provider_type == "smtp":
            # Future: SMTP provider
            logger.warning("SMTP provider not yet implemented, falling back to console")
            return ConsoleEmailProvider(colorize=True)
        elif provider_type == "sendgrid":
            # Future: SendGrid provider
            logger.warning("SendGrid provider not yet implemented, falling back to console")
            return ConsoleEmailProvider(colorize=True)
        else:
            logger.warning(f"Unknown email provider '{provider_type}', using console")
            return ConsoleEmailProvider(colorize=True)
    
    @property
    def provider(self) -> EmailProvider:
        """Get the current email provider."""
        return self._provider
    
    @property
    def provider_name(self) -> str:
        """Get the current provider name."""
        return self._provider.name
    
    async def send_email(
        self,
        to: list[str] | str,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        from_address: Optional[str] = None,
        cc: Optional[list[str]] = None,
        bcc: Optional[list[str]] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[list[dict]] = None,
    ) -> EmailResult:
        """
        Send an email.
        
        Args:
            to: Recipient email address(es)
            subject: Email subject
            body_text: Plain text body
            body_html: HTML body (optional)
            from_address: Sender address (uses default if not provided)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)
            reply_to: Reply-to address (optional)
            attachments: List of attachment dicts with 'filename', 'content', 'content_type'
            
        Returns:
            EmailResult indicating success or failure
        """
        from .base import EmailAttachment
        
        # Normalize 'to' to list
        if isinstance(to, str):
            to = [to]
        
        # Validate recipients
        invalid_addresses = [
            addr for addr in to 
            if not self._provider.validate_address(addr)
        ]
        if invalid_addresses:
            return EmailResult(
                success=False,
                error=f"Invalid email addresses: {', '.join(invalid_addresses)}",
                provider=self.provider_name,
            )
        
        # Build attachments
        email_attachments = []
        if attachments:
            for att in attachments:
                email_attachments.append(EmailAttachment(
                    filename=att["filename"],
                    content=att["content"],
                    content_type=att.get("content_type", "application/octet-stream"),
                ))
        
        # Create message
        message = EmailMessage(
            to=to,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            cc=cc or [],
            bcc=bcc or [],
            reply_to=reply_to,
            attachments=email_attachments,
        )
        
        # Send
        sender = from_address or self._default_from_address
        
        try:
            result = await self._provider.send(message, sender)
            
            if result.success:
                logger.info(
                    f"Email sent successfully via {self.provider_name}: "
                    f"{subject} -> {', '.join(to)}"
                )
            else:
                logger.error(
                    f"Email failed via {self.provider_name}: "
                    f"{result.error}"
                )
            
            return result
            
        except Exception as e:
            logger.exception(f"Unexpected error sending email: {e}")
            return EmailResult(
                success=False,
                error=str(e),
                provider=self.provider_name,
            )
    
    async def send_invoice_email(
        self,
        to: str,
        invoice_reference: str,
        client_name: str,
        total_ttc: float,
        due_date: str,
        pdf_content: Optional[bytes] = None,
        from_address: Optional[str] = None,
    ) -> EmailResult:
        """
        Send an invoice email with optional PDF attachment.
        
        Args:
            to: Recipient email address
            invoice_reference: Invoice reference number
            client_name: Client name
            total_ttc: Total amount including tax
            due_date: Payment due date
            pdf_content: PDF invoice content (optional)
            from_address: Sender address (optional)
            
        Returns:
            EmailResult indicating success or failure
        """
        subject = f"Invoice {invoice_reference} - ECOLED"
        
        body_text = f"""
Dear {client_name},

Please find attached your invoice {invoice_reference}.

Invoice Details:
- Reference: {invoice_reference}
- Total Amount: €{total_ttc:,.2f}
- Due Date: {due_date}

Payment Terms:
Please ensure payment is made by the due date to avoid any late fees.

If you have any questions regarding this invoice, please don't hesitate to contact us.

Best regards,
ECOLED Team
        """.strip()
        
        body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #3B82F6; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f9f9f9; }}
        .invoice-details {{ background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }}
        .invoice-details table {{ width: 100%; border-collapse: collapse; }}
        .invoice-details td {{ padding: 8px 0; border-bottom: 1px solid #eee; }}
        .invoice-details td:last-child {{ text-align: right; font-weight: bold; }}
        .total {{ font-size: 1.2em; color: #3B82F6; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Invoice {invoice_reference}</h1>
        </div>
        <div class="content">
            <p>Dear {client_name},</p>
            <p>Please find attached your invoice.</p>
            
            <div class="invoice-details">
                <table>
                    <tr>
                        <td>Reference:</td>
                        <td>{invoice_reference}</td>
                    </tr>
                    <tr>
                        <td>Due Date:</td>
                        <td>{due_date}</td>
                    </tr>
                    <tr class="total">
                        <td>Total Amount:</td>
                        <td>€{total_ttc:,.2f}</td>
                    </tr>
                </table>
            </div>
            
            <p>Please ensure payment is made by the due date.</p>
            <p>If you have any questions, please contact us.</p>
            
            <p>Best regards,<br>ECOLED Team</p>
        </div>
        <div class="footer">
            <p>This is an automated email from ECOLED ERP System.</p>
        </div>
    </div>
</body>
</html>
        """.strip()
        
        attachments = None
        if pdf_content:
            attachments = [{
                "filename": f"{invoice_reference}.pdf",
                "content": pdf_content,
                "content_type": "application/pdf",
            }]
        
        return await self.send_email(
            to=to,
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            from_address=from_address,
            attachments=attachments,
        )
    
    async def send_bulk_emails(
        self,
        messages: list[dict],
        from_address: Optional[str] = None,
    ) -> list[EmailResult]:
        """
        Send multiple emails.
        
        Args:
            messages: List of message dicts with 'to', 'subject', 'body_text', etc.
            from_address: Sender address (optional)
            
        Returns:
            List of EmailResult for each message
        """
        from .base import EmailAttachment
        
        email_messages = []
        for msg in messages:
            to = msg["to"]
            if isinstance(to, str):
                to = [to]
            
            attachments = []
            if msg.get("attachments"):
                for att in msg["attachments"]:
                    attachments.append(EmailAttachment(
                        filename=att["filename"],
                        content=att["content"],
                        content_type=att.get("content_type", "application/octet-stream"),
                    ))
            
            email_messages.append(EmailMessage(
                to=to,
                subject=msg["subject"],
                body_text=msg["body_text"],
                body_html=msg.get("body_html"),
                cc=msg.get("cc", []),
                bcc=msg.get("bcc", []),
                reply_to=msg.get("reply_to"),
                attachments=attachments,
            ))
        
        sender = from_address or self._default_from_address
        return await self._provider.send_bulk(email_messages, sender)


# Singleton instance
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """
    Get the email service singleton.
    
    Returns:
        EmailService instance
    """
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service

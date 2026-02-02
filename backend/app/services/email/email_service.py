"""
Email Service - High-level email service for application use.

Provides a business-logic layer over email providers with support for:
- Template-based emails
- Invoice and quote emails
- Notification emails
- Email logging and tracking
"""
import re
from datetime import datetime
from typing import Optional, List, Dict, Any, Union

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.services.email.base import (
    BaseEmailProvider,
    EmailMessage,
    EmailAttachment,
    EmailResult,
    EmailStatus,
)
from app.services.email.ses_provider import SESEmailProvider

settings = get_settings()


class EmailServiceError(Exception):
    """Base exception for email service errors."""
    pass


class InvalidEmailError(EmailServiceError):
    """Invalid email address error."""
    pass


class EmailSendError(EmailServiceError):
    """Email send failed error."""
    pass


class EmailTemplateError(EmailServiceError):
    """Email template error."""
    pass


class EmailService:
    """
    High-level email service for application use.

    Provides business-logic methods for sending various types of emails
    including invoices, quotes, notifications, and templated emails.
    """

    # Email validation regex
    EMAIL_REGEX = re.compile(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    )

    def __init__(
        self,
        db: AsyncSession,
        provider: Optional[BaseEmailProvider] = None,
    ):
        """
        Initialize the email service.

        Args:
            db: Async database session
            provider: Email provider (defaults to SESEmailProvider)
        """
        self.db = db
        self._provider = provider

    @property
    def provider(self) -> BaseEmailProvider:
        """Get the email provider, initializing if needed."""
        if self._provider is None:
            self._provider = SESEmailProvider()
        return self._provider

    def _validate_email(self, email: str) -> bool:
        """Validate email address format."""
        return bool(self.EMAIL_REGEX.match(email))

    def _validate_emails(self, emails: List[str]) -> List[str]:
        """Validate list of emails, return invalid ones."""
        return [e for e in emails if not self._validate_email(e)]

    async def send_email(
        self,
        to: Union[str, List[str]],
        subject: str,
        body_html: str,
        body_text: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        from_address: Optional[str] = None,
        from_name: Optional[str] = None,
        attachments: Optional[List[EmailAttachment]] = None,
        tags: Optional[Dict[str, str]] = None,
    ) -> EmailResult:
        """
        Send a single email.

        Args:
            to: Recipient email address(es)
            subject: Email subject
            body_html: HTML body content
            body_text: Plain text body (generated from HTML if not provided)
            cc: CC recipients
            bcc: BCC recipients
            reply_to: Reply-to address
            from_address: Sender address (uses default if not provided)
            from_name: Sender display name
            attachments: List of attachments
            tags: Tags for tracking

        Returns:
            EmailResult with send status

        Raises:
            InvalidEmailError: If any email address is invalid
        """
        # Normalize to list
        if isinstance(to, str):
            to = [to]

        # Validate all emails
        all_emails = to + (cc or []) + (bcc or [])
        invalid = self._validate_emails(all_emails)
        if invalid:
            raise InvalidEmailError(f"Invalid email addresses: {', '.join(invalid)}")

        # Create message
        message = EmailMessage(
            to=to,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            cc=cc,
            bcc=bcc,
            reply_to=reply_to,
            from_address=from_address,
            from_name=from_name,
            attachments=attachments or [],
            tags=tags or {},
        )

        # Send via provider
        result = await self.provider.send(message)

        if not result.success:
            raise EmailSendError(
                f"Failed to send email: {result.error_message}"
            )

        return result

    async def send_invoice_email(
        self,
        to: Union[str, List[str]],
        invoice_number: str,
        client_name: str,
        total_amount: float,
        currency: str = "EUR",
        due_date: Optional[datetime] = None,
        pdf_content: Optional[bytes] = None,
        additional_message: Optional[str] = None,
        cc_accounting: bool = True,
    ) -> EmailResult:
        """
        Send an invoice email to a client.

        Args:
            to: Recipient email address(es)
            invoice_number: Invoice reference number
            client_name: Client/company name
            total_amount: Invoice total amount
            currency: Currency code (default EUR)
            due_date: Payment due date
            pdf_content: PDF invoice as bytes
            additional_message: Additional message to include
            cc_accounting: Whether to CC accounting email

        Returns:
            EmailResult with send status
        """
        if isinstance(to, str):
            to = [to]

        # Build subject
        subject = f"Invoice {invoice_number} - {client_name}"

        # Build HTML body
        due_date_str = due_date.strftime("%d/%m/%Y") if due_date else "See invoice"
        amount_str = f"{total_amount:,.2f} {currency}"

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Invoice {invoice_number}</h2>
            <p>Dear {client_name},</p>
            <p>Please find attached your invoice with the following details:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{invoice_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{amount_str}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{due_date_str}</td>
                </tr>
            </table>
            {"<p>" + additional_message + "</p>" if additional_message else ""}
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
            <p>Thank you for your business.</p>
            <p>Best regards,<br>Ecoled Team</p>
        </body>
        </html>
        """

        # Prepare attachments
        attachments = []
        if pdf_content:
            attachments.append(EmailAttachment(
                filename=f"Invoice_{invoice_number}.pdf",
                content=pdf_content,
                content_type="application/pdf",
            ))

        # Prepare CC
        cc = []
        if cc_accounting and settings.ACCOUNTING_CC_EMAIL:
            cc.append(settings.ACCOUNTING_CC_EMAIL)

        # Tags for tracking
        tags = {
            "type": "invoice",
            "invoice_number": invoice_number,
        }

        return await self.send_email(
            to=to,
            subject=subject,
            body_html=body_html,
            cc=cc if cc else None,
            attachments=attachments,
            tags=tags,
        )

    async def send_quote_email(
        self,
        to: Union[str, List[str]],
        quote_number: str,
        client_name: str,
        total_amount: float,
        currency: str = "EUR",
        valid_until: Optional[datetime] = None,
        pdf_content: Optional[bytes] = None,
        additional_message: Optional[str] = None,
    ) -> EmailResult:
        """
        Send a quote/proposal email to a client.

        Args:
            to: Recipient email address(es)
            quote_number: Quote reference number
            client_name: Client/company name
            total_amount: Quote total amount
            currency: Currency code
            valid_until: Quote validity date
            pdf_content: PDF quote as bytes
            additional_message: Additional message

        Returns:
            EmailResult with send status
        """
        if isinstance(to, str):
            to = [to]

        subject = f"Quote {quote_number} - {client_name}"

        valid_until_str = valid_until.strftime("%d/%m/%Y") if valid_until else "See quote"
        amount_str = f"{total_amount:,.2f} {currency}"

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Quote {quote_number}</h2>
            <p>Dear {client_name},</p>
            <p>Thank you for your interest. Please find attached our quote with the following details:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Quote Number:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{quote_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{amount_str}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Valid Until:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{valid_until_str}</td>
                </tr>
            </table>
            {"<p>" + additional_message + "</p>" if additional_message else ""}
            <p>If you have any questions or would like to proceed, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Ecoled Team</p>
        </body>
        </html>
        """

        attachments = []
        if pdf_content:
            attachments.append(EmailAttachment(
                filename=f"Quote_{quote_number}.pdf",
                content=pdf_content,
                content_type="application/pdf",
            ))

        tags = {
            "type": "quote",
            "quote_number": quote_number,
        }

        return await self.send_email(
            to=to,
            subject=subject,
            body_html=body_html,
            attachments=attachments,
            tags=tags,
        )

    async def send_delivery_notification(
        self,
        to: Union[str, List[str]],
        delivery_number: str,
        client_name: str,
        items_count: int,
        delivery_date: Optional[datetime] = None,
        tracking_number: Optional[str] = None,
        pdf_content: Optional[bytes] = None,
    ) -> EmailResult:
        """
        Send a delivery notification email.

        Args:
            to: Recipient email address(es)
            delivery_number: Delivery reference number
            client_name: Client/company name
            items_count: Number of items being delivered
            delivery_date: Expected delivery date
            tracking_number: Shipping tracking number
            pdf_content: PDF delivery note as bytes

        Returns:
            EmailResult with send status
        """
        if isinstance(to, str):
            to = [to]

        subject = f"Delivery Notification - {delivery_number}"

        date_str = delivery_date.strftime("%d/%m/%Y") if delivery_date else "To be confirmed"

        tracking_html = ""
        if tracking_number:
            tracking_html = f"""
            <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tracking Number:</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">{tracking_number}</td>
            </tr>
            """

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Delivery Notification</h2>
            <p>Dear {client_name},</p>
            <p>Your order is on its way! Here are the delivery details:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Delivery Number:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{delivery_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Items:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{items_count} item(s)</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Expected Delivery:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{date_str}</td>
                </tr>
                {tracking_html}
            </table>
            <p>If you have any questions about your delivery, please contact us.</p>
            <p>Best regards,<br>Ecoled Team</p>
        </body>
        </html>
        """

        attachments = []
        if pdf_content:
            attachments.append(EmailAttachment(
                filename=f"Delivery_{delivery_number}.pdf",
                content=pdf_content,
                content_type="application/pdf",
            ))

        tags = {
            "type": "delivery",
            "delivery_number": delivery_number,
        }

        return await self.send_email(
            to=to,
            subject=subject,
            body_html=body_html,
            attachments=attachments,
            tags=tags,
        )

    async def send_order_confirmation(
        self,
        to: Union[str, List[str]],
        order_number: str,
        client_name: str,
        total_amount: float,
        currency: str = "EUR",
        items: Optional[List[Dict[str, Any]]] = None,
        pdf_content: Optional[bytes] = None,
    ) -> EmailResult:
        """
        Send an order confirmation email.

        Args:
            to: Recipient email address(es)
            order_number: Order reference number
            client_name: Client/company name
            total_amount: Order total amount
            currency: Currency code
            items: List of order items
            pdf_content: PDF order confirmation as bytes

        Returns:
            EmailResult with send status
        """
        if isinstance(to, str):
            to = [to]

        subject = f"Order Confirmation - {order_number}"
        amount_str = f"{total_amount:,.2f} {currency}"

        # Build items table if provided
        items_html = ""
        if items:
            items_rows = ""
            for item in items:
                items_rows += f"""
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">{item.get('reference', '-')}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{item.get('description', '-')}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">{item.get('quantity', 0)}</td>
                </tr>
                """
            items_html = f"""
            <h3>Order Items:</h3>
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <tr style="background-color: #f5f5f5;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Reference</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Description</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Qty</th>
                </tr>
                {items_rows}
            </table>
            """

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Order Confirmation</h2>
            <p>Dear {client_name},</p>
            <p>Thank you for your order. Your order has been confirmed with the following details:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Order Number:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{order_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Total Amount:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{amount_str}</td>
                </tr>
            </table>
            {items_html}
            <p>We will notify you when your order is shipped.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>Ecoled Team</p>
        </body>
        </html>
        """

        attachments = []
        if pdf_content:
            attachments.append(EmailAttachment(
                filename=f"Order_{order_number}.pdf",
                content=pdf_content,
                content_type="application/pdf",
            ))

        tags = {
            "type": "order_confirmation",
            "order_number": order_number,
        }

        return await self.send_email(
            to=to,
            subject=subject,
            body_html=body_html,
            attachments=attachments,
            tags=tags,
        )

    async def send_payment_reminder(
        self,
        to: Union[str, List[str]],
        invoice_number: str,
        client_name: str,
        total_amount: float,
        currency: str = "EUR",
        due_date: datetime = None,
        days_overdue: int = 0,
    ) -> EmailResult:
        """
        Send a payment reminder email.

        Args:
            to: Recipient email address(es)
            invoice_number: Invoice reference number
            client_name: Client/company name
            total_amount: Outstanding amount
            currency: Currency code
            due_date: Original due date
            days_overdue: Number of days overdue

        Returns:
            EmailResult with send status
        """
        if isinstance(to, str):
            to = [to]

        subject = f"Payment Reminder - Invoice {invoice_number}"
        amount_str = f"{total_amount:,.2f} {currency}"
        due_date_str = due_date.strftime("%d/%m/%Y") if due_date else "N/A"

        urgency_message = ""
        if days_overdue > 30:
            urgency_message = "<p style='color: #c0392b;'><strong>This invoice is significantly overdue. Please arrange payment immediately to avoid any further action.</strong></p>"
        elif days_overdue > 0:
            urgency_message = f"<p style='color: #e67e22;'>This invoice is {days_overdue} days overdue. Please arrange payment as soon as possible.</p>"

        body_html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Payment Reminder</h2>
            <p>Dear {client_name},</p>
            <p>This is a friendly reminder that the following invoice is awaiting payment:</p>
            <table style="border-collapse: collapse; margin: 20px 0;">
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{invoice_number}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Due:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{amount_str}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">{due_date_str}</td>
                </tr>
            </table>
            {urgency_message}
            <p>If you have already made this payment, please disregard this reminder.</p>
            <p>If you have any questions or concerns regarding this invoice, please contact us.</p>
            <p>Best regards,<br>Ecoled Team</p>
        </body>
        </html>
        """

        tags = {
            "type": "payment_reminder",
            "invoice_number": invoice_number,
            "days_overdue": str(days_overdue),
        }

        return await self.send_email(
            to=to,
            subject=subject,
            body_html=body_html,
            tags=tags,
        )

    async def send_templated_email(
        self,
        to: Union[str, List[str]],
        subject: str,
        template: str,
        context: Dict[str, Any],
        **kwargs,
    ) -> EmailResult:
        """
        Send an email using a template with variable substitution.

        Args:
            to: Recipient email address(es)
            subject: Email subject (can contain {variables})
            template: HTML template with {variable} placeholders
            context: Dictionary of variables to substitute
            **kwargs: Additional arguments passed to send_email

        Returns:
            EmailResult with send status
        """
        # Simple template substitution
        try:
            rendered_subject = subject.format(**context)
            rendered_body = template.format(**context)
        except KeyError as e:
            raise EmailTemplateError(f"Missing template variable: {e}")

        return await self.send_email(
            to=to,
            subject=rendered_subject,
            body_html=rendered_body,
            **kwargs,
        )

    async def get_provider_statistics(self) -> Dict[str, Any]:
        """
        Get email provider statistics.

        Returns:
            Dictionary with provider statistics
        """
        return await self.provider.get_send_statistics()

    def is_provider_configured(self) -> bool:
        """
        Check if the email provider is configured.

        Returns:
            True if provider is ready to send
        """
        return self.provider.is_configured()


# Factory function for dependency injection
async def get_email_service(db: AsyncSession) -> EmailService:
    """
    Factory function for creating EmailService instances.
    Used as a FastAPI dependency.

    Args:
        db: Async database session

    Returns:
        EmailService instance
    """
    return EmailService(db)

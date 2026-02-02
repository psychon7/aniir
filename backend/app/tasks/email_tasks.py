"""
Email Celery Tasks.

Provides background tasks for:
- Sending daily invoice reports to clients
- Invoice email notifications
- Payment reminder emails
- Overdue invoice notifications

Tasks are designed to be idempotent and handle email delivery failures with retries.
"""
import logging
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any, List
from decimal import Decimal
from celery import shared_task
from celery.exceptions import MaxRetriesExceededError
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.tasks.celery_app import celery_app
from app.tasks.exceptions import (
    TaskError,
    EmailTaskError,
    EmailConnectionError,
    EmailConfigurationError,
    EmailDeliveryError,
    EmailTemplateError,
)
from app.config import get_settings
from app.database import get_sync_session
from app.models.invoice import ClientInvoice, ClientInvoiceLine
from app.models.client import Client

# Import SES provider for async email operations
try:
    from app.services.email import (
        SESEmailProvider,
        EmailService,
        EmailMessage,
        EmailAttachment,
    )
    SES_AVAILABLE = True
except ImportError:
    SES_AVAILABLE = False

logger = logging.getLogger(__name__)


# =============================================================================
# Configuration Helpers
# =============================================================================


def _get_email_config() -> Dict[str, Any]:
    """
    Get email configuration from settings.

    Returns:
        Dict containing email configuration.

    Raises:
        EmailConfigurationError: If required settings are missing.
    """
    settings = get_settings()

    # Determine email provider
    provider = getattr(settings, 'EMAIL_PROVIDER', 'smtp')

    if provider == 'ses':
        # SES configuration
        missing = []
        if not settings.EMAIL_FROM_ADDRESS:
            missing.append("EMAIL_FROM_ADDRESS")
        if not settings.AWS_ACCESS_KEY_ID:
            missing.append("AWS_ACCESS_KEY_ID")
        if not settings.AWS_SECRET_ACCESS_KEY:
            missing.append("AWS_SECRET_ACCESS_KEY")

        if missing:
            raise EmailConfigurationError(
                message="Missing required SES email configuration",
                missing_settings=missing,
            )

        return {
            "provider": "ses",
            "from_address": settings.EMAIL_FROM_ADDRESS,
            "from_name": getattr(settings, 'EMAIL_FROM_NAME', None),
            "aws_region": getattr(settings, 'SES_REGION', None) or settings.AWS_REGION,
            "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
            "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
            "configuration_set": getattr(settings, 'SES_CONFIGURATION_SET', None),
            "accounting_cc": settings.ACCOUNTING_CC_EMAIL,
        }
    else:
        # SMTP configuration (default)
        missing = []
        if not settings.EMAIL_FROM_ADDRESS:
            missing.append("EMAIL_FROM_ADDRESS")
        if not settings.SMTP_HOST:
            missing.append("SMTP_HOST")

        if missing:
            raise EmailConfigurationError(
                message="Missing required email configuration",
                missing_settings=missing,
            )

        return {
            "provider": "smtp",
            "from_address": settings.EMAIL_FROM_ADDRESS,
            "from_name": getattr(settings, 'EMAIL_FROM_NAME', None),
            "smtp_host": settings.SMTP_HOST,
            "smtp_port": settings.SMTP_PORT,
            "smtp_username": settings.SMTP_USERNAME,
            "smtp_password": settings.SMTP_PASSWORD,
            "smtp_use_tls": settings.SMTP_USE_TLS,
            "accounting_cc": settings.ACCOUNTING_CC_EMAIL,
        }


def _log_task_start(task_name: str, **kwargs) -> None:
    """Log task start with parameters."""
    logger.info(f"Starting task: {task_name}", extra={"task": task_name, "params": kwargs})


def _log_task_success(task_name: str, result: Dict[str, Any]) -> None:
    """Log task success with result."""
    logger.info(f"Task completed: {task_name}", extra={"task": task_name, "result": result})


def _log_task_failure(task_name: str, error: Exception) -> None:
    """Log task failure with error details."""
    error_details = error.to_dict() if isinstance(error, TaskError) else {"error": str(error)}
    logger.error(f"Task failed: {task_name}", extra={"task": task_name, "error": error_details}, exc_info=True)


# =============================================================================
# Email Sending Helper
# =============================================================================


def _send_email(
    to_addresses: List[str],
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    cc_addresses: Optional[List[str]] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    config: Optional[Dict[str, Any]] = None,
    tags: Optional[Dict[str, str]] = None,
) -> bool:
    """
    Send an email using configured provider (SMTP or SES).

    Args:
        to_addresses: List of recipient email addresses.
        subject: Email subject.
        body_html: HTML body content.
        body_text: Optional plain text body (fallback).
        cc_addresses: Optional list of CC addresses.
        attachments: Optional list of attachments.
        config: Email configuration (if not provided, fetched from settings).
        tags: Optional tags for email tracking (SES only).

    Returns:
        True if email was sent successfully.

    Raises:
        EmailConnectionError: If connection fails.
        EmailDeliveryError: If email delivery fails.
    """
    if config is None:
        config = _get_email_config()

    provider = config.get("provider", "smtp")

    if provider == "ses" and SES_AVAILABLE:
        return _send_email_ses(
            to_addresses=to_addresses,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            cc_addresses=cc_addresses,
            attachments=attachments,
            config=config,
            tags=tags,
        )
    else:
        return _send_email_smtp(
            to_addresses=to_addresses,
            subject=subject,
            body_html=body_html,
            body_text=body_text,
            cc_addresses=cc_addresses,
            attachments=attachments,
            config=config,
        )


def _send_email_ses(
    to_addresses: List[str],
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    cc_addresses: Optional[List[str]] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    config: Optional[Dict[str, Any]] = None,
    tags: Optional[Dict[str, str]] = None,
) -> bool:
    """
    Send an email using AWS SES.

    Args:
        to_addresses: List of recipient email addresses.
        subject: Email subject.
        body_html: HTML body content.
        body_text: Optional plain text body.
        cc_addresses: Optional list of CC addresses.
        attachments: Optional list of attachments (dict with 'content', 'filename', 'content_type').
        config: SES configuration.
        tags: Optional tags for email tracking.

    Returns:
        True if email was sent successfully.

    Raises:
        EmailDeliveryError: If email delivery fails.
    """
    import asyncio

    if not SES_AVAILABLE:
        raise EmailConfigurationError(
            message="SES provider is not available. Install required dependencies."
        )

    # Create SES provider
    provider = SESEmailProvider(
        region=config.get("aws_region"),
        access_key_id=config.get("aws_access_key_id"),
        secret_access_key=config.get("aws_secret_access_key"),
        default_from_address=config.get("from_address"),
        default_from_name=config.get("from_name"),
        configuration_set=config.get("configuration_set"),
    )

    # Convert attachments to EmailAttachment objects
    email_attachments = []
    if attachments:
        for att in attachments:
            email_attachments.append(EmailAttachment(
                filename=att.get("filename", "attachment"),
                content=att.get("content", b""),
                content_type=att.get("content_type", "application/octet-stream"),
            ))

    # Create email message
    message = EmailMessage(
        to=to_addresses,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        cc=cc_addresses,
        from_address=config.get("from_address"),
        from_name=config.get("from_name"),
        attachments=email_attachments,
        tags=tags or {},
    )

    # Run async send in sync context
    def run_sync():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(provider.send(message))
        finally:
            loop.close()

    try:
        result = run_sync()

        if result.success:
            logger.info(f"Email sent via SES to {to_addresses}, message_id: {result.message_id}")
            return True
        else:
            raise EmailDeliveryError(
                message=f"SES send failed: {result.error_message}",
                recipients=to_addresses,
            )

    except Exception as e:
        if isinstance(e, EmailDeliveryError):
            raise
        raise EmailDeliveryError(
            message=f"Failed to send email via SES: {e}",
            recipients=to_addresses,
        )


def _send_email_smtp(
    to_addresses: List[str],
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    cc_addresses: Optional[List[str]] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    config: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Send an email using SMTP.

    Args:
        to_addresses: List of recipient email addresses.
        subject: Email subject.
        body_html: HTML body content.
        body_text: Optional plain text body (fallback).
        cc_addresses: Optional list of CC addresses.
        attachments: Optional list of attachments.
        config: SMTP configuration.

    Returns:
        True if email was sent successfully.

    Raises:
        EmailConnectionError: If SMTP connection fails.
        EmailDeliveryError: If email delivery fails.
    """
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from email.mime.base import MIMEBase
    from email import encoders

    if config is None:
        config = _get_email_config()

    # Create message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = config["from_address"]
    msg["To"] = ", ".join(to_addresses)

    if cc_addresses:
        msg["Cc"] = ", ".join(cc_addresses)

    # Add plain text body
    if body_text:
        msg.attach(MIMEText(body_text, "plain", "utf-8"))

    # Add HTML body
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    # Add attachments
    if attachments:
        for attachment in attachments:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment["content"])
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{attachment["filename"]}"',
            )
            msg.attach(part)

    # All recipients
    all_recipients = to_addresses + (cc_addresses or [])

    try:
        # Connect to SMTP server
        if config.get("smtp_use_tls"):
            server = smtplib.SMTP(config["smtp_host"], config["smtp_port"])
            server.starttls()
        else:
            server = smtplib.SMTP(config["smtp_host"], config["smtp_port"])

        # Authenticate if credentials provided
        if config.get("smtp_username") and config.get("smtp_password"):
            server.login(config["smtp_username"], config["smtp_password"])

        # Send email
        server.sendmail(config["from_address"], all_recipients, msg.as_string())
        server.quit()

        logger.info(f"Email sent successfully via SMTP to {to_addresses}")
        return True

    except smtplib.SMTPConnectError as e:
        raise EmailConnectionError(
            message=f"Failed to connect to SMTP server: {e}",
            details={"smtp_host": config["smtp_host"], "smtp_port": config["smtp_port"]},
        )
    except smtplib.SMTPAuthenticationError as e:
        raise EmailConfigurationError(
            message=f"SMTP authentication failed: {e}",
        )
    except smtplib.SMTPException as e:
        raise EmailDeliveryError(
            message=f"Failed to send email: {e}",
            recipients=to_addresses,
        )


# =============================================================================
# Invoice Email Templates
# =============================================================================


def _generate_daily_invoice_email_html(
    client_name: str,
    invoices: List[Dict[str, Any]],
    total_amount: Decimal,
    total_due: Decimal,
    currency: str = "EUR",
) -> str:
    """
    Generate HTML content for daily invoice email.

    Args:
        client_name: Name of the client.
        invoices: List of invoice dictionaries.
        total_amount: Total amount of all invoices.
        total_due: Total amount due.
        currency: Currency code.

    Returns:
        HTML string for the email body.
    """
    invoice_rows = ""
    for inv in invoices:
        status_color = "#28a745" if inv["is_paid"] else ("#dc3545" if inv["is_overdue"] else "#ffc107")
        status_text = "Paid" if inv["is_paid"] else ("Overdue" if inv["is_overdue"] else "Pending")
        invoice_rows += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">{inv['reference']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">{inv['date'].strftime('%d/%m/%Y')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">{inv['due_date'].strftime('%d/%m/%Y')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">{currency} {inv['total_amount']:,.2f}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">{currency} {inv['amount_due']:,.2f}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                <span style="background-color: {status_color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{status_text}</span>
            </td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: #0056b3; margin: 0;">Daily Invoice Summary</h1>
            <p style="margin: 10px 0 0 0; color: #666;">Generated on {datetime.now().strftime('%d/%m/%Y at %H:%M')}</p>
        </div>

        <p>Dear <strong>{client_name}</strong>,</p>

        <p>Please find below your invoice summary:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background-color: #0056b3; color: white;">
                    <th style="padding: 12px; text-align: left;">Invoice #</th>
                    <th style="padding: 12px; text-align: left;">Date</th>
                    <th style="padding: 12px; text-align: left;">Due Date</th>
                    <th style="padding: 12px; text-align: right;">Amount</th>
                    <th style="padding: 12px; text-align: right;">Balance Due</th>
                    <th style="padding: 12px; text-align: left;">Status</th>
                </tr>
            </thead>
            <tbody>
                {invoice_rows}
            </tbody>
            <tfoot>
                <tr style="background-color: #f8f9fa; font-weight: bold;">
                    <td colspan="3" style="padding: 12px;">Total</td>
                    <td style="padding: 12px; text-align: right;">{currency} {total_amount:,.2f}</td>
                    <td style="padding: 12px; text-align: right;">{currency} {total_due:,.2f}</td>
                    <td></td>
                </tr>
            </tfoot>
        </table>

        <p>If you have any questions regarding these invoices, please don't hesitate to contact us.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 14px;">
            <p>Best regards,<br>
            <strong>ECOLED Accounting Team</strong></p>
            <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
    </body>
    </html>
    """
    return html


def _generate_daily_invoice_email_text(
    client_name: str,
    invoices: List[Dict[str, Any]],
    total_amount: Decimal,
    total_due: Decimal,
    currency: str = "EUR",
) -> str:
    """
    Generate plain text content for daily invoice email.

    Args:
        client_name: Name of the client.
        invoices: List of invoice dictionaries.
        total_amount: Total amount of all invoices.
        total_due: Total amount due.
        currency: Currency code.

    Returns:
        Plain text string for the email body.
    """
    lines = [
        "DAILY INVOICE SUMMARY",
        f"Generated on {datetime.now().strftime('%d/%m/%Y at %H:%M')}",
        "",
        f"Dear {client_name},",
        "",
        "Please find below your invoice summary:",
        "",
        "-" * 80,
        f"{'Invoice #':<15} {'Date':<12} {'Due Date':<12} {'Amount':>15} {'Due':>15} {'Status':<10}",
        "-" * 80,
    ]

    for inv in invoices:
        status = "Paid" if inv["is_paid"] else ("Overdue" if inv["is_overdue"] else "Pending")
        lines.append(
            f"{inv['reference']:<15} "
            f"{inv['date'].strftime('%d/%m/%Y'):<12} "
            f"{inv['due_date'].strftime('%d/%m/%Y'):<12} "
            f"{currency} {inv['total_amount']:>10,.2f} "
            f"{currency} {inv['amount_due']:>10,.2f} "
            f"{status:<10}"
        )

    lines.extend([
        "-" * 80,
        f"{'TOTAL':<41} {currency} {total_amount:>10,.2f} {currency} {total_due:>10,.2f}",
        "",
        "If you have any questions regarding these invoices, please don't hesitate to contact us.",
        "",
        "Best regards,",
        "ECOLED Accounting Team",
        "",
        "This is an automated message. Please do not reply directly to this email.",
    ])

    return "\n".join(lines)


# =============================================================================
# Daily Invoice Email Task
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.email_tasks.send_daily_invoices_task",
    max_retries=3,
    default_retry_delay=300,
    autoretry_for=(EmailConnectionError,),
    retry_backoff=True,
    retry_backoff_max=3600,
    retry_jitter=True,
)
def send_daily_invoices_task(
    self,
    client_id: Optional[int] = None,
    include_paid: bool = False,
    days_back: int = 30,
    society_id: Optional[int] = None,
    bu_id: Optional[int] = None,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """
    Send daily invoice summary emails to clients.

    This task queries invoices and sends summary emails to clients with
    outstanding or recent invoices.

    Args:
        client_id: Optional specific client ID to send to (if None, sends to all eligible).
        include_paid: If True, include fully paid invoices in the summary.
        days_back: Number of days to look back for invoices (default: 30).
        society_id: Optional filter by society/company.
        bu_id: Optional filter by business unit.
        dry_run: If True, don't actually send emails (for testing).

    Returns:
        Dict with sending statistics:
            - emails_sent: Number of emails sent.
            - emails_failed: Number of failed emails.
            - clients_processed: Number of clients processed.
            - invoices_included: Total invoices included.
            - errors: List of error details.

    Raises:
        EmailConfigurationError: If email configuration is invalid.
        EmailDeliveryError: If email delivery fails after retries.
    """
    task_name = "send_daily_invoices_task"
    _log_task_start(
        task_name,
        client_id=client_id,
        include_paid=include_paid,
        days_back=days_back,
        society_id=society_id,
        bu_id=bu_id,
        dry_run=dry_run,
    )

    result = {
        "emails_sent": 0,
        "emails_failed": 0,
        "clients_processed": 0,
        "invoices_included": 0,
        "errors": [],
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "dry_run": dry_run,
    }

    try:
        # Get email config (validates settings)
        if not dry_run:
            config = _get_email_config()
        else:
            config = None

        settings = get_settings()
        date_threshold = datetime.now() - timedelta(days=days_back)

        with get_sync_session() as session:
            # Build query for clients with invoices
            client_query = select(Client).where(
                Client.cli_is_active == True,
                Client.cli_email.isnot(None),
            )

            if client_id:
                client_query = client_query.where(Client.cli_id == client_id)

            clients = session.execute(client_query).scalars().all()

            for client in clients:
                try:
                    # Build invoice query for this client
                    invoice_conditions = [
                        ClientInvoice.inv_cli_id == client.cli_id,
                        ClientInvoice.inv_date >= date_threshold,
                    ]

                    if society_id:
                        invoice_conditions.append(ClientInvoice.inv_soc_id == society_id)

                    if bu_id:
                        invoice_conditions.append(ClientInvoice.inv_bu_id == bu_id)

                    # Exclude draft, cancelled, and void invoices
                    # STATUS_DRAFT = 1, STATUS_CANCELLED = 6, STATUS_VOID = 7
                    invoice_conditions.append(
                        ClientInvoice.inv_sta_id.notin_([1, 6, 7])
                    )

                    if not include_paid:
                        # Exclude fully paid invoices
                        invoice_conditions.append(
                            ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount
                        )

                    invoice_query = (
                        select(ClientInvoice)
                        .where(and_(*invoice_conditions))
                        .order_by(ClientInvoice.inv_date.desc())
                    )

                    invoices = session.execute(invoice_query).scalars().all()

                    if not invoices:
                        continue  # Skip clients with no eligible invoices

                    result["clients_processed"] += 1
                    result["invoices_included"] += len(invoices)

                    # Prepare invoice data for email
                    invoice_data = []
                    total_amount = Decimal("0")
                    total_due = Decimal("0")

                    for inv in invoices:
                        is_overdue = datetime.now() > inv.inv_due_date and inv.inv_amount_paid < inv.inv_total_amount
                        is_paid = inv.inv_amount_paid >= inv.inv_total_amount

                        invoice_data.append({
                            "reference": inv.inv_reference,
                            "date": inv.inv_date,
                            "due_date": inv.inv_due_date,
                            "total_amount": inv.inv_total_amount,
                            "amount_due": inv.inv_total_amount - inv.inv_amount_paid,
                            "is_overdue": is_overdue,
                            "is_paid": is_paid,
                        })

                        total_amount += inv.inv_total_amount
                        total_due += (inv.inv_total_amount - inv.inv_amount_paid)

                    # Generate email content
                    client_name = client.cli_company_name or f"{client.cli_first_name or ''} {client.cli_last_name or ''}".strip()
                    html_body = _generate_daily_invoice_email_html(
                        client_name=client_name,
                        invoices=invoice_data,
                        total_amount=total_amount,
                        total_due=total_due,
                    )
                    text_body = _generate_daily_invoice_email_text(
                        client_name=client_name,
                        invoices=invoice_data,
                        total_amount=total_amount,
                        total_due=total_due,
                    )

                    subject = f"Invoice Summary - {client_name} - {datetime.now().strftime('%d/%m/%Y')}"

                    # Prepare CC list
                    cc_addresses = []
                    if settings.ACCOUNTING_CC_EMAIL:
                        cc_addresses.append(settings.ACCOUNTING_CC_EMAIL)

                    if dry_run:
                        logger.info(
                            f"[DRY RUN] Would send email to {client.cli_email} with {len(invoices)} invoices"
                        )
                        result["emails_sent"] += 1
                    else:
                        # Send the email
                        _send_email(
                            to_addresses=[client.cli_email],
                            subject=subject,
                            body_html=html_body,
                            body_text=text_body,
                            cc_addresses=cc_addresses if cc_addresses else None,
                            config=config,
                        )
                        result["emails_sent"] += 1
                        logger.info(f"Sent invoice summary to {client.cli_email}")

                except EmailDeliveryError as e:
                    result["emails_failed"] += 1
                    result["errors"].append({
                        "client_id": client.cli_id,
                        "client_email": client.cli_email,
                        "error": str(e),
                    })
                    logger.warning(f"Failed to send email to client {client.cli_id}: {e}")
                except Exception as e:
                    result["emails_failed"] += 1
                    result["errors"].append({
                        "client_id": client.cli_id,
                        "error": str(e),
                    })
                    logger.error(f"Unexpected error for client {client.cli_id}: {e}", exc_info=True)

        result["completed_at"] = datetime.utcnow().isoformat()
        _log_task_success(task_name, result)
        return result

    except EmailConfigurationError as e:
        _log_task_failure(task_name, e)
        raise  # Don't retry config errors
    except EmailConnectionError as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        result["errors"].append({"error": str(e)})
        result["completed_at"] = datetime.utcnow().isoformat()
        raise EmailTaskError(
            message=f"Daily invoice email task failed: {str(e)}",
        )


# =============================================================================
# Single Invoice Email Task
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.email_tasks.send_invoice_email_task",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(EmailConnectionError,),
    retry_backoff=True,
    retry_backoff_max=600,
    retry_jitter=True,
)
def send_invoice_email_task(
    self,
    invoice_id: int,
    recipient_email: Optional[str] = None,
    cc_accounting: bool = True,
    include_pdf: bool = False,
) -> Dict[str, Any]:
    """
    Send a single invoice email to a client.

    Args:
        invoice_id: ID of the invoice to send.
        recipient_email: Optional override recipient email.
        cc_accounting: If True, CC the accounting email.
        include_pdf: If True, attach PDF (if available).

    Returns:
        Dict with result:
            - success: Boolean indicating success.
            - invoice_reference: The invoice reference.
            - recipient: Email recipient.
            - error: Error message if failed.

    Raises:
        EmailConfigurationError: If email configuration is invalid.
        EmailDeliveryError: If email delivery fails.
    """
    task_name = "send_invoice_email_task"
    _log_task_start(task_name, invoice_id=invoice_id, recipient_email=recipient_email)

    result = {
        "success": False,
        "invoice_id": invoice_id,
        "invoice_reference": None,
        "recipient": None,
        "sent_at": None,
        "error": None,
    }

    try:
        config = _get_email_config()
        settings = get_settings()

        with get_sync_session() as session:
            # Get invoice with client
            invoice_query = (
                select(ClientInvoice)
                .options(selectinload(ClientInvoice.lines))
                .where(ClientInvoice.inv_id == invoice_id)
            )
            invoice = session.execute(invoice_query).scalar_one_or_none()

            if not invoice:
                raise EmailTaskError(
                    message=f"Invoice with ID {invoice_id} not found",
                    code="INVOICE_NOT_FOUND",
                )

            result["invoice_reference"] = invoice.inv_reference

            # Get client
            client_query = select(Client).where(Client.cli_id == invoice.inv_cli_id)
            client = session.execute(client_query).scalar_one_or_none()

            if not client:
                raise EmailTaskError(
                    message=f"Client not found for invoice {invoice_id}",
                    code="CLIENT_NOT_FOUND",
                )

            # Determine recipient
            to_email = recipient_email or client.cli_email
            if not to_email:
                raise EmailTaskError(
                    message=f"No email address available for client {client.cli_id}",
                    code="NO_EMAIL_ADDRESS",
                )

            result["recipient"] = to_email

            # Prepare invoice data
            is_overdue = datetime.now() > invoice.inv_due_date and invoice.inv_amount_paid < invoice.inv_total_amount
            is_paid = invoice.inv_amount_paid >= invoice.inv_total_amount

            invoice_data = [{
                "reference": invoice.inv_reference,
                "date": invoice.inv_date,
                "due_date": invoice.inv_due_date,
                "total_amount": invoice.inv_total_amount,
                "amount_due": invoice.inv_total_amount - invoice.inv_amount_paid,
                "is_overdue": is_overdue,
                "is_paid": is_paid,
            }]

            # Generate email content
            client_name = client.cli_company_name or f"{client.cli_first_name or ''} {client.cli_last_name or ''}".strip()
            html_body = _generate_daily_invoice_email_html(
                client_name=client_name,
                invoices=invoice_data,
                total_amount=invoice.inv_total_amount,
                total_due=invoice.inv_total_amount - invoice.inv_amount_paid,
            )
            text_body = _generate_daily_invoice_email_text(
                client_name=client_name,
                invoices=invoice_data,
                total_amount=invoice.inv_total_amount,
                total_due=invoice.inv_total_amount - invoice.inv_amount_paid,
            )

            subject = f"Invoice {invoice.inv_reference} - {client_name}"

            # Prepare CC list
            cc_addresses = []
            if cc_accounting and settings.ACCOUNTING_CC_EMAIL:
                cc_addresses.append(settings.ACCOUNTING_CC_EMAIL)

            # Prepare attachments
            attachments = []
            if include_pdf and invoice.inv_pdf_url:
                # TODO: Fetch PDF from storage and attach
                pass

            # Send the email
            _send_email(
                to_addresses=[to_email],
                subject=subject,
                body_html=html_body,
                body_text=text_body,
                cc_addresses=cc_addresses if cc_addresses else None,
                attachments=attachments if attachments else None,
                config=config,
            )

            result["success"] = True
            result["sent_at"] = datetime.utcnow().isoformat()
            _log_task_success(task_name, result)
            return result

    except EmailConfigurationError as e:
        result["error"] = str(e)
        _log_task_failure(task_name, e)
        raise
    except EmailConnectionError as e:
        result["error"] = str(e)
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except EmailDeliveryError as e:
        result["error"] = str(e)
        _log_task_failure(task_name, e)
        raise
    except EmailTaskError as e:
        result["error"] = str(e)
        _log_task_failure(task_name, e)
        raise
    except Exception as e:
        result["error"] = str(e)
        _log_task_failure(task_name, e)
        raise EmailTaskError(
            message=f"Send invoice email failed: {str(e)}",
        )


# =============================================================================
# Overdue Invoice Reminder Task
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.email_tasks.send_overdue_reminders_task",
    max_retries=3,
    default_retry_delay=300,
    autoretry_for=(EmailConnectionError,),
    retry_backoff=True,
    retry_backoff_max=3600,
    retry_jitter=True,
)
def send_overdue_reminders_task(
    self,
    days_overdue_min: int = 1,
    days_overdue_max: Optional[int] = None,
    society_id: Optional[int] = None,
    bu_id: Optional[int] = None,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """
    Send reminder emails for overdue invoices.

    Args:
        days_overdue_min: Minimum days overdue to include (default: 1).
        days_overdue_max: Maximum days overdue to include (optional).
        society_id: Optional filter by society/company.
        bu_id: Optional filter by business unit.
        dry_run: If True, don't actually send emails.

    Returns:
        Dict with sending statistics.
    """
    task_name = "send_overdue_reminders_task"
    _log_task_start(
        task_name,
        days_overdue_min=days_overdue_min,
        days_overdue_max=days_overdue_max,
        dry_run=dry_run,
    )

    result = {
        "reminders_sent": 0,
        "reminders_failed": 0,
        "invoices_processed": 0,
        "errors": [],
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        "dry_run": dry_run,
    }

    try:
        if not dry_run:
            config = _get_email_config()
        else:
            config = None

        settings = get_settings()
        now = datetime.now()
        overdue_from = now - timedelta(days=days_overdue_max) if days_overdue_max else None
        overdue_to = now - timedelta(days=days_overdue_min)

        with get_sync_session() as session:
            # Query overdue invoices
            conditions = [
                ClientInvoice.inv_due_date < overdue_to,
                ClientInvoice.inv_amount_paid < ClientInvoice.inv_total_amount,
                # Exclude draft, cancelled, void, and paid statuses
                ClientInvoice.inv_sta_id.notin_([1, 4, 6, 7]),
            ]

            if overdue_from:
                conditions.append(ClientInvoice.inv_due_date >= overdue_from)

            if society_id:
                conditions.append(ClientInvoice.inv_soc_id == society_id)

            if bu_id:
                conditions.append(ClientInvoice.inv_bu_id == bu_id)

            invoice_query = (
                select(ClientInvoice)
                .where(and_(*conditions))
                .order_by(ClientInvoice.inv_cli_id, ClientInvoice.inv_due_date)
            )

            invoices = session.execute(invoice_query).scalars().all()

            # Group invoices by client
            client_invoices: Dict[int, List[ClientInvoice]] = {}
            for inv in invoices:
                if inv.inv_cli_id not in client_invoices:
                    client_invoices[inv.inv_cli_id] = []
                client_invoices[inv.inv_cli_id].append(inv)

            for client_id, client_inv_list in client_invoices.items():
                try:
                    # Get client
                    client = session.execute(
                        select(Client).where(Client.cli_id == client_id)
                    ).scalar_one_or_none()

                    if not client or not client.cli_email or not client.cli_is_active:
                        continue

                    result["invoices_processed"] += len(client_inv_list)

                    # Prepare invoice data
                    invoice_data = []
                    total_overdue = Decimal("0")

                    for inv in client_inv_list:
                        amount_due = inv.inv_total_amount - inv.inv_amount_paid
                        invoice_data.append({
                            "reference": inv.inv_reference,
                            "date": inv.inv_date,
                            "due_date": inv.inv_due_date,
                            "total_amount": inv.inv_total_amount,
                            "amount_due": amount_due,
                            "is_overdue": True,
                            "is_paid": False,
                            "days_overdue": (now - inv.inv_due_date).days,
                        })
                        total_overdue += amount_due

                    client_name = client.cli_company_name or f"{client.cli_first_name or ''} {client.cli_last_name or ''}".strip()

                    # Generate reminder email
                    subject = f"Payment Reminder - Overdue Invoices - {client_name}"
                    html_body = _generate_overdue_reminder_html(
                        client_name=client_name,
                        invoices=invoice_data,
                        total_overdue=total_overdue,
                    )

                    cc_addresses = []
                    if settings.ACCOUNTING_CC_EMAIL:
                        cc_addresses.append(settings.ACCOUNTING_CC_EMAIL)

                    if dry_run:
                        logger.info(
                            f"[DRY RUN] Would send overdue reminder to {client.cli_email} "
                            f"for {len(client_inv_list)} invoices"
                        )
                        result["reminders_sent"] += 1
                    else:
                        _send_email(
                            to_addresses=[client.cli_email],
                            subject=subject,
                            body_html=html_body,
                            cc_addresses=cc_addresses if cc_addresses else None,
                            config=config,
                        )
                        result["reminders_sent"] += 1
                        logger.info(f"Sent overdue reminder to {client.cli_email}")

                except Exception as e:
                    result["reminders_failed"] += 1
                    result["errors"].append({
                        "client_id": client_id,
                        "error": str(e),
                    })
                    logger.error(f"Failed to send reminder to client {client_id}: {e}")

        result["completed_at"] = datetime.utcnow().isoformat()
        _log_task_success(task_name, result)
        return result

    except EmailConfigurationError as e:
        _log_task_failure(task_name, e)
        raise
    except EmailConnectionError as e:
        _log_task_failure(task_name, e)
        raise self.retry(exc=e)
    except Exception as e:
        _log_task_failure(task_name, e)
        raise EmailTaskError(
            message=f"Overdue reminders task failed: {str(e)}",
        )


def _generate_overdue_reminder_html(
    client_name: str,
    invoices: List[Dict[str, Any]],
    total_overdue: Decimal,
    currency: str = "EUR",
) -> str:
    """Generate HTML content for overdue reminder email."""
    invoice_rows = ""
    for inv in invoices:
        invoice_rows += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">{inv['reference']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">{inv['due_date'].strftime('%d/%m/%Y')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; color: #dc3545; font-weight: bold;">{inv['days_overdue']} days</td>
            <td style="padding: 12px; border-bottom: 1px solid #dee2e6; text-align: right;">{currency} {inv['amount_due']:,.2f}</td>
        </tr>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #dc3545; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0;">Payment Reminder</h1>
            <p style="margin: 10px 0 0 0; color: #f8d7da;">You have overdue invoices that require immediate attention</p>
        </div>

        <p>Dear <strong>{client_name}</strong>,</p>

        <p>This is a friendly reminder that the following invoices are past their due date:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
                <tr style="background-color: #dc3545; color: white;">
                    <th style="padding: 12px; text-align: left;">Invoice #</th>
                    <th style="padding: 12px; text-align: left;">Due Date</th>
                    <th style="padding: 12px; text-align: left;">Days Overdue</th>
                    <th style="padding: 12px; text-align: right;">Amount Due</th>
                </tr>
            </thead>
            <tbody>
                {invoice_rows}
            </tbody>
            <tfoot>
                <tr style="background-color: #f8d7da; font-weight: bold;">
                    <td colspan="3" style="padding: 12px;">Total Overdue</td>
                    <td style="padding: 12px; text-align: right; color: #dc3545;">{currency} {total_overdue:,.2f}</td>
                </tr>
            </tfoot>
        </table>

        <p>Please arrange payment at your earliest convenience. If you have already made payment, please disregard this reminder.</p>

        <p>If you have any questions or need to discuss payment arrangements, please contact us immediately.</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 14px;">
            <p>Best regards,<br>
            <strong>ECOLED Accounting Team</strong></p>
        </div>
    </body>
    </html>
    """


# =============================================================================
# Health Check Task
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.email_tasks.email_health_check",
    max_retries=0,
)
def email_health_check(self) -> Dict[str, Any]:
    """
    Check email service health.

    Returns:
        Dict with health status information.
    """
    result = {
        "status": "unknown",
        "checked_at": datetime.utcnow().isoformat(),
        "provider": "unknown",
        "configured": False,
        "reachable": False,
        "error": None,
    }

    try:
        config = _get_email_config()
        provider = config.get("provider", "smtp")
        result["provider"] = provider
        result["configured"] = True

        if provider == "ses" and SES_AVAILABLE:
            # Check SES health
            result = _check_ses_health(result, config)
        else:
            # Check SMTP health
            result = _check_smtp_health(result, config)

    except EmailConfigurationError as e:
        result["status"] = "unhealthy"
        result["error"] = str(e)
    except Exception as e:
        result["status"] = "unhealthy"
        result["error"] = f"Unexpected error: {e}"

    return result


def _check_ses_health(result: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """Check SES service health."""
    import asyncio

    try:
        provider = SESEmailProvider(
            region=config.get("aws_region"),
            access_key_id=config.get("aws_access_key_id"),
            secret_access_key=config.get("aws_secret_access_key"),
            default_from_address=config.get("from_address"),
        )

        if not provider.is_configured():
            result["status"] = "unhealthy"
            result["error"] = "SES provider not configured"
            return result

        # Try to get send statistics to verify connectivity
        def run_sync():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(provider.get_send_statistics())
            finally:
                loop.close()

        stats = run_sync()

        if "error" in stats:
            result["status"] = "degraded"
            result["error"] = stats["error"]
        else:
            result["reachable"] = True
            result["status"] = "healthy"
            result["ses_stats"] = {
                "max_24_hour_send": stats.get("max_24_hour_send", 0),
                "sent_last_24_hours": stats.get("sent_last_24_hours", 0),
                "remaining_today": stats.get("remaining_today", 0),
            }

    except Exception as e:
        result["status"] = "degraded"
        result["error"] = f"SES connection test failed: {e}"

    return result


def _check_smtp_health(result: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """Check SMTP service health."""
    import smtplib
    import socket

    try:
        socket.setdefaulttimeout(10)
        with smtplib.SMTP(config["smtp_host"], config["smtp_port"], timeout=10) as server:
            server.noop()
            result["reachable"] = True
            result["status"] = "healthy"
    except (socket.timeout, smtplib.SMTPException) as e:
        result["status"] = "degraded"
        result["error"] = f"SMTP connection test failed: {e}"

    return result


# =============================================================================
# SES-Specific Tasks
# =============================================================================


@shared_task(
    bind=True,
    name="app.tasks.email_tasks.get_ses_statistics",
    max_retries=0,
)
def get_ses_statistics(self) -> Dict[str, Any]:
    """
    Get SES sending statistics.

    Returns:
        Dict with SES statistics.
    """
    import asyncio

    if not SES_AVAILABLE:
        return {"error": "SES provider not available"}

    try:
        config = _get_email_config()
        if config.get("provider") != "ses":
            return {"error": "SES is not configured as the email provider"}

        provider = SESEmailProvider(
            region=config.get("aws_region"),
            access_key_id=config.get("aws_access_key_id"),
            secret_access_key=config.get("aws_secret_access_key"),
        )

        def run_sync():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(provider.get_send_statistics())
            finally:
                loop.close()

        return run_sync()

    except Exception as e:
        return {"error": str(e)}


@shared_task(
    bind=True,
    name="app.tasks.email_tasks.verify_ses_identity",
    max_retries=0,
)
def verify_ses_identity(self, email: str) -> Dict[str, Any]:
    """
    Start SES identity verification for an email address.

    Args:
        email: Email address to verify.

    Returns:
        Dict with verification result.
    """
    import asyncio

    if not SES_AVAILABLE:
        return {"success": False, "error": "SES provider not available"}

    try:
        config = _get_email_config()
        if config.get("provider") != "ses":
            return {"success": False, "error": "SES is not configured as the email provider"}

        provider = SESEmailProvider(
            region=config.get("aws_region"),
            access_key_id=config.get("aws_access_key_id"),
            secret_access_key=config.get("aws_secret_access_key"),
        )

        def run_sync():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(provider.verify_identity(email))
            finally:
                loop.close()

        success = run_sync()
        return {
            "success": success,
            "email": email,
            "message": "Verification email sent" if success else "Failed to start verification",
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

"""
AWS SES Email Provider implementation.

Provides production-ready email sending via Amazon Simple Email Service (SES).
Supports:
- Single and batch email sending
- HTML and plain text emails
- File attachments
- Email tagging for tracking
- Rate limiting and retry logic
- Bounce/complaint handling preparation
"""
import asyncio
import re
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.mime.application import MIMEApplication
from email import encoders
from typing import Optional, List, Dict, Any

import boto3
from botocore.exceptions import ClientError, BotoCoreError
from botocore.config import Config

from app.config import get_settings
from app.services.email.base import (
    BaseEmailProvider,
    EmailMessage,
    EmailResult,
    EmailStatus,
)

settings = get_settings()


class SESProviderError(Exception):
    """Base exception for SES provider errors."""
    pass


class SESConfigurationError(SESProviderError):
    """SES configuration error."""
    pass


class SESRateLimitError(SESProviderError):
    """SES rate limit exceeded."""
    pass


class SESSendError(SESProviderError):
    """Failed to send email via SES."""
    pass


class SESEmailProvider(BaseEmailProvider):
    """
    AWS SES email provider implementation.

    Provides production-ready email sending via Amazon Simple Email Service.
    Uses boto3 for AWS API communication.

    Configuration is loaded from application settings:
    - AWS_REGION: AWS region for SES
    - AWS_ACCESS_KEY_ID: AWS credentials
    - AWS_SECRET_ACCESS_KEY: AWS credentials
    - EMAIL_FROM_ADDRESS: Default sender address
    - SES_CONFIGURATION_SET: Optional SES configuration set for tracking
    """

    # SES rate limits (can be increased via AWS support)
    DEFAULT_SEND_RATE = 14  # emails per second
    DEFAULT_DAILY_QUOTA = 50000  # emails per day

    # Email validation regex
    EMAIL_REGEX = re.compile(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    )

    def __init__(
        self,
        region: Optional[str] = None,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        default_from_address: Optional[str] = None,
        default_from_name: Optional[str] = None,
        configuration_set: Optional[str] = None,
    ):
        """
        Initialize the SES email provider.

        Args:
            region: AWS region (defaults to settings.AWS_REGION)
            access_key_id: AWS access key ID (defaults to settings.AWS_ACCESS_KEY_ID)
            secret_access_key: AWS secret access key (defaults to settings.AWS_SECRET_ACCESS_KEY)
            default_from_address: Default sender email (defaults to settings.EMAIL_FROM_ADDRESS)
            default_from_name: Default sender name (defaults to settings.EMAIL_FROM_NAME)
            configuration_set: SES configuration set for tracking
        """
        self._region = region or settings.AWS_REGION
        self._access_key_id = access_key_id or settings.AWS_ACCESS_KEY_ID
        self._secret_access_key = secret_access_key or settings.AWS_SECRET_ACCESS_KEY
        self._default_from_address = default_from_address or settings.EMAIL_FROM_ADDRESS
        self._default_from_name = default_from_name or getattr(settings, 'EMAIL_FROM_NAME', None)
        self._configuration_set = configuration_set or getattr(settings, 'SES_CONFIGURATION_SET', None)

        self._ses_client = None
        self._send_rate = self.DEFAULT_SEND_RATE
        self._daily_quota = self.DEFAULT_DAILY_QUOTA

    @property
    def ses_client(self):
        """Lazy-load SES client."""
        if self._ses_client is None:
            if not self._access_key_id or not self._secret_access_key:
                raise SESConfigurationError(
                    "AWS credentials not configured. "
                    "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
                )

            config = Config(
                retries={
                    'max_attempts': 3,
                    'mode': 'adaptive'
                },
                connect_timeout=5,
                read_timeout=30,
            )

            self._ses_client = boto3.client(
                'ses',
                region_name=self._region,
                aws_access_key_id=self._access_key_id,
                aws_secret_access_key=self._secret_access_key,
                config=config,
            )

            # Fetch actual quotas from SES
            self._update_quotas()

        return self._ses_client

    def _update_quotas(self) -> None:
        """Update send rate and quota from SES."""
        try:
            quota = self._ses_client.get_send_quota()
            self._send_rate = int(quota.get('MaxSendRate', self.DEFAULT_SEND_RATE))
            self._daily_quota = int(quota.get('Max24HourSend', self.DEFAULT_DAILY_QUOTA))
        except ClientError:
            # Use defaults if quota fetch fails
            pass

    def is_configured(self) -> bool:
        """Check if SES is properly configured."""
        return bool(
            self._access_key_id and
            self._secret_access_key and
            self._default_from_address and
            self._region
        )

    def _validate_email(self, email: str) -> bool:
        """Validate email address format."""
        return bool(self.EMAIL_REGEX.match(email))

    def _format_address(self, email: str, name: Optional[str] = None) -> str:
        """Format email address with optional display name."""
        if name:
            # Escape quotes in name
            escaped_name = name.replace('"', '\\"')
            return f'"{escaped_name}" <{email}>'
        return email

    def _build_raw_message(self, message: EmailMessage) -> bytes:
        """
        Build a raw MIME message for SES.

        Args:
            message: EmailMessage to convert

        Returns:
            Raw MIME message as bytes
        """
        # Determine message type based on attachments
        if message.attachments:
            msg = MIMEMultipart('mixed')
            # Create alternative part for HTML/text
            alt_part = MIMEMultipart('alternative')

            if message.body_text:
                text_part = MIMEText(message.body_text, 'plain', 'utf-8')
                alt_part.attach(text_part)

            html_part = MIMEText(message.body_html, 'html', 'utf-8')
            alt_part.attach(html_part)

            msg.attach(alt_part)

            # Add attachments
            for attachment in message.attachments:
                if attachment.content_id:
                    # Inline attachment
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.content)
                    encoders.encode_base64(part)
                    part.add_header('Content-ID', f'<{attachment.content_id}>')
                    part.add_header(
                        'Content-Disposition',
                        'inline',
                        filename=attachment.filename
                    )
                else:
                    # Regular attachment
                    part = MIMEApplication(attachment.content)
                    part.add_header(
                        'Content-Disposition',
                        'attachment',
                        filename=attachment.filename
                    )
                    part.add_header('Content-Type', attachment.content_type)

                msg.attach(part)
        else:
            # No attachments - simple alternative message
            msg = MIMEMultipart('alternative')

            if message.body_text:
                text_part = MIMEText(message.body_text, 'plain', 'utf-8')
                msg.attach(text_part)

            html_part = MIMEText(message.body_html, 'html', 'utf-8')
            msg.attach(html_part)

        # Set headers
        from_address = message.from_address or self._default_from_address
        from_name = message.from_name or self._default_from_name
        msg['From'] = self._format_address(from_address, from_name)
        msg['To'] = ', '.join(message.to)
        msg['Subject'] = message.subject

        if message.cc:
            msg['Cc'] = ', '.join(message.cc)

        if message.reply_to:
            msg['Reply-To'] = message.reply_to

        # Add custom headers
        for header, value in message.headers.items():
            msg[header] = value

        return msg.as_bytes()

    async def send(self, message: EmailMessage) -> EmailResult:
        """
        Send a single email via SES.

        Args:
            message: EmailMessage to send

        Returns:
            EmailResult with send status
        """
        # Validate recipients
        all_recipients = message.to + (message.cc or []) + (message.bcc or [])
        for email in all_recipients:
            if not self._validate_email(email):
                return EmailResult(
                    success=False,
                    status=EmailStatus.FAILED,
                    error_message=f"Invalid email address: {email}",
                    error_code="INVALID_EMAIL",
                )

        try:
            if message.attachments:
                # Use raw email for attachments
                return await self._send_raw_email(message)
            else:
                # Use simple email for better performance
                return await self._send_simple_email(message)

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'UNKNOWN')
            error_message = e.response.get('Error', {}).get('Message', str(e))

            # Check for rate limiting
            if error_code == 'Throttling':
                raise SESRateLimitError(f"SES rate limit exceeded: {error_message}")

            return EmailResult(
                success=False,
                status=EmailStatus.FAILED,
                error_message=error_message,
                error_code=error_code,
                raw_response=e.response,
            )

        except BotoCoreError as e:
            return EmailResult(
                success=False,
                status=EmailStatus.FAILED,
                error_message=str(e),
                error_code="BOTO_ERROR",
            )

        except Exception as e:
            return EmailResult(
                success=False,
                status=EmailStatus.FAILED,
                error_message=str(e),
                error_code="UNKNOWN_ERROR",
            )

    async def _send_simple_email(self, message: EmailMessage) -> EmailResult:
        """Send email using SES SendEmail API (simpler, no attachments)."""
        from_address = message.from_address or self._default_from_address
        from_name = message.from_name or self._default_from_name
        source = self._format_address(from_address, from_name)

        destination = {
            'ToAddresses': message.to,
        }
        if message.cc:
            destination['CcAddresses'] = message.cc
        if message.bcc:
            destination['BccAddresses'] = message.bcc

        body = {
            'Html': {
                'Data': message.body_html,
                'Charset': 'UTF-8',
            },
        }
        if message.body_text:
            body['Text'] = {
                'Data': message.body_text,
                'Charset': 'UTF-8',
            }

        params = {
            'Source': source,
            'Destination': destination,
            'Message': {
                'Subject': {
                    'Data': message.subject,
                    'Charset': 'UTF-8',
                },
                'Body': body,
            },
        }

        # Add reply-to
        if message.reply_to:
            params['ReplyToAddresses'] = [message.reply_to]

        # Add configuration set for tracking
        if self._configuration_set:
            params['ConfigurationSetName'] = self._configuration_set

        # Add tags
        if message.tags:
            params['Tags'] = [
                {'Name': k, 'Value': v}
                for k, v in list(message.tags.items())[:10]  # SES limit: 10 tags
            ]

        # Run in executor to not block async loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.ses_client.send_email(**params)
        )

        return EmailResult(
            success=True,
            message_id=response.get('MessageId'),
            status=EmailStatus.SENT,
            raw_response=response,
        )

    async def _send_raw_email(self, message: EmailMessage) -> EmailResult:
        """Send email using SES SendRawEmail API (supports attachments)."""
        raw_message = self._build_raw_message(message)

        params = {
            'RawMessage': {
                'Data': raw_message,
            },
        }

        # Collect all destinations
        destinations = list(message.to)
        if message.cc:
            destinations.extend(message.cc)
        if message.bcc:
            destinations.extend(message.bcc)
        params['Destinations'] = destinations

        # Add source
        from_address = message.from_address or self._default_from_address
        from_name = message.from_name or self._default_from_name
        params['Source'] = self._format_address(from_address, from_name)

        # Add configuration set
        if self._configuration_set:
            params['ConfigurationSetName'] = self._configuration_set

        # Add tags
        if message.tags:
            params['Tags'] = [
                {'Name': k, 'Value': v}
                for k, v in list(message.tags.items())[:10]
            ]

        # Run in executor
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.ses_client.send_raw_email(**params)
        )

        return EmailResult(
            success=True,
            message_id=response.get('MessageId'),
            status=EmailStatus.SENT,
            raw_response=response,
        )

    async def send_batch(
        self,
        messages: List[EmailMessage],
        fail_silently: bool = False
    ) -> List[EmailResult]:
        """
        Send multiple emails.

        Note: SES doesn't have a native batch API for different recipients,
        so we send sequentially with rate limiting.

        Args:
            messages: List of EmailMessage objects
            fail_silently: If True, continue on individual failures

        Returns:
            List of EmailResult objects
        """
        results = []
        delay = 1.0 / self._send_rate  # Delay between sends for rate limiting

        for i, message in enumerate(messages):
            try:
                result = await self.send(message)
                results.append(result)

                # Rate limiting delay
                if i < len(messages) - 1:
                    await asyncio.sleep(delay)

            except SESRateLimitError:
                # Wait and retry on rate limit
                await asyncio.sleep(1.0)
                try:
                    result = await self.send(message)
                    results.append(result)
                except Exception as e:
                    if not fail_silently:
                        raise
                    results.append(EmailResult(
                        success=False,
                        status=EmailStatus.FAILED,
                        error_message=str(e),
                        error_code="RATE_LIMIT_RETRY_FAILED",
                    ))

            except Exception as e:
                if not fail_silently:
                    raise
                results.append(EmailResult(
                    success=False,
                    status=EmailStatus.FAILED,
                    error_message=str(e),
                    error_code="BATCH_SEND_ERROR",
                ))

        return results

    async def verify_email(self, email: str) -> bool:
        """
        Verify email address format.

        Note: SES email verification is an identity verification process,
        not a recipient validation. This method only validates format.

        Args:
            email: Email address to verify

        Returns:
            True if email format is valid
        """
        return self._validate_email(email)

    async def verify_identity(self, email: str) -> bool:
        """
        Start the SES identity verification process for an email address.

        Args:
            email: Email address to verify as sender identity

        Returns:
            True if verification email was sent successfully
        """
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.ses_client.verify_email_identity(EmailAddress=email)
            )
            return True
        except ClientError:
            return False

    async def get_identity_verification_status(self, email: str) -> Optional[str]:
        """
        Get the verification status of an email identity.

        Args:
            email: Email address to check

        Returns:
            Verification status or None if not found
        """
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.ses_client.get_identity_verification_attributes(
                    Identities=[email]
                )
            )
            attrs = response.get('VerificationAttributes', {}).get(email, {})
            return attrs.get('VerificationStatus')
        except ClientError:
            return None

    async def get_send_statistics(self) -> Dict[str, Any]:
        """
        Get SES sending statistics.

        Returns:
            Dictionary with send statistics including quotas and usage
        """
        try:
            loop = asyncio.get_event_loop()

            # Get quota
            quota = await loop.run_in_executor(
                None,
                lambda: self.ses_client.get_send_quota()
            )

            # Get send statistics
            stats = await loop.run_in_executor(
                None,
                lambda: self.ses_client.get_send_statistics()
            )

            # Calculate totals from statistics
            data_points = stats.get('SendDataPoints', [])
            total_sent = sum(dp.get('DeliveryAttempts', 0) for dp in data_points)
            total_bounces = sum(dp.get('Bounces', 0) for dp in data_points)
            total_complaints = sum(dp.get('Complaints', 0) for dp in data_points)
            total_rejects = sum(dp.get('Rejects', 0) for dp in data_points)

            return {
                'max_24_hour_send': quota.get('Max24HourSend', 0),
                'max_send_rate': quota.get('MaxSendRate', 0),
                'sent_last_24_hours': quota.get('SentLast24Hours', 0),
                'remaining_today': quota.get('Max24HourSend', 0) - quota.get('SentLast24Hours', 0),
                'statistics': {
                    'total_sent': total_sent,
                    'total_bounces': total_bounces,
                    'total_complaints': total_complaints,
                    'total_rejects': total_rejects,
                    'bounce_rate': (total_bounces / total_sent * 100) if total_sent > 0 else 0,
                    'complaint_rate': (total_complaints / total_sent * 100) if total_sent > 0 else 0,
                },
                'data_points': len(data_points),
                'timestamp': datetime.utcnow().isoformat(),
            }

        except ClientError as e:
            return {
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat(),
            }

    async def list_verified_identities(self, identity_type: str = 'EmailAddress') -> List[str]:
        """
        List verified email identities.

        Args:
            identity_type: Type of identity ('EmailAddress' or 'Domain')

        Returns:
            List of verified identities
        """
        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.ses_client.list_identities(IdentityType=identity_type)
            )
            return response.get('Identities', [])
        except ClientError:
            return []

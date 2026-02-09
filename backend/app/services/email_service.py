"""Email service for sending emails and managing email logs."""
import json
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.email_log import EmailLog
from app.schemas.email_log import (
    EmailLogCreate,
    EmailLogUpdate,
    EmailLogResponse,
    EmailRetryResponse,
)
from app.core.config import settings


class EmailService:
    """Service for email operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_email_log(self, email_log_id: int) -> Optional[EmailLog]:
        """Get email log by ID."""
        stmt = select(EmailLog).where(EmailLog.eml_id == email_log_id)
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def get_email_logs(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
    ) -> tuple[list[EmailLog], int]:
        """Get paginated email logs with optional filters."""
        stmt = select(EmailLog)
        count_stmt = select(func.count(EmailLog.eml_id))

        # Apply filters
        if status:
            stmt = stmt.where(EmailLog.eml_status == status)
            count_stmt = count_stmt.where(EmailLog.eml_status == status)
        if entity_type:
            stmt = stmt.where(EmailLog.eml_entity_type == entity_type)
            count_stmt = count_stmt.where(EmailLog.eml_entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(EmailLog.eml_entity_id == entity_id)
            count_stmt = count_stmt.where(EmailLog.eml_entity_id == entity_id)

        # Get total count
        total = self.db.execute(count_stmt).scalar() or 0

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.order_by(EmailLog.eml_d_creation.desc()).offset(offset).limit(page_size)

        result = self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total
    
    def create_email_log(
        self,
        data: EmailLogCreate,
        created_by: Optional[int] = None,
    ) -> EmailLog:
        """Create a new email log entry."""
        email_log = EmailLog(
            eml_recipient_email=data.recipient_email,
            eml_recipient_name=data.recipient_name,
            eml_subject=data.subject,
            eml_body=data.body,
            eml_template_name=data.template_name,
            eml_template_data=data.template_data,
            eml_entity_type=data.entity_type,
            eml_entity_id=data.entity_id,
            eml_max_retries=data.max_retries,
            eml_status="PENDING",
            eml_retry_count=0,
            usr_id=created_by,
            eml_d_creation=datetime.utcnow(),
        )
        self.db.add(email_log)
        self.db.commit()
        self.db.refresh(email_log)
        return email_log
    
    def update_email_log(
        self,
        email_log: EmailLog,
        data: EmailLogUpdate,
    ) -> EmailLog:
        """Update an email log entry."""
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(email_log, field, value)
        email_log.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(email_log)
        return email_log
    
    def send_email(self, email_log: EmailLog) -> bool:
        """
        Actually send the email using SMTP.
        Returns True if successful, False otherwise.
        """
        try:
            # Build the email message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = email_log.subject
            msg["From"] = getattr(settings, "SMTP_FROM_EMAIL", "noreply@example.com")
            msg["To"] = email_log.recipient_email
            
            # Add body
            if email_log.body:
                # Check if body is HTML
                if "<html" in email_log.body.lower() or "<body" in email_log.body.lower():
                    msg.attach(MIMEText(email_log.body, "html"))
                else:
                    msg.attach(MIMEText(email_log.body, "plain"))
            
            # Get SMTP settings
            smtp_host = getattr(settings, "SMTP_HOST", None)
            smtp_port = getattr(settings, "SMTP_PORT", 587)
            smtp_user = getattr(settings, "SMTP_USER", None)
            smtp_password = getattr(settings, "SMTP_PASSWORD", None)
            smtp_use_tls = getattr(settings, "SMTP_USE_TLS", True)
            
            if not smtp_host:
                # SMTP not configured - log as sent for development
                email_log.status = "SENT"
                email_log.sent_at = datetime.utcnow()
                email_log.error_message = None
                self.db.commit()
                return True
            
            # Send via SMTP
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                if smtp_use_tls:
                    server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.sendmail(
                    msg["From"],
                    [email_log.recipient_email],
                    msg.as_string()
                )
            
            # Update log on success
            email_log.status = "SENT"
            email_log.sent_at = datetime.utcnow()
            email_log.error_message = None
            self.db.commit()
            return True
            
        except Exception as e:
            # Update log on failure
            email_log.status = "FAILED"
            email_log.error_message = str(e)
            email_log.updated_at = datetime.utcnow()
            self.db.commit()
            return False
    
    def retry_email(
        self,
        email_log_id: int,
        force: bool = False,
    ) -> EmailRetryResponse:
        """
        Retry sending a failed email.
        
        Args:
            email_log_id: The ID of the email log to retry
            force: If True, retry even if max retries exceeded
            
        Returns:
            EmailRetryResponse with result details
        """
        # Get the email log
        email_log = self.get_email_log(email_log_id)
        if not email_log:
            raise ValueError(f"Email log with ID {email_log_id} not found")
        
        # Check if already sent
        if email_log.status == "SENT":
            return EmailRetryResponse(
                success=False,
                message="Email has already been sent successfully",
                email_log=EmailLogResponse.model_validate(email_log),
                new_retry_count=email_log.retry_count,
            )
        
        # Check retry limit
        if not force and email_log.retry_count >= email_log.max_retries:
            return EmailRetryResponse(
                success=False,
                message=f"Maximum retry attempts ({email_log.max_retries}) exceeded. Use force=true to override.",
                email_log=EmailLogResponse.model_validate(email_log),
                new_retry_count=email_log.retry_count,
            )
        
        # Increment retry count
        email_log.retry_count += 1
        email_log.status = "PENDING"
        email_log.updated_at = datetime.utcnow()
        self.db.commit()
        
        # Attempt to send
        success = self.send_email(email_log)
        
        # Refresh to get updated status
        self.db.refresh(email_log)
        
        if success:
            return EmailRetryResponse(
                success=True,
                message="Email sent successfully",
                email_log=EmailLogResponse.model_validate(email_log),
                new_retry_count=email_log.retry_count,
            )
        else:
            return EmailRetryResponse(
                success=False,
                message=f"Failed to send email: {email_log.error_message}",
                email_log=EmailLogResponse.model_validate(email_log),
                new_retry_count=email_log.retry_count,
            )

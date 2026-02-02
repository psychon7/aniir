"""
Base email provider interface and data models.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional
from enum import Enum


class EmailPriority(str, Enum):
    """Email priority levels."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"


@dataclass
class EmailAttachment:
    """
    Email attachment data model.
    
    Attributes:
        filename: Name of the attachment file
        content: Binary content of the attachment
        content_type: MIME type of the attachment (e.g., 'application/pdf')
    """
    filename: str
    content: bytes
    content_type: str = "application/octet-stream"


@dataclass
class EmailMessage:
    """
    Email message data model.
    
    Attributes:
        to: List of recipient email addresses
        subject: Email subject line
        body_text: Plain text body content
        body_html: HTML body content (optional)
        cc: List of CC recipients (optional)
        bcc: List of BCC recipients (optional)
        reply_to: Reply-to email address (optional)
        attachments: List of email attachments (optional)
        priority: Email priority level
        headers: Additional email headers (optional)
    """
    to: list[str]
    subject: str
    body_text: str
    body_html: Optional[str] = None
    cc: list[str] = field(default_factory=list)
    bcc: list[str] = field(default_factory=list)
    reply_to: Optional[str] = None
    attachments: list[EmailAttachment] = field(default_factory=list)
    priority: EmailPriority = EmailPriority.NORMAL
    headers: dict[str, str] = field(default_factory=dict)
    
    @property
    def all_recipients(self) -> list[str]:
        """Get all recipients (to + cc + bcc)."""
        return self.to + self.cc + self.bcc
    
    @property
    def has_html(self) -> bool:
        """Check if email has HTML content."""
        return self.body_html is not None and len(self.body_html) > 0
    
    @property
    def has_attachments(self) -> bool:
        """Check if email has attachments."""
        return len(self.attachments) > 0


@dataclass
class EmailResult:
    """
    Result of an email send operation.
    
    Attributes:
        success: Whether the email was sent successfully
        message_id: Provider-assigned message ID (if successful)
        error: Error message (if failed)
        provider: Name of the provider used
    """
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
    provider: Optional[str] = None


class EmailProvider(ABC):
    """
    Abstract base class for email providers.
    
    All email providers must implement this interface.
    """
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Get the provider name."""
        pass
    
    @abstractmethod
    async def send(self, message: EmailMessage, from_address: str) -> EmailResult:
        """
        Send an email message.
        
        Args:
            message: The email message to send
            from_address: The sender email address
            
        Returns:
            EmailResult indicating success or failure
        """
        pass
    
    @abstractmethod
    async def send_bulk(
        self, 
        messages: list[EmailMessage], 
        from_address: str
    ) -> list[EmailResult]:
        """
        Send multiple email messages.
        
        Args:
            messages: List of email messages to send
            from_address: The sender email address
            
        Returns:
            List of EmailResult for each message
        """
        pass
    
    @abstractmethod
    def validate_address(self, email: str) -> bool:
        """
        Validate an email address format.
        
        Args:
            email: Email address to validate
            
        Returns:
            True if valid, False otherwise
        """
        pass

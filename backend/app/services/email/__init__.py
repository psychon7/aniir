"""
Email service module.
Provides email sending capabilities with multiple provider support.
"""

from .base import EmailProvider, EmailMessage, EmailAttachment
from .console_provider import ConsoleEmailProvider
from .service import EmailService, get_email_service

__all__ = [
    "EmailProvider",
    "EmailMessage",
    "EmailAttachment",
    "ConsoleEmailProvider",
    "EmailService",
    "get_email_service",
]

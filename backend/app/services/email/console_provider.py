"""
Console email provider for development and testing.
Logs emails to console/stdout instead of actually sending them.
"""

import re
import uuid
import logging
from datetime import datetime
from typing import Optional

from .base import (
    EmailProvider,
    EmailMessage,
    EmailResult,
    EmailAttachment,
    EmailPriority,
)


logger = logging.getLogger(__name__)


class ConsoleEmailProvider(EmailProvider):
    """
    Development email provider that outputs emails to the console.
    
    This provider is useful for:
    - Local development without SMTP setup
    - Testing email functionality
    - Debugging email content and formatting
    - CI/CD pipelines where actual email sending is not desired
    
    Features:
    - Colorized output (when terminal supports it)
    - Detailed logging of all email fields
    - Simulated message IDs for tracking
    - Optional delay simulation
    
    Usage:
        provider = ConsoleEmailProvider(colorize=True)
        result = await provider.send(message, "noreply@example.com")
    """
    
    # ANSI color codes for terminal output
    COLORS = {
        "reset": "\033[0m",
        "bold": "\033[1m",
        "dim": "\033[2m",
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "magenta": "\033[95m",
        "cyan": "\033[96m",
        "white": "\033[97m",
    }
    
    # Email validation regex pattern
    EMAIL_PATTERN = re.compile(
        r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    )
    
    def __init__(
        self,
        colorize: bool = True,
        log_level: int = logging.INFO,
        simulate_delay: bool = False,
        delay_seconds: float = 0.5,
        fail_rate: float = 0.0,
    ):
        """
        Initialize the console email provider.
        
        Args:
            colorize: Whether to use ANSI colors in output
            log_level: Logging level for email output
            simulate_delay: Whether to simulate network delay
            delay_seconds: Delay duration in seconds (if simulate_delay is True)
            fail_rate: Probability of simulated failure (0.0 to 1.0, for testing)
        """
        self._colorize = colorize
        self._log_level = log_level
        self._simulate_delay = simulate_delay
        self._delay_seconds = delay_seconds
        self._fail_rate = fail_rate
        self._sent_count = 0
        
    @property
    def name(self) -> str:
        """Get the provider name."""
        return "console"
    
    @property
    def sent_count(self) -> int:
        """Get the number of emails sent (logged) by this provider."""
        return self._sent_count
    
    def _color(self, text: str, color: str) -> str:
        """Apply color to text if colorization is enabled."""
        if not self._colorize:
            return text
        color_code = self.COLORS.get(color, "")
        reset = self.COLORS["reset"]
        return f"{color_code}{text}{reset}"
    
    def _format_separator(self, char: str = "=", length: int = 70) -> str:
        """Create a separator line."""
        return self._color(char * length, "dim")
    
    def _format_header(self, label: str, value: str) -> str:
        """Format an email header line."""
        label_colored = self._color(f"{label}:", "cyan")
        return f"  {label_colored} {value}"
    
    def _format_attachment(self, attachment: EmailAttachment) -> str:
        """Format attachment information."""
        size_kb = len(attachment.content) / 1024
        return (
            f"    - {self._color(attachment.filename, 'yellow')} "
            f"({attachment.content_type}, {size_kb:.2f} KB)"
        )
    
    def _format_priority(self, priority: EmailPriority) -> str:
        """Format priority with appropriate color."""
        color_map = {
            EmailPriority.LOW: "dim",
            EmailPriority.NORMAL: "white",
            EmailPriority.HIGH: "red",
        }
        return self._color(priority.value.upper(), color_map.get(priority, "white"))
    
    async def send(self, message: EmailMessage, from_address: str) -> EmailResult:
        """
        Log an email to the console instead of sending it.
        
        Args:
            message: The email message to "send"
            from_address: The sender email address
            
        Returns:
            EmailResult with simulated success/failure
        """
        import asyncio
        import random
        
        # Simulate network delay if enabled
        if self._simulate_delay:
            await asyncio.sleep(self._delay_seconds)
        
        # Simulate random failures for testing
        if self._fail_rate > 0 and random.random() < self._fail_rate:
            error_msg = "Simulated email failure for testing"
            self._log_failure(message, from_address, error_msg)
            return EmailResult(
                success=False,
                error=error_msg,
                provider=self.name,
            )
        
        # Generate a fake message ID
        message_id = f"console-{uuid.uuid4().hex[:12]}"
        timestamp = datetime.now().isoformat()
        
        # Build the console output
        output_lines = [
            "",
            self._format_separator("="),
            self._color(f"  📧 EMAIL SENT (Console Provider) - {timestamp}", "bold"),
            self._format_separator("="),
            "",
            self._color("  ENVELOPE:", "green"),
            self._format_header("Message-ID", message_id),
            self._format_header("From", from_address),
            self._format_header("To", ", ".join(message.to)),
        ]
        
        if message.cc:
            output_lines.append(self._format_header("CC", ", ".join(message.cc)))
        
        if message.bcc:
            output_lines.append(self._format_header("BCC", ", ".join(message.bcc)))
        
        if message.reply_to:
            output_lines.append(self._format_header("Reply-To", message.reply_to))
        
        output_lines.append(
            self._format_header("Priority", self._format_priority(message.priority))
        )
        
        output_lines.extend([
            "",
            self._color("  CONTENT:", "green"),
            self._format_header("Subject", self._color(message.subject, "bold")),
            "",
        ])
        
        # Add plain text body
        output_lines.append(self._color("  Body (Plain Text):", "magenta"))
        output_lines.append(self._format_separator("-", 50))
        for line in message.body_text.split("\n")[:20]:  # Limit to 20 lines
            output_lines.append(f"  {line}")
        if message.body_text.count("\n") > 20:
            output_lines.append(self._color("  ... (truncated)", "dim"))
        output_lines.append(self._format_separator("-", 50))
        
        # Add HTML body indicator
        if message.has_html:
            output_lines.extend([
                "",
                self._color("  Body (HTML):", "magenta"),
                self._color(f"    [HTML content: {len(message.body_html)} characters]", "dim"),
            ])
        
        # Add attachments
        if message.has_attachments:
            output_lines.extend([
                "",
                self._color(f"  ATTACHMENTS ({len(message.attachments)}):", "green"),
            ])
            for attachment in message.attachments:
                output_lines.append(self._format_attachment(attachment))
        
        # Add custom headers
        if message.headers:
            output_lines.extend([
                "",
                self._color("  CUSTOM HEADERS:", "green"),
            ])
            for key, value in message.headers.items():
                output_lines.append(self._format_header(key, value))
        
        output_lines.extend([
            "",
            self._format_separator("="),
            "",
        ])
        
        # Output to console
        output = "\n".join(output_lines)
        print(output)
        
        # Also log at configured level
        logger.log(
            self._log_level,
            f"Email logged to console: {message.subject} -> {', '.join(message.to)}"
        )
        
        self._sent_count += 1
        
        return EmailResult(
            success=True,
            message_id=message_id,
            provider=self.name,
        )
    
    async def send_bulk(
        self,
        messages: list[EmailMessage],
        from_address: str,
    ) -> list[EmailResult]:
        """
        Log multiple emails to the console.
        
        Args:
            messages: List of email messages to "send"
            from_address: The sender email address
            
        Returns:
            List of EmailResult for each message
        """
        results = []
        
        print(self._color(f"\n📬 BULK EMAIL: Sending {len(messages)} emails...\n", "bold"))
        
        for i, message in enumerate(messages, 1):
            print(self._color(f"  [{i}/{len(messages)}]", "dim"))
            result = await self.send(message, from_address)
            results.append(result)
        
        # Summary
        success_count = sum(1 for r in results if r.success)
        fail_count = len(results) - success_count
        
        summary_lines = [
            "",
            self._format_separator("*"),
            self._color("  📊 BULK EMAIL SUMMARY", "bold"),
            self._format_separator("*"),
            f"  Total: {len(messages)}",
            f"  {self._color(f'✓ Success: {success_count}', 'green')}",
            f"  {self._color(f'✗ Failed: {fail_count}', 'red') if fail_count else f'✗ Failed: {fail_count}'}",
            self._format_separator("*"),
            "",
        ]
        print("\n".join(summary_lines))
        
        return results
    
    def validate_address(self, email: str) -> bool:
        """
        Validate an email address format.
        
        Args:
            email: Email address to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not email or not isinstance(email, str):
            return False
        return bool(self.EMAIL_PATTERN.match(email.strip()))
    
    def _log_failure(
        self,
        message: EmailMessage,
        from_address: str,
        error: str,
    ) -> None:
        """Log a simulated failure."""
        output_lines = [
            "",
            self._color(self._format_separator("!"), "red"),
            self._color("  ❌ EMAIL FAILED (Simulated)", "red"),
            self._color(self._format_separator("!"), "red"),
            self._format_header("From", from_address),
            self._format_header("To", ", ".join(message.to)),
            self._format_header("Subject", message.subject),
            self._format_header("Error", self._color(error, "red")),
            self._color(self._format_separator("!"), "red"),
            "",
        ]
        print("\n".join(output_lines))
        logger.warning(f"Email failed (simulated): {error}")

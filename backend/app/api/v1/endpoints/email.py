"""
Email API endpoints for testing and administration.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.services.email import get_email_service, EmailService


router = APIRouter()


class SendEmailRequest(BaseModel):
    """Request model for sending a test email."""
    to: EmailStr
    subject: str
    body_text: str
    body_html: Optional[str] = None


class SendEmailResponse(BaseModel):
    """Response model for email send operation."""
    success: bool
    message_id: Optional[str] = None
    error: Optional[str] = None
    provider: str


class EmailServiceInfo(BaseModel):
    """Email service information."""
    provider: str
    default_from_address: str


@router.get("/info", response_model=EmailServiceInfo)
async def get_email_info(
    email_service: EmailService = Depends(get_email_service),
) -> EmailServiceInfo:
    """
    Get email service information.
    
    Returns the current email provider and configuration.
    """
    return EmailServiceInfo(
        provider=email_service.provider_name,
        default_from_address=email_service._default_from_address,
    )


@router.post("/send-test", response_model=SendEmailResponse)
async def send_test_email(
    request: SendEmailRequest,
    email_service: EmailService = Depends(get_email_service),
) -> SendEmailResponse:
    """
    Send a test email.
    
    This endpoint is useful for testing email configuration.
    In development mode (console provider), the email will be logged to console.
    """
    result = await email_service.send_email(
        to=request.to,
        subject=request.subject,
        body_text=request.body_text,
        body_html=request.body_html,
    )
    
    return SendEmailResponse(
        success=result.success,
        message_id=result.message_id,
        error=result.error,
        provider=result.provider or email_service.provider_name,
    )


@router.post("/validate-address")
async def validate_email_address(
    email: EmailStr,
    email_service: EmailService = Depends(get_email_service),
) -> dict:
    """
    Validate an email address format.
    
    Returns whether the email address is valid.
    """
    is_valid = email_service.provider.validate_address(email)
    return {
        "email": email,
        "valid": is_valid,
    }

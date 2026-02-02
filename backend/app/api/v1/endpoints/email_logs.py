"""API endpoints for email logs management."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.services.email_service import EmailService
from app.schemas.email_log import (
    EmailLogResponse,
    EmailLogListResponse,
    EmailRetryRequest,
    EmailRetryResponse,
)

router = APIRouter(prefix="/settings/email-logs", tags=["Email Logs"])


@router.get("", response_model=EmailLogListResponse)
async def list_email_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status (PENDING, SENT, FAILED)"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type (Invoice, Order, Quote)"),
    entity_id: Optional[int] = Query(None, description="Filter by entity ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List email logs with pagination and optional filters.
    
    - **page**: Page number (default: 1)
    - **page_size**: Number of items per page (default: 20, max: 100)
    - **status**: Filter by email status
    - **entity_type**: Filter by related entity type
    - **entity_id**: Filter by related entity ID
    """
    service = EmailService(db)
    items, total = service.get_email_logs(
        page=page,
        page_size=page_size,
        status=status,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    
    return EmailLogListResponse(
        items=[EmailLogResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{id}", response_model=EmailLogResponse)
async def get_email_log(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific email log by ID.
    """
    service = EmailService(db)
    email_log = service.get_email_log(id)
    
    if not email_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email log with ID {id} not found",
        )
    
    return EmailLogResponse.model_validate(email_log)


@router.post("/{id}/retry", response_model=EmailRetryResponse)
async def retry_email(
    id: int,
    request: Optional[EmailRetryRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retry sending a failed email.
    
    - **id**: The email log ID to retry
    - **force**: If true, retry even if max retries exceeded (optional, default: false)
    
    Returns the result of the retry attempt including:
    - success: Whether the email was sent successfully
    - message: Description of the result
    - email_log: Updated email log details
    - new_retry_count: The updated retry count
    """
    service = EmailService(db)
    
    # Check if email log exists
    email_log = service.get_email_log(id)
    if not email_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Email log with ID {id} not found",
        )
    
    # Get force flag from request body (default False)
    force = request.force if request else False
    
    try:
        result = service.retry_email(email_log_id=id, force=force)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retry email: {str(e)}",
        )

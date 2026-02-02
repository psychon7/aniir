"""
Repository for Email Log database operations.
"""
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session, joinedload

from app.models.email_log import EmailLog
from app.schemas.email_log import EmailLogCreate, EmailLogUpdate, EmailLogFilters


class EmailLogRepository:
    """Repository for email log CRUD operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, log_id: int) -> Optional[EmailLog]:
        """Get email log by ID."""
        return (
            self.db.query(EmailLog)
            .options(
                joinedload(EmailLog.created_by),
                joinedload(EmailLog.society)
            )
            .filter(EmailLog.id == log_id)
            .first()
        )
    
    def get_list(
        self,
        filters: EmailLogFilters,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[EmailLog], int]:
        """
        Get paginated list of email logs with filters.
        Returns tuple of (items, total_count).
        """
        query = self.db.query(EmailLog).options(
            joinedload(EmailLog.created_by),
            joinedload(EmailLog.society)
        )
        
        # Apply filters
        if filters.email_type:
            query = query.filter(EmailLog.email_type == filters.email_type)
        
        if filters.status:
            query = query.filter(EmailLog.status == filters.status)
        
        if filters.recipient_email:
            query = query.filter(EmailLog.recipient_email.ilike(f"%{filters.recipient_email}%"))
        
        if filters.related_entity_type:
            query = query.filter(EmailLog.related_entity_type == filters.related_entity_type)
        
        if filters.related_entity_id:
            query = query.filter(EmailLog.related_entity_id == filters.related_entity_id)
        
        if filters.society_id:
            query = query.filter(EmailLog.society_id == filters.society_id)
        
        if filters.date_from:
            query = query.filter(EmailLog.created_at >= filters.date_from)
        
        if filters.date_to:
            query = query.filter(EmailLog.created_at <= filters.date_to)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    EmailLog.recipient_email.ilike(search_term),
                    EmailLog.recipient_name.ilike(search_term),
                    EmailLog.subject.ilike(search_term)
                )
            )
        
        # Get total count before pagination
        total = query.count()
        
        # Apply sorting
        sort_column = getattr(EmailLog, sort_by, EmailLog.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        # Apply pagination
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()
        
        return items, total
    
    def create(self, data: EmailLogCreate, created_by_id: Optional[int] = None) -> EmailLog:
        """Create a new email log entry."""
        log = EmailLog(
            recipient_email=data.recipient_email,
            recipient_name=data.recipient_name,
            subject=data.subject,
            body=data.body,
            email_type=data.email_type,
            related_entity_type=data.related_entity_type,
            related_entity_id=data.related_entity_id,
            society_id=data.society_id,
            status="PENDING",
            created_at=datetime.utcnow(),
            created_by_id=created_by_id
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def update(self, log_id: int, data: EmailLogUpdate) -> Optional[EmailLog]:
        """Update an email log entry."""
        log = self.get_by_id(log_id)
        if not log:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(log, field, value)
        
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def mark_as_sent(self, log_id: int) -> Optional[EmailLog]:
        """Mark email log as sent."""
        return self.update(log_id, EmailLogUpdate(
            status="SENT",
            sent_at=datetime.utcnow()
        ))
    
    def mark_as_failed(self, log_id: int, error_message: str) -> Optional[EmailLog]:
        """Mark email log as failed."""
        return self.update(log_id, EmailLogUpdate(
            status="FAILED",
            error_message=error_message
        ))
    
    def get_stats(self, society_id: Optional[int] = None) -> dict:
        """Get email statistics."""
        query = self.db.query(EmailLog)
        
        if society_id:
            query = query.filter(EmailLog.society_id == society_id)
        
        total = query.count()
        sent = query.filter(EmailLog.status == "SENT").count()
        failed = query.filter(EmailLog.status == "FAILED").count()
        pending = query.filter(EmailLog.status == "PENDING").count()
        
        return {
            "total": total,
            "sent": sent,
            "failed": failed,
            "pending": pending,
            "success_rate": round((sent / total * 100), 2) if total > 0 else 0
        }

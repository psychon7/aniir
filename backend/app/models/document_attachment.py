"""
Document Attachment Model.

Maps to TM_DOC_DocumentAttachment table.
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class DocumentAttachment(Base):
    """
    Document Attachment model.
    Stores file metadata linked to an entity (invoice, quote, order, etc.).
    """

    __tablename__ = "TM_DOC_DocumentAttachment"

    # Primary key
    id: Mapped[int] = mapped_column("doc_id", Integer, primary_key=True, autoincrement=True)

    # Entity link
    entity_type: Mapped[str] = mapped_column("doc_entity_type", String(50), nullable=False)
    entity_id: Mapped[int] = mapped_column("doc_entity_id", Integer, nullable=False)

    # File metadata
    file_name: Mapped[str] = mapped_column("doc_file_name", String(255), nullable=False)
    file_path: Mapped[str] = mapped_column("doc_file_path", String(2000), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column("doc_file_size", Integer, nullable=True)
    file_type: Mapped[Optional[str]] = mapped_column("doc_file_type", String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column("doc_description", String(1000), nullable=True)

    # Audit
    uploaded_by: Mapped[Optional[int]] = mapped_column("usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column("doc_uploaded_at", DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    uploader: Mapped[Optional["User"]] = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"<DocumentAttachment(id={self.id}, entity_type='{self.entity_type}', entity_id={self.entity_id})>"

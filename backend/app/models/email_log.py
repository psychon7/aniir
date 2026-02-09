"""
EmailLog model for tracking sent emails.

Maps to TM_SET_EmailLog table.
Supports email status tracking, retry logic, and entity linking.

DB schema:
  eml_id: int NOT NULL [PK, IDENTITY]
  eml_recipient_email: nvarchar(500) NULL
  eml_recipient_name: nvarchar(500) NULL
  eml_subject: nvarchar(500) NULL
  eml_body: nvarchar(max) NULL
  eml_template_name: nvarchar(200) NULL
  eml_template_data: nvarchar(max) NULL
  eml_status: nvarchar(50) NULL DEFAULT 'PENDING'
  eml_error_message: nvarchar(2000) NULL
  eml_entity_type: nvarchar(100) NULL
  eml_entity_id: int NULL
  eml_retry_count: int NOT NULL DEFAULT 0
  eml_max_retries: int NOT NULL DEFAULT 3
  eml_d_sent: datetime NULL
  eml_attachment_count: int NULL DEFAULT 0
  usr_id: int NULL -> TM_USR_User.usr_id
  soc_id: int NULL -> TR_SOC_Society.soc_id
  eml_d_creation: datetime NOT NULL DEFAULT GETDATE()
  eml_d_update: datetime NULL
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class EmailLog(Base):
    """
    EmailLog model for tracking sent emails.
    Maps to TM_SET_EmailLog table.
    """
    __tablename__ = "TM_SET_EmailLog"
    __table_args__ = {"extend_existing": True}

    # Primary Key
    eml_id: Mapped[int] = mapped_column(
        "eml_id", Integer, primary_key=True, autoincrement=True
    )

    # Recipient info
    eml_recipient_email: Mapped[Optional[str]] = mapped_column(
        "eml_recipient_email", String(500), nullable=True
    )
    eml_recipient_name: Mapped[Optional[str]] = mapped_column(
        "eml_recipient_name", String(500), nullable=True
    )

    # Email content
    eml_subject: Mapped[Optional[str]] = mapped_column(
        "eml_subject", String(500), nullable=True
    )
    eml_body: Mapped[Optional[str]] = mapped_column(
        "eml_body", Text, nullable=True
    )

    # Template support
    eml_template_name: Mapped[Optional[str]] = mapped_column(
        "eml_template_name", String(200), nullable=True
    )
    eml_template_data: Mapped[Optional[str]] = mapped_column(
        "eml_template_data", Text, nullable=True
    )

    # Status and error tracking
    eml_status: Mapped[Optional[str]] = mapped_column(
        "eml_status", String(50), nullable=True, default="PENDING"
    )
    eml_error_message: Mapped[Optional[str]] = mapped_column(
        "eml_error_message", String(2000), nullable=True
    )

    # Entity linking
    eml_entity_type: Mapped[Optional[str]] = mapped_column(
        "eml_entity_type", String(100), nullable=True
    )
    eml_entity_id: Mapped[Optional[int]] = mapped_column(
        "eml_entity_id", Integer, nullable=True
    )

    # Retry support
    eml_retry_count: Mapped[int] = mapped_column(
        "eml_retry_count", Integer, nullable=False, default=0
    )
    eml_max_retries: Mapped[int] = mapped_column(
        "eml_max_retries", Integer, nullable=False, default=3
    )

    # Sent timestamp
    eml_d_sent: Mapped[Optional[datetime]] = mapped_column(
        "eml_d_sent", DateTime, nullable=True
    )

    # Attachment count
    eml_attachment_count: Mapped[Optional[int]] = mapped_column(
        "eml_attachment_count", Integer, nullable=True, default=0
    )

    # User who triggered the email
    usr_id: Mapped[Optional[int]] = mapped_column(
        "usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )

    # Society
    soc_id: Mapped[Optional[int]] = mapped_column(
        "soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=True
    )

    # Timestamps
    eml_d_creation: Mapped[datetime] = mapped_column(
        "eml_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    eml_d_update: Mapped[Optional[datetime]] = mapped_column(
        "eml_d_update", DateTime, nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"<EmailLog(eml_id={self.eml_id}, "
            f"to='{self.eml_recipient_email}', "
            f"status='{self.eml_status}')>"
        )

    # =========================================================================
    # Property aliases for API/service compatibility
    # These allow the service and schemas to use camelCase/snake_case names
    # while the DB columns use the eml_ prefix convention.
    # =========================================================================

    @property
    def id(self) -> int:
        return self.eml_id

    @id.setter
    def id(self, value: int) -> None:
        self.eml_id = value

    @property
    def recipient_email(self) -> Optional[str]:
        return self.eml_recipient_email

    @recipient_email.setter
    def recipient_email(self, value: Optional[str]) -> None:
        self.eml_recipient_email = value

    @property
    def recipient_name(self) -> Optional[str]:
        return self.eml_recipient_name

    @recipient_name.setter
    def recipient_name(self, value: Optional[str]) -> None:
        self.eml_recipient_name = value

    @property
    def subject(self) -> Optional[str]:
        return self.eml_subject

    @subject.setter
    def subject(self, value: Optional[str]) -> None:
        self.eml_subject = value

    @property
    def body(self) -> Optional[str]:
        return self.eml_body

    @body.setter
    def body(self, value: Optional[str]) -> None:
        self.eml_body = value

    @property
    def template_name(self) -> Optional[str]:
        return self.eml_template_name

    @template_name.setter
    def template_name(self, value: Optional[str]) -> None:
        self.eml_template_name = value

    @property
    def template_data(self) -> Optional[str]:
        return self.eml_template_data

    @template_data.setter
    def template_data(self, value: Optional[str]) -> None:
        self.eml_template_data = value

    @property
    def status(self) -> Optional[str]:
        return self.eml_status

    @status.setter
    def status(self, value: Optional[str]) -> None:
        self.eml_status = value

    @property
    def error_message(self) -> Optional[str]:
        return self.eml_error_message

    @error_message.setter
    def error_message(self, value: Optional[str]) -> None:
        self.eml_error_message = value

    @property
    def entity_type(self) -> Optional[str]:
        return self.eml_entity_type

    @entity_type.setter
    def entity_type(self, value: Optional[str]) -> None:
        self.eml_entity_type = value

    @property
    def entity_id(self) -> Optional[int]:
        return self.eml_entity_id

    @entity_id.setter
    def entity_id(self, value: Optional[int]) -> None:
        self.eml_entity_id = value

    @property
    def retry_count(self) -> int:
        return self.eml_retry_count

    @retry_count.setter
    def retry_count(self, value: int) -> None:
        self.eml_retry_count = value

    @property
    def max_retries(self) -> int:
        return self.eml_max_retries

    @max_retries.setter
    def max_retries(self, value: int) -> None:
        self.eml_max_retries = value

    @property
    def sent_at(self) -> Optional[datetime]:
        return self.eml_d_sent

    @sent_at.setter
    def sent_at(self, value: Optional[datetime]) -> None:
        self.eml_d_sent = value

    @property
    def attachment_count(self) -> Optional[int]:
        return self.eml_attachment_count

    @attachment_count.setter
    def attachment_count(self, value: Optional[int]) -> None:
        self.eml_attachment_count = value

    @property
    def created_by(self) -> Optional[int]:
        return self.usr_id

    @created_by.setter
    def created_by(self, value: Optional[int]) -> None:
        self.usr_id = value

    @property
    def created_at(self) -> datetime:
        return self.eml_d_creation

    @created_at.setter
    def created_at(self, value: datetime) -> None:
        self.eml_d_creation = value

    @property
    def updated_at(self) -> Optional[datetime]:
        return self.eml_d_update

    @updated_at.setter
    def updated_at(self, value: Optional[datetime]) -> None:
        self.eml_d_update = value

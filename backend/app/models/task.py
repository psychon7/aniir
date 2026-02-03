"""
Task model for Calendar/Tasks feature.

Maps to TM_TSK_Task table (to be created if not exists).
Supports calendar events, tasks, meetings, reminders, and deadlines
linked to various business entities.

Proposed DB schema:
  tsk_id: int NOT NULL [PK]
  tsk_ref: nvarchar(50) NULL
  tsk_title: nvarchar(500) NOT NULL
  tsk_description: ntext NULL
  tsk_type: nvarchar(50) NOT NULL (task, meeting, call, reminder, deadline, event)
  tsk_priority: nvarchar(20) NULL (low, medium, high, urgent)
  tsk_status: nvarchar(20) NOT NULL (pending, in_progress, completed, canceled)
  tsk_d_start: datetime NULL
  tsk_d_end: datetime NULL
  tsk_d_due: datetime NULL
  tsk_is_all_day: bit NOT NULL DEFAULT 0
  usr_id: int NULL -> TM_USR_User.usr_id (assigned to)
  usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
  cli_id: int NULL -> TM_CLI_CLient.cli_id
  sup_id: int NULL -> TM_SUP_Supplier.sup_id
  prj_id: int NULL -> TM_PRJ_Project.prj_id
  cpl_id: int NULL -> TM_CPL_Cost_Plan.cpl_id
  cod_id: int NULL -> TM_COD_Client_Order.cod_id
  cin_id: int NULL -> TM_CIN_Client_Invoice.cin_id
  soc_id: int NOT NULL -> TR_SOC_Society.soc_id
  tsk_d_creation: datetime NOT NULL
  tsk_d_update: datetime NOT NULL
  tsk_completed_at: datetime NULL
  tsk_isactive: bit NOT NULL DEFAULT 1
  tsk_notes: ntext NULL
  tsk_location: nvarchar(500) NULL
  tsk_color: nvarchar(20) NULL (for calendar display)
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from enum import Enum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.client import Client
    from app.models.supplier import Supplier
    from app.models.project import Project


class TaskType(str, Enum):
    """Task type enumeration."""
    TASK = "task"
    MEETING = "meeting"
    CALL = "call"
    REMINDER = "reminder"
    DEADLINE = "deadline"
    EVENT = "event"


class TaskPriority(str, Enum):
    """Task priority enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskStatus(str, Enum):
    """Task status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELED = "canceled"


# =============================================================================
# Task Model (TM_TSK_Task)
# =============================================================================


class Task(Base):
    """
    Task model for calendar and task management.
    Maps to TM_TSK_Task table.

    Supports various task types that can be linked to business entities
    like clients, suppliers, projects, quotes, orders, and invoices.
    """
    __tablename__ = "TM_TSK_Task"
    __table_args__ = {'extend_existing': True}

    # Primary Key
    tsk_id: Mapped[int] = mapped_column(
        "tsk_id", Integer, primary_key=True, autoincrement=True
    )

    # Reference code (auto-generated)
    tsk_ref: Mapped[Optional[str]] = mapped_column(
        "tsk_ref", String(50), nullable=True
    )

    # Task details
    tsk_title: Mapped[str] = mapped_column(
        "tsk_title", String(500), nullable=False
    )
    tsk_description: Mapped[Optional[str]] = mapped_column(
        "tsk_description", Text, nullable=True
    )

    # Type, priority, status
    tsk_type: Mapped[str] = mapped_column(
        "tsk_type", String(50), nullable=False, default=TaskType.TASK.value
    )
    tsk_priority: Mapped[Optional[str]] = mapped_column(
        "tsk_priority", String(20), nullable=True, default=TaskPriority.MEDIUM.value
    )
    tsk_status: Mapped[str] = mapped_column(
        "tsk_status", String(20), nullable=False, default=TaskStatus.PENDING.value
    )

    # Date/time fields
    tsk_d_start: Mapped[Optional[datetime]] = mapped_column(
        "tsk_d_start", DateTime, nullable=True
    )
    tsk_d_end: Mapped[Optional[datetime]] = mapped_column(
        "tsk_d_end", DateTime, nullable=True
    )
    tsk_d_due: Mapped[Optional[datetime]] = mapped_column(
        "tsk_d_due", DateTime, nullable=True
    )
    tsk_is_all_day: Mapped[bool] = mapped_column(
        "tsk_is_all_day", Boolean, nullable=False, default=False
    )

    # User assignments
    usr_id: Mapped[Optional[int]] = mapped_column(
        "usr_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True
    )
    usr_creator_id: Mapped[int] = mapped_column(
        "usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False
    )

    # Entity links (optional)
    cli_id: Mapped[Optional[int]] = mapped_column(
        "cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=True
    )
    sup_id: Mapped[Optional[int]] = mapped_column(
        "sup_id", Integer, ForeignKey("TM_SUP_Supplier.sup_id"), nullable=True
    )
    prj_id: Mapped[Optional[int]] = mapped_column(
        "prj_id", Integer, ForeignKey("TM_PRJ_Project.prj_id"), nullable=True
    )
    cpl_id: Mapped[Optional[int]] = mapped_column(
        "cpl_id", Integer, ForeignKey("TM_CPL_Cost_Plan.cpl_id"), nullable=True
    )
    cod_id: Mapped[Optional[int]] = mapped_column(
        "cod_id", Integer, ForeignKey("TM_COD_Client_Order.cod_id"), nullable=True
    )
    cin_id: Mapped[Optional[int]] = mapped_column(
        "cin_id", Integer, ForeignKey("TM_CIN_Client_Invoice.cin_id"), nullable=True
    )

    # Society
    soc_id: Mapped[int] = mapped_column(
        "soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False
    )

    # Timestamps
    tsk_d_creation: Mapped[datetime] = mapped_column(
        "tsk_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    tsk_d_update: Mapped[datetime] = mapped_column(
        "tsk_d_update", DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    tsk_completed_at: Mapped[Optional[datetime]] = mapped_column(
        "tsk_completed_at", DateTime, nullable=True
    )

    # Status flag
    tsk_isactive: Mapped[bool] = mapped_column(
        "tsk_isactive", Boolean, nullable=False, default=True
    )

    # Additional fields
    tsk_notes: Mapped[Optional[str]] = mapped_column(
        "tsk_notes", Text, nullable=True
    )
    tsk_location: Mapped[Optional[str]] = mapped_column(
        "tsk_location", String(500), nullable=True
    )
    tsk_color: Mapped[Optional[str]] = mapped_column(
        "tsk_color", String(20), nullable=True
    )

    # Relationships (lazy loaded by default)
    assigned_to: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[usr_id],
        lazy="selectin"
    )

    creator: Mapped["User"] = relationship(
        "User",
        foreign_keys=[usr_creator_id],
        lazy="selectin"
    )

    client: Mapped[Optional["Client"]] = relationship(
        "Client",
        foreign_keys=[cli_id],
        lazy="selectin"
    )

    supplier: Mapped[Optional["Supplier"]] = relationship(
        "Supplier",
        foreign_keys=[sup_id],
        lazy="selectin"
    )

    project: Mapped[Optional["Project"]] = relationship(
        "Project",
        foreign_keys=[prj_id],
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Task(tsk_id={self.tsk_id}, title='{self.tsk_title[:30]}...')>"

    # Property aliases for API compatibility
    @property
    def id(self) -> int:
        return self.tsk_id

    @property
    def reference(self) -> Optional[str]:
        return self.tsk_ref

    @property
    def title(self) -> str:
        return self.tsk_title

    @property
    def description(self) -> Optional[str]:
        return self.tsk_description

    @property
    def task_type(self) -> str:
        return self.tsk_type

    @property
    def priority(self) -> Optional[str]:
        return self.tsk_priority

    @property
    def status(self) -> str:
        return self.tsk_status

    @property
    def start_date(self) -> Optional[datetime]:
        return self.tsk_d_start

    @property
    def end_date(self) -> Optional[datetime]:
        return self.tsk_d_end

    @property
    def due_date(self) -> Optional[datetime]:
        return self.tsk_d_due

    @property
    def is_all_day(self) -> bool:
        return self.tsk_is_all_day

    @property
    def is_active(self) -> bool:
        return self.tsk_isactive

    @property
    def is_completed(self) -> bool:
        return self.tsk_status == TaskStatus.COMPLETED.value

    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue (past due date and not completed)."""
        if self.tsk_d_due and not self.is_completed:
            return datetime.utcnow() > self.tsk_d_due
        return False

    @property
    def created_at(self) -> datetime:
        return self.tsk_d_creation

    @property
    def updated_at(self) -> datetime:
        return self.tsk_d_update

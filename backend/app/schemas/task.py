"""
Pydantic schemas for Task/Calendar API.

Provides validation and serialization for task-related endpoints.
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, computed_field, field_validator
from pydantic.functional_validators import BeforeValidator
from typing_extensions import Annotated


# =============================================================================
# Enums
# =============================================================================


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
# Base Schema
# =============================================================================


class TaskBase(BaseModel):
    """Base task schema with common fields."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# =============================================================================
# Create Schema
# =============================================================================


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    tsk_title: str = Field(..., min_length=1, max_length=500, alias="title")
    tsk_description: Optional[str] = Field(None, alias="description")
    tsk_type: TaskType = Field(TaskType.TASK, alias="taskType")
    tsk_priority: Optional[TaskPriority] = Field(TaskPriority.MEDIUM, alias="priority")
    tsk_d_start: Optional[datetime] = Field(None, alias="startDate")
    tsk_d_end: Optional[datetime] = Field(None, alias="endDate")
    tsk_d_due: Optional[datetime] = Field(None, alias="dueDate")
    tsk_is_all_day: bool = Field(False, alias="isAllDay")
    usr_id: Optional[int] = Field(None, alias="assignedToId")
    cli_id: Optional[int] = Field(None, alias="clientId")
    sup_id: Optional[int] = Field(None, alias="supplierId")
    prj_id: Optional[int] = Field(None, alias="projectId")
    cpl_id: Optional[int] = Field(None, alias="quoteId")
    cod_id: Optional[int] = Field(None, alias="orderId")
    cin_id: Optional[int] = Field(None, alias="invoiceId")
    soc_id: int = Field(..., alias="societyId")
    tsk_notes: Optional[str] = Field(None, alias="notes")
    tsk_location: Optional[str] = Field(None, max_length=500, alias="location")
    tsk_color: Optional[str] = Field(None, max_length=20, alias="color")

    @field_validator('tsk_d_end')
    @classmethod
    def end_after_start(cls, v, info):
        """Validate that end date is after start date."""
        start = info.data.get('tsk_d_start')
        if v and start and v < start:
            raise ValueError('End date must be after start date')
        return v


# =============================================================================
# Update Schema
# =============================================================================


class TaskUpdate(TaskBase):
    """Schema for updating an existing task."""
    tsk_title: Optional[str] = Field(None, min_length=1, max_length=500, alias="title")
    tsk_description: Optional[str] = Field(None, alias="description")
    tsk_type: Optional[TaskType] = Field(None, alias="taskType")
    tsk_priority: Optional[TaskPriority] = Field(None, alias="priority")
    tsk_status: Optional[TaskStatus] = Field(None, alias="status")
    tsk_d_start: Optional[datetime] = Field(None, alias="startDate")
    tsk_d_end: Optional[datetime] = Field(None, alias="endDate")
    tsk_d_due: Optional[datetime] = Field(None, alias="dueDate")
    tsk_is_all_day: Optional[bool] = Field(None, alias="isAllDay")
    usr_id: Optional[int] = Field(None, alias="assignedToId")
    cli_id: Optional[int] = Field(None, alias="clientId")
    sup_id: Optional[int] = Field(None, alias="supplierId")
    prj_id: Optional[int] = Field(None, alias="projectId")
    cpl_id: Optional[int] = Field(None, alias="quoteId")
    cod_id: Optional[int] = Field(None, alias="orderId")
    cin_id: Optional[int] = Field(None, alias="invoiceId")
    tsk_notes: Optional[str] = Field(None, alias="notes")
    tsk_location: Optional[str] = Field(None, max_length=500, alias="location")
    tsk_color: Optional[str] = Field(None, max_length=20, alias="color")
    tsk_isactive: Optional[bool] = Field(None, alias="isActive")


# =============================================================================
# Response Schemas
# =============================================================================


class TaskResponse(TaskBase):
    """Schema for task response (single task)."""
    # Database fields with aliases for camelCase API response
    tsk_id: int = Field(..., alias="id")
    tsk_ref: Optional[str] = Field(None, alias="reference")
    tsk_title: str = Field(..., alias="title")
    tsk_description: Optional[str] = Field(None, alias="description")
    tsk_type: str = Field(..., alias="taskType")
    tsk_priority: Optional[str] = Field(None, alias="priority")
    tsk_status: str = Field(..., alias="status")
    tsk_d_start: Optional[datetime] = Field(None, alias="startDate")
    tsk_d_end: Optional[datetime] = Field(None, alias="endDate")
    tsk_d_due: Optional[datetime] = Field(None, alias="dueDate")
    tsk_is_all_day: bool = Field(..., alias="isAllDay")
    usr_id: Optional[int] = Field(None, alias="assignedToId")
    usr_creator_id: int = Field(..., alias="createdById")
    cli_id: Optional[int] = Field(None, alias="clientId")
    sup_id: Optional[int] = Field(None, alias="supplierId")
    prj_id: Optional[int] = Field(None, alias="projectId")
    cpl_id: Optional[int] = Field(None, alias="quoteId")
    cod_id: Optional[int] = Field(None, alias="orderId")
    cin_id: Optional[int] = Field(None, alias="invoiceId")
    soc_id: int = Field(..., alias="societyId")
    tsk_d_creation: datetime = Field(..., alias="createdAt")
    tsk_d_update: datetime = Field(..., alias="updatedAt")
    tsk_completed_at: Optional[datetime] = Field(None, alias="completedAt")
    tsk_isactive: bool = Field(..., alias="isActive")
    tsk_notes: Optional[str] = Field(None, alias="notes")
    tsk_location: Optional[str] = Field(None, alias="location")
    tsk_color: Optional[str] = Field(None, alias="color")

    # Resolved names (populated by service)
    assigned_to_name: Optional[str] = Field(None, alias="assignedToName")
    creator_name: Optional[str] = Field(None, alias="creatorName")
    client_name: Optional[str] = Field(None, alias="clientName")
    supplier_name: Optional[str] = Field(None, alias="supplierName")
    project_name: Optional[str] = Field(None, alias="projectName")

    @computed_field
    @property
    def isOverdue(self) -> bool:
        """Check if task is overdue."""
        if self.tsk_d_due and self.tsk_status != TaskStatus.COMPLETED.value:
            return datetime.utcnow() > self.tsk_d_due
        return False

    @computed_field
    @property
    def isCompleted(self) -> bool:
        """Check if task is completed."""
        return self.tsk_status == TaskStatus.COMPLETED.value


class TaskListResponse(BaseModel):
    """Schema for paginated task list response."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    data: List[TaskResponse] = Field(..., alias="data")
    total: int = Field(..., alias="total")
    page: int = Field(..., alias="page")
    page_size: int = Field(..., alias="pageSize")
    pages: int = Field(..., alias="pages")


# =============================================================================
# Calendar-Specific Schemas
# =============================================================================


class CalendarEvent(BaseModel):
    """Simplified schema for calendar view events."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    title: str
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    allDay: bool = False
    color: Optional[str] = None
    taskType: str
    priority: Optional[str] = None
    status: str
    clientName: Optional[str] = None
    projectName: Optional[str] = None


class CalendarQueryParams(BaseModel):
    """Parameters for calendar event queries."""
    start_date: datetime
    end_date: datetime
    user_id: Optional[int] = None
    task_types: Optional[List[TaskType]] = None
    include_completed: bool = False


# =============================================================================
# Status Update Schemas
# =============================================================================


class TaskStatusUpdate(BaseModel):
    """Schema for updating task status only."""
    status: TaskStatus


class TaskCompleteRequest(BaseModel):
    """Schema for marking a task as completed."""
    notes: Optional[str] = None  # Optional completion notes

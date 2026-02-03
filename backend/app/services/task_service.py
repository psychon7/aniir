"""
Task service for Calendar/Tasks functionality.

Provides CRUD operations and calendar-specific queries.
"""
import asyncio
from datetime import datetime
from typing import Optional, List, Tuple
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session, selectinload

from app.models.task import Task, TaskStatus, TaskPriority, TaskType
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    CalendarEvent, CalendarQueryParams, TaskStatusUpdate
)


# =============================================================================
# Custom Exceptions
# =============================================================================


class TaskServiceError(Exception):
    """Base exception for task service errors."""
    pass


class TaskNotFoundError(TaskServiceError):
    """Raised when a task is not found."""
    pass


class TaskValidationError(TaskServiceError):
    """Raised when task validation fails."""
    pass


# =============================================================================
# Task Service Class
# =============================================================================


class TaskService:
    """Service class for task operations."""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # Core CRUD Operations (Synchronous)
    # -------------------------------------------------------------------------

    def get_task_by_id(self, task_id: int) -> Optional[Task]:
        """Get a task by ID."""
        stmt = select(Task).where(Task.tsk_id == task_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_tasks(
        self,
        page: int = 1,
        page_size: int = 20,
        user_id: Optional[int] = None,
        society_id: Optional[int] = None,
        status: Optional[str] = None,
        task_type: Optional[str] = None,
        priority: Optional[str] = None,
        client_id: Optional[int] = None,
        project_id: Optional[int] = None,
        active_only: bool = True,
        search: Optional[str] = None,
        order_by: str = "due_date",
        order_dir: str = "asc"
    ) -> Tuple[List[Task], int]:
        """
        Get paginated list of tasks with filtering.

        Returns:
            Tuple of (tasks, total_count)
        """
        # Base query
        stmt = select(Task)
        count_stmt = select(func.count(Task.tsk_id))

        # Build filters
        filters = []

        if active_only:
            filters.append(Task.tsk_isactive == True)

        if user_id:
            filters.append(Task.usr_id == user_id)

        if society_id:
            filters.append(Task.soc_id == society_id)

        if status:
            filters.append(Task.tsk_status == status)

        if task_type:
            filters.append(Task.tsk_type == task_type)

        if priority:
            filters.append(Task.tsk_priority == priority)

        if client_id:
            filters.append(Task.cli_id == client_id)

        if project_id:
            filters.append(Task.prj_id == project_id)

        if search:
            search_filter = or_(
                Task.tsk_title.ilike(f"%{search}%"),
                Task.tsk_description.ilike(f"%{search}%"),
                Task.tsk_ref.ilike(f"%{search}%")
            )
            filters.append(search_filter)

        # Apply filters
        if filters:
            stmt = stmt.where(and_(*filters))
            count_stmt = count_stmt.where(and_(*filters))

        # Get total count
        total = self.db.execute(count_stmt).scalar() or 0

        # Apply ordering
        order_column = self._get_order_column(order_by)
        if order_dir.lower() == "desc":
            stmt = stmt.order_by(order_column.desc())
        else:
            stmt = stmt.order_by(order_column.asc())

        # Apply pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        # Execute
        tasks = list(self.db.execute(stmt).scalars().all())

        return tasks, total

    def create_task(self, data: TaskCreate, creator_id: int) -> Task:
        """Create a new task."""
        task = Task(
            tsk_title=data.tsk_title,
            tsk_description=data.tsk_description,
            tsk_type=data.tsk_type.value if data.tsk_type else TaskType.TASK.value,
            tsk_priority=data.tsk_priority.value if data.tsk_priority else TaskPriority.MEDIUM.value,
            tsk_status=TaskStatus.PENDING.value,
            tsk_d_start=data.tsk_d_start,
            tsk_d_end=data.tsk_d_end,
            tsk_d_due=data.tsk_d_due,
            tsk_is_all_day=data.tsk_is_all_day,
            usr_id=data.usr_id,
            usr_creator_id=creator_id,
            cli_id=data.cli_id,
            sup_id=data.sup_id,
            prj_id=data.prj_id,
            cpl_id=data.cpl_id,
            cod_id=data.cod_id,
            cin_id=data.cin_id,
            soc_id=data.soc_id,
            tsk_notes=data.tsk_notes,
            tsk_location=data.tsk_location,
            tsk_color=data.tsk_color,
            tsk_d_creation=datetime.utcnow(),
            tsk_d_update=datetime.utcnow(),
            tsk_isactive=True
        )

        # Generate reference
        task.tsk_ref = self._generate_reference()

        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)

        return task

    def update_task(self, task_id: int, data: TaskUpdate) -> Task:
        """Update an existing task."""
        task = self.get_task_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"Task with ID {task_id} not found")

        # Update fields if provided
        update_data = data.model_dump(exclude_unset=True, by_alias=False)

        for field, value in update_data.items():
            if hasattr(task, field):
                # Handle enum values
                if field in ('tsk_type', 'tsk_priority', 'tsk_status') and value is not None:
                    value = value.value if hasattr(value, 'value') else value
                setattr(task, field, value)

        # Handle status change to completed
        if data.tsk_status == TaskStatus.COMPLETED and not task.tsk_completed_at:
            task.tsk_completed_at = datetime.utcnow()
        elif data.tsk_status and data.tsk_status != TaskStatus.COMPLETED:
            task.tsk_completed_at = None

        task.tsk_d_update = datetime.utcnow()

        self.db.commit()
        self.db.refresh(task)

        return task

    def update_status(self, task_id: int, status: TaskStatus) -> Task:
        """Update task status only."""
        task = self.get_task_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"Task with ID {task_id} not found")

        task.tsk_status = status.value
        task.tsk_d_update = datetime.utcnow()

        if status == TaskStatus.COMPLETED:
            task.tsk_completed_at = datetime.utcnow()
        else:
            task.tsk_completed_at = None

        self.db.commit()
        self.db.refresh(task)

        return task

    def complete_task(self, task_id: int, notes: Optional[str] = None) -> Task:
        """Mark a task as completed."""
        task = self.get_task_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"Task with ID {task_id} not found")

        task.tsk_status = TaskStatus.COMPLETED.value
        task.tsk_completed_at = datetime.utcnow()
        task.tsk_d_update = datetime.utcnow()

        if notes:
            existing_notes = task.tsk_notes or ""
            task.tsk_notes = f"{existing_notes}\n\n[Completion Note]: {notes}".strip()

        self.db.commit()
        self.db.refresh(task)

        return task

    def delete_task(self, task_id: int, hard_delete: bool = False) -> bool:
        """Delete a task (soft delete by default)."""
        task = self.get_task_by_id(task_id)
        if not task:
            raise TaskNotFoundError(f"Task with ID {task_id} not found")

        if hard_delete:
            self.db.delete(task)
        else:
            task.tsk_isactive = False
            task.tsk_d_update = datetime.utcnow()

        self.db.commit()
        return True

    # -------------------------------------------------------------------------
    # Calendar-Specific Operations
    # -------------------------------------------------------------------------

    def get_calendar_events(
        self,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        society_id: Optional[int] = None,
        task_types: Optional[List[str]] = None,
        include_completed: bool = False
    ) -> List[Task]:
        """
        Get tasks for calendar display within a date range.

        Args:
            start_date: Start of date range
            end_date: End of date range
            user_id: Filter by assigned user
            society_id: Filter by society
            task_types: Filter by task types
            include_completed: Include completed tasks

        Returns:
            List of tasks within the date range
        """
        stmt = select(Task).where(Task.tsk_isactive == True)

        # Date range filter - task overlaps with range
        date_filter = or_(
            # Task starts within range
            and_(Task.tsk_d_start >= start_date, Task.tsk_d_start <= end_date),
            # Task ends within range
            and_(Task.tsk_d_end >= start_date, Task.tsk_d_end <= end_date),
            # Task spans the entire range
            and_(Task.tsk_d_start <= start_date, Task.tsk_d_end >= end_date),
            # Due date within range (for tasks without start/end)
            and_(Task.tsk_d_due >= start_date, Task.tsk_d_due <= end_date)
        )
        stmt = stmt.where(date_filter)

        if user_id:
            stmt = stmt.where(Task.usr_id == user_id)

        if society_id:
            stmt = stmt.where(Task.soc_id == society_id)

        if task_types:
            stmt = stmt.where(Task.tsk_type.in_(task_types))

        if not include_completed:
            stmt = stmt.where(Task.tsk_status != TaskStatus.COMPLETED.value)

        stmt = stmt.order_by(Task.tsk_d_start.asc(), Task.tsk_d_due.asc())

        return list(self.db.execute(stmt).scalars().all())

    def get_upcoming_tasks(
        self,
        user_id: int,
        days: int = 7,
        limit: int = 10
    ) -> List[Task]:
        """Get upcoming tasks for a user within specified days."""
        now = datetime.utcnow()
        end_date = datetime(now.year, now.month, now.day)

        from datetime import timedelta
        end_date = now + timedelta(days=days)

        stmt = (
            select(Task)
            .where(
                Task.tsk_isactive == True,
                Task.usr_id == user_id,
                Task.tsk_status != TaskStatus.COMPLETED.value,
                or_(
                    Task.tsk_d_due <= end_date,
                    Task.tsk_d_start <= end_date
                )
            )
            .order_by(Task.tsk_d_due.asc(), Task.tsk_d_start.asc())
            .limit(limit)
        )

        return list(self.db.execute(stmt).scalars().all())

    def get_overdue_tasks(
        self,
        user_id: Optional[int] = None,
        society_id: Optional[int] = None
    ) -> List[Task]:
        """Get all overdue tasks."""
        now = datetime.utcnow()

        stmt = (
            select(Task)
            .where(
                Task.tsk_isactive == True,
                Task.tsk_status != TaskStatus.COMPLETED.value,
                Task.tsk_d_due < now
            )
        )

        if user_id:
            stmt = stmt.where(Task.usr_id == user_id)

        if society_id:
            stmt = stmt.where(Task.soc_id == society_id)

        stmt = stmt.order_by(Task.tsk_d_due.asc())

        return list(self.db.execute(stmt).scalars().all())

    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------

    def _generate_reference(self) -> str:
        """Generate a unique task reference."""
        now = datetime.utcnow()
        year = now.strftime("%Y")
        month = now.strftime("%m")

        # Get count of tasks this month
        count_stmt = select(func.count(Task.tsk_id)).where(
            func.year(Task.tsk_d_creation) == now.year,
            func.month(Task.tsk_d_creation) == now.month
        )
        count = self.db.execute(count_stmt).scalar() or 0

        return f"TSK-{year}{month}-{(count + 1):04d}"

    def _get_order_column(self, order_by: str):
        """Get the SQLAlchemy column for ordering."""
        order_map = {
            "due_date": Task.tsk_d_due,
            "start_date": Task.tsk_d_start,
            "created_at": Task.tsk_d_creation,
            "updated_at": Task.tsk_d_update,
            "title": Task.tsk_title,
            "priority": Task.tsk_priority,
            "status": Task.tsk_status,
        }
        return order_map.get(order_by, Task.tsk_d_due)

    def to_response(self, task: Task) -> dict:
        """Convert task model to response dict with resolved names."""
        response = {
            "tsk_id": task.tsk_id,
            "tsk_ref": task.tsk_ref,
            "tsk_title": task.tsk_title,
            "tsk_description": task.tsk_description,
            "tsk_type": task.tsk_type,
            "tsk_priority": task.tsk_priority,
            "tsk_status": task.tsk_status,
            "tsk_d_start": task.tsk_d_start,
            "tsk_d_end": task.tsk_d_end,
            "tsk_d_due": task.tsk_d_due,
            "tsk_is_all_day": task.tsk_is_all_day,
            "usr_id": task.usr_id,
            "usr_creator_id": task.usr_creator_id,
            "cli_id": task.cli_id,
            "sup_id": task.sup_id,
            "prj_id": task.prj_id,
            "cpl_id": task.cpl_id,
            "cod_id": task.cod_id,
            "cin_id": task.cin_id,
            "soc_id": task.soc_id,
            "tsk_d_creation": task.tsk_d_creation,
            "tsk_d_update": task.tsk_d_update,
            "tsk_completed_at": task.tsk_completed_at,
            "tsk_isactive": task.tsk_isactive,
            "tsk_notes": task.tsk_notes,
            "tsk_location": task.tsk_location,
            "tsk_color": task.tsk_color,
            # Resolved names
            "assigned_to_name": None,
            "creator_name": None,
            "client_name": None,
            "supplier_name": None,
            "project_name": None,
        }

        # Resolve relationship names
        if task.assigned_to:
            response["assigned_to_name"] = f"{task.assigned_to.usr_firstname or ''} {task.assigned_to.usr_name or ''}".strip()
        if task.creator:
            response["creator_name"] = f"{task.creator.usr_firstname or ''} {task.creator.usr_name or ''}".strip()
        if task.client:
            response["client_name"] = task.client.cli_company_name
        if task.supplier:
            response["supplier_name"] = task.supplier.sup_company_name
        if task.project:
            response["project_name"] = task.project.prj_name

        return response

    def to_calendar_event(self, task: Task) -> dict:
        """Convert task model to calendar event format."""
        return {
            "id": task.tsk_id,
            "title": task.tsk_title,
            "start": task.tsk_d_start or task.tsk_d_due,
            "end": task.tsk_d_end or task.tsk_d_start or task.tsk_d_due,
            "allDay": task.tsk_is_all_day,
            "color": task.tsk_color or self._get_default_color(task),
            "taskType": task.tsk_type,
            "priority": task.tsk_priority,
            "status": task.tsk_status,
            "clientName": task.client.cli_company_name if task.client else None,
            "projectName": task.project.prj_name if task.project else None,
        }

    def _get_default_color(self, task: Task) -> str:
        """Get default color based on task type and priority."""
        type_colors = {
            TaskType.MEETING.value: "#3B82F6",  # Blue
            TaskType.CALL.value: "#10B981",      # Green
            TaskType.REMINDER.value: "#F59E0B",  # Amber
            TaskType.DEADLINE.value: "#EF4444",  # Red
            TaskType.EVENT.value: "#8B5CF6",     # Purple
            TaskType.TASK.value: "#6B7280",      # Gray
        }

        # Override with priority color if urgent
        if task.tsk_priority == TaskPriority.URGENT.value:
            return "#DC2626"  # Red-600

        return type_colors.get(task.tsk_type, "#6B7280")


# =============================================================================
# Async Wrapper Functions
# =============================================================================


def get_task_service(db: Session) -> TaskService:
    """Factory function for TaskService."""
    return TaskService(db)


async def get_task_by_id_async(db: Session, task_id: int) -> Optional[Task]:
    """Async wrapper for get_task_by_id."""
    service = TaskService(db)
    return await asyncio.to_thread(service.get_task_by_id, task_id)


async def get_tasks_async(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    **filters
) -> Tuple[List[Task], int]:
    """Async wrapper for get_tasks."""
    service = TaskService(db)
    return await asyncio.to_thread(
        service.get_tasks,
        page=page,
        page_size=page_size,
        **filters
    )


async def create_task_async(
    db: Session,
    data: TaskCreate,
    creator_id: int
) -> Task:
    """Async wrapper for create_task."""
    service = TaskService(db)
    return await asyncio.to_thread(service.create_task, data, creator_id)


async def update_task_async(
    db: Session,
    task_id: int,
    data: TaskUpdate
) -> Task:
    """Async wrapper for update_task."""
    service = TaskService(db)
    return await asyncio.to_thread(service.update_task, task_id, data)


async def delete_task_async(
    db: Session,
    task_id: int,
    hard_delete: bool = False
) -> bool:
    """Async wrapper for delete_task."""
    service = TaskService(db)
    return await asyncio.to_thread(service.delete_task, task_id, hard_delete)


async def get_calendar_events_async(
    db: Session,
    start_date: datetime,
    end_date: datetime,
    **filters
) -> List[Task]:
    """Async wrapper for get_calendar_events."""
    service = TaskService(db)
    return await asyncio.to_thread(
        service.get_calendar_events,
        start_date=start_date,
        end_date=end_date,
        **filters
    )

"""
Task API endpoints for Calendar/Tasks feature.

Provides REST API for task management and calendar queries.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse, TaskListResponse,
    CalendarEvent, TaskStatusUpdate, TaskCompleteRequest,
    TaskType, TaskStatus, TaskPriority
)
from app.services.task_service import (
    TaskService, get_task_service,
    TaskNotFoundError, TaskValidationError
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


# =============================================================================
# Error Handlers
# =============================================================================


def handle_task_error(e: Exception):
    """Convert task service exceptions to HTTP exceptions."""
    if isinstance(e, TaskNotFoundError):
        raise HTTPException(status_code=404, detail=str(e))
    elif isinstance(e, TaskValidationError):
        raise HTTPException(status_code=400, detail=str(e))
    else:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# =============================================================================
# Task CRUD Endpoints
# =============================================================================


@router.get("", response_model=TaskListResponse)
async def list_tasks(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize", description="Items per page"),
    user_id: Optional[int] = Query(None, alias="userId", description="Filter by assigned user"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society"),
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    task_type: Optional[TaskType] = Query(None, alias="taskType", description="Filter by type"),
    priority: Optional[TaskPriority] = Query(None, description="Filter by priority"),
    client_id: Optional[int] = Query(None, alias="clientId", description="Filter by client"),
    project_id: Optional[int] = Query(None, alias="projectId", description="Filter by project"),
    active_only: bool = Query(True, alias="activeOnly", description="Only active tasks"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    order_by: str = Query("due_date", alias="orderBy", description="Sort field"),
    order_dir: str = Query("asc", alias="orderDir", description="Sort direction (asc/desc)"),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of tasks with filtering options.

    Supports filtering by:
    - User assignment
    - Society
    - Status (pending, in_progress, completed, canceled)
    - Type (task, meeting, call, reminder, deadline, event)
    - Priority (low, medium, high, urgent)
    - Client/Project association
    - Search term
    """
    try:
        service = get_task_service(db)
        tasks, total = service.get_tasks(
            page=page,
            page_size=page_size,
            user_id=user_id,
            society_id=society_id,
            status=status.value if status else None,
            task_type=task_type.value if task_type else None,
            priority=priority.value if priority else None,
            client_id=client_id,
            project_id=project_id,
            active_only=active_only,
            search=search,
            order_by=order_by,
            order_dir=order_dir
        )

        # Convert to response format
        task_responses = [
            TaskResponse.model_validate(service.to_response(task))
            for task in tasks
        ]

        pages = (total + page_size - 1) // page_size if total > 0 else 1

        return TaskListResponse(
            data=task_responses,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages
        )
    except Exception as e:
        handle_task_error(e)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific task by ID."""
    try:
        service = get_task_service(db)
        task = service.get_task_by_id(task_id)

        if not task:
            raise TaskNotFoundError(f"Task with ID {task_id} not found")

        return TaskResponse.model_validate(service.to_response(task))
    except Exception as e:
        handle_task_error(e)


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    data: TaskCreate,
    creator_id: int = Query(1, alias="creatorId", description="Creator user ID"),
    db: Session = Depends(get_db)
):
    """
    Create a new task.

    Required fields:
    - title: Task title
    - societyId: Society ID

    Optional fields:
    - description: Task description
    - taskType: Type of task (default: task)
    - priority: Priority level (default: medium)
    - startDate/endDate: Date/time range
    - dueDate: Due date
    - assignedToId: User to assign the task to
    - clientId/supplierId/projectId: Link to business entities
    - location: Task location
    - color: Calendar display color
    """
    try:
        service = get_task_service(db)
        task = service.create_task(data, creator_id)

        return TaskResponse.model_validate(service.to_response(task))
    except Exception as e:
        handle_task_error(e)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing task."""
    try:
        service = get_task_service(db)
        task = service.update_task(task_id, data)

        return TaskResponse.model_validate(service.to_response(task))
    except Exception as e:
        handle_task_error(e)


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    hard_delete: bool = Query(False, alias="hardDelete", description="Permanently delete"),
    db: Session = Depends(get_db)
):
    """
    Delete a task.

    By default performs soft delete (sets isActive to false).
    Use hardDelete=true to permanently remove the task.
    """
    try:
        service = get_task_service(db)
        service.delete_task(task_id, hard_delete)
    except Exception as e:
        handle_task_error(e)


# =============================================================================
# Status Update Endpoints
# =============================================================================


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: int,
    data: TaskStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update task status only."""
    try:
        service = get_task_service(db)
        task = service.update_status(task_id, data.status)

        return TaskResponse.model_validate(service.to_response(task))
    except Exception as e:
        handle_task_error(e)


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def complete_task(
    task_id: int,
    data: Optional[TaskCompleteRequest] = None,
    db: Session = Depends(get_db)
):
    """Mark a task as completed with optional completion notes."""
    try:
        service = get_task_service(db)
        notes = data.notes if data else None
        task = service.complete_task(task_id, notes)

        return TaskResponse.model_validate(service.to_response(task))
    except Exception as e:
        handle_task_error(e)


# =============================================================================
# Calendar Endpoints
# =============================================================================


@router.get("/calendar/events", response_model=List[CalendarEvent])
async def get_calendar_events(
    start: datetime = Query(..., description="Start of date range"),
    end: datetime = Query(..., description="End of date range"),
    user_id: Optional[int] = Query(None, alias="userId", description="Filter by user"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society"),
    task_types: Optional[str] = Query(None, alias="taskTypes", description="Comma-separated task types"),
    include_completed: bool = Query(False, alias="includeCompleted", description="Include completed tasks"),
    db: Session = Depends(get_db)
):
    """
    Get tasks formatted for calendar display.

    Returns a simplified event format suitable for calendar libraries
    like react-big-calendar or FullCalendar.
    """
    try:
        service = get_task_service(db)

        # Parse task types if provided
        types_list = None
        if task_types:
            types_list = [t.strip() for t in task_types.split(",")]

        tasks = service.get_calendar_events(
            start_date=start,
            end_date=end,
            user_id=user_id,
            society_id=society_id,
            task_types=types_list,
            include_completed=include_completed
        )

        return [
            CalendarEvent.model_validate(service.to_calendar_event(task))
            for task in tasks
        ]
    except Exception as e:
        handle_task_error(e)


@router.get("/calendar/upcoming", response_model=List[TaskResponse])
async def get_upcoming_tasks(
    user_id: int = Query(..., alias="userId", description="User ID"),
    days: int = Query(7, ge=1, le=30, description="Number of days to look ahead"),
    limit: int = Query(10, ge=1, le=50, description="Maximum tasks to return"),
    db: Session = Depends(get_db)
):
    """Get upcoming tasks for a user within specified days."""
    try:
        service = get_task_service(db)
        tasks = service.get_upcoming_tasks(user_id, days, limit)

        return [
            TaskResponse.model_validate(service.to_response(task))
            for task in tasks
        ]
    except Exception as e:
        handle_task_error(e)


@router.get("/calendar/overdue", response_model=List[TaskResponse])
async def get_overdue_tasks(
    user_id: Optional[int] = Query(None, alias="userId", description="Filter by user"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society"),
    db: Session = Depends(get_db)
):
    """Get all overdue tasks."""
    try:
        service = get_task_service(db)
        tasks = service.get_overdue_tasks(user_id, society_id)

        return [
            TaskResponse.model_validate(service.to_response(task))
            for task in tasks
        ]
    except Exception as e:
        handle_task_error(e)


# =============================================================================
# Dashboard/Widget Endpoints
# =============================================================================


@router.get("/stats/summary")
async def get_task_summary(
    user_id: Optional[int] = Query(None, alias="userId", description="Filter by user"),
    society_id: Optional[int] = Query(None, alias="societyId", description="Filter by society"),
    db: Session = Depends(get_db)
):
    """
    Get task statistics summary for dashboard widgets.

    Returns counts by status, type, and priority.
    """
    try:
        service = get_task_service(db)

        # Get all active tasks
        all_tasks, _ = service.get_tasks(
            page=1,
            page_size=1000,
            user_id=user_id,
            society_id=society_id,
            active_only=True
        )

        # Count by status
        by_status = {s.value: 0 for s in TaskStatus}
        by_type = {t.value: 0 for t in TaskType}
        by_priority = {p.value: 0 for p in TaskPriority}
        overdue_count = 0

        now = datetime.utcnow()

        for task in all_tasks:
            by_status[task.tsk_status] = by_status.get(task.tsk_status, 0) + 1
            by_type[task.tsk_type] = by_type.get(task.tsk_type, 0) + 1
            if task.tsk_priority:
                by_priority[task.tsk_priority] = by_priority.get(task.tsk_priority, 0) + 1

            if task.tsk_d_due and task.tsk_d_due < now and task.tsk_status != TaskStatus.COMPLETED.value:
                overdue_count += 1

        return {
            "total": len(all_tasks),
            "byStatus": by_status,
            "byType": by_type,
            "byPriority": by_priority,
            "overdue": overdue_count
        }
    except Exception as e:
        handle_task_error(e)

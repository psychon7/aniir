"""
Project API Router.

Provides REST API endpoints for:
- Project CRUD operations
- Project search and lookup
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.project_service import (
    ProjectService,
    ProjectServiceError,
    ProjectNotFoundError,
    ProjectDuplicateCodeError
)
from app.schemas.project import (
    ProjectCreate, ProjectUpdate,
    ProjectSearchParams,
    ProjectResponse, ProjectDetailResponse,
    ProjectListResponse, ProjectSummary
)

router = APIRouter(prefix="/projects", tags=["Projects"])


# ==========================================================================
# Dependency Injection
# ==========================================================================

async def get_project_service(db: AsyncSession = Depends(get_db)) -> ProjectService:
    """Get project service instance."""
    return ProjectService(db)


# ==========================================================================
# Exception Handler Helper
# ==========================================================================

def handle_project_error(error: ProjectServiceError) -> HTTPException:
    """Convert ProjectServiceError to appropriate HTTPException."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "PROJECT_ERROR"

    if isinstance(error, ProjectNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
        error_code = "PROJECT_NOT_FOUND"
    elif isinstance(error, ProjectDuplicateCodeError):
        status_code = status.HTTP_409_CONFLICT
        error_code = "PROJECT_DUPLICATE_CODE"

    return HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "error": {
                "code": error_code,
                "message": str(error)
            }
        }
    )


# ==========================================================================
# Project CRUD Endpoints
# ==========================================================================

@router.post(
    "",
    response_model=ProjectDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
    description="""
    Create a new project.

    A project requires:
    - Code (unique within society)
    - Name
    - Client ID
    - Payment condition ID
    - Payment mode ID
    - VAT rate ID
    - Society ID
    """
)
async def create_project(
    data: ProjectCreate,
    service: ProjectService = Depends(get_project_service)
):
    """Create a new project."""
    try:
        project = await service.create_project(data)
        return project
    except ProjectServiceError as e:
        raise handle_project_error(e)


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="Search and list projects",
    description="""
    Search projects with optional filters and pagination.

    Supports filtering by:
    - Search term (matches code and name)
    - Code (partial match)
    - Name (partial match)
    - Client ID
    - Society ID
    - Creator ID
    - Date range
    """
)
async def search_projects(
    search: Optional[str] = Query(None, description="Search term"),
    code: Optional[str] = Query(None, description="Filter by code (partial match)"),
    name: Optional[str] = Query(None, description="Filter by name (partial match)"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    society_id: Optional[int] = Query(None, description="Filter by society ID"),
    creator_id: Optional[int] = Query(None, description="Filter by creator ID"),
    date_from: Optional[datetime] = Query(None, description="Created from date"),
    date_to: Optional[datetime] = Query(None, description="Created to date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("prj_d_creation", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order (asc/desc)"),
    service: ProjectService = Depends(get_project_service)
):
    """Search and list projects with pagination."""
    params = ProjectSearchParams(
        search=search,
        code=code,
        name=name,
        client_id=client_id,
        society_id=society_id,
        creator_id=creator_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return await service.search_projects(params)


@router.get(
    "/lookup",
    response_model=List[dict],
    summary="Get projects for lookup/dropdown",
    description="Get lightweight project data for selection in dropdowns."
)
async def get_project_lookup(
    soc_id: int = Query(..., description="Society ID"),
    client_id: Optional[int] = Query(None, description="Filter by client ID"),
    search: Optional[str] = Query(None, description="Search term"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records"),
    service: ProjectService = Depends(get_project_service)
):
    """Get projects for dropdown/lookup."""
    return await service.get_project_lookup(soc_id, client_id, search, limit)


@router.get(
    "/summary",
    response_model=ProjectSummary,
    summary="Get project summary statistics",
    description="Get summary statistics for projects."
)
async def get_project_summary(
    soc_id: Optional[int] = Query(None, description="Filter by society ID"),
    service: ProjectService = Depends(get_project_service)
):
    """Get project summary statistics."""
    return await service.get_project_summary(soc_id)


@router.get(
    "/by-client/{client_id}",
    response_model=List[ProjectResponse],
    summary="Get projects by client",
    description="Get all projects for a specific client."
)
async def get_projects_by_client(
    client_id: int = Path(..., description="Client ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records"),
    service: ProjectService = Depends(get_project_service)
):
    """Get all projects for a client."""
    return await service.get_projects_by_client(client_id, skip, limit)


@router.get(
    "/by-society/{soc_id}",
    response_model=List[ProjectResponse],
    summary="Get projects by society",
    description="Get all projects for a specific society."
)
async def get_projects_by_society(
    soc_id: int = Path(..., description="Society ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records"),
    service: ProjectService = Depends(get_project_service)
):
    """Get all projects for a society."""
    return await service.get_projects_by_society(soc_id, skip, limit)


@router.get(
    "/{project_id}",
    response_model=ProjectDetailResponse,
    summary="Get project by ID",
    description="Get detailed information about a specific project with resolved lookup names."
)
async def get_project(
    project_id: int = Path(..., description="Project ID"),
    service: ProjectService = Depends(get_project_service)
):
    """Get a project by ID with resolved lookup names."""
    try:
        return await service.get_project_detail(project_id)
    except ProjectServiceError as e:
        raise handle_project_error(e)


@router.put(
    "/{project_id}",
    response_model=ProjectDetailResponse,
    summary="Update a project",
    description="Update an existing project."
)
async def update_project(
    project_id: int = Path(..., description="Project ID"),
    data: ProjectUpdate = ...,
    service: ProjectService = Depends(get_project_service)
):
    """Update a project."""
    try:
        return await service.update_project(project_id, data)
    except ProjectServiceError as e:
        raise handle_project_error(e)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
    description="Delete a project by ID."
)
async def delete_project(
    project_id: int = Path(..., description="Project ID"),
    service: ProjectService = Depends(get_project_service)
):
    """Delete a project."""
    try:
        await service.delete_project(project_id)
    except ProjectServiceError as e:
        raise handle_project_error(e)

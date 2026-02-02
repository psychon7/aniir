"""
Project Service for managing projects.

This service provides business logic for:
- Project CRUD operations
- Project search and lookup
"""
from typing import Optional, List
import logging
import math

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.client import Client
from app.models.society import Society
from app.models.user import User
from app.models.payment_mode import PaymentMode
from app.models.payment_term import PaymentTerm
from app.models.vat_rate import VatRate
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import (
    ProjectCreate, ProjectUpdate,
    ProjectSearchParams, ProjectResponse,
    ProjectDetailResponse, ProjectListResponse,
    ProjectSummary
)

logger = logging.getLogger(__name__)


class ProjectServiceError(Exception):
    """Base exception for project service errors."""
    pass


class ProjectNotFoundError(ProjectServiceError):
    """Raised when a project is not found."""
    pass


class ProjectDuplicateCodeError(ProjectServiceError):
    """Raised when a project code already exists."""
    pass


class ProjectService:
    """
    Service for managing projects.

    Projects represent business opportunities or initiatives
    associated with clients. They serve as containers for
    related cost plans, orders, and invoices.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repository = ProjectRepository(db)

    # =====================
    # Project Operations
    # =====================

    async def create_project(self, data: ProjectCreate) -> ProjectDetailResponse:
        """
        Create a new project.

        Args:
            data: Project creation data

        Returns:
            Created project details

        Raises:
            ProjectDuplicateCodeError: If code already exists
        """
        # Check for duplicate code
        if await self.repository.check_code_exists(data.prj_code, data.soc_id):
            raise ProjectDuplicateCodeError(
                f"Project with code '{data.prj_code}' already exists"
            )

        project = await self.repository.create_project(data)
        return await self._project_to_detail_response(project)

    async def get_project(self, project_id: int) -> ProjectDetailResponse:
        """
        Get a project by ID with related details.

        Args:
            project_id: Project ID

        Returns:
            Project details

        Raises:
            ProjectNotFoundError: If project not found
        """
        project = await self.repository.get_project(project_id)
        if not project:
            raise ProjectNotFoundError(f"Project with ID {project_id} not found")
        return await self._project_to_detail_response(project)

    async def get_project_detail(self, project_id: int) -> dict:
        """
        Get a project by ID with resolved lookup names.

        Args:
            project_id: Project ID

        Returns:
            Dict suitable for ProjectDetailResponse with resolved lookup names

        Raises:
            ProjectNotFoundError: If project not found
        """
        project = await self.repository.get_project(project_id)
        if not project:
            raise ProjectNotFoundError(f"Project with ID {project_id} not found")

        # Build base response from project ORM object
        response_data = ProjectDetailResponse.model_validate(project).model_dump()

        # Resolve lookup names
        # Client
        if project.cli_id:
            result = await self.db.execute(
                select(Client).where(Client.cli_id == project.cli_id)
            )
            client = result.scalar_one_or_none()
            if client:
                response_data["clientName"] = client.cli_company_name

        # Society
        if project.soc_id:
            result = await self.db.execute(
                select(Society).where(Society.soc_id == project.soc_id)
            )
            society = result.scalar_one_or_none()
            if society:
                response_data["societyName"] = society.soc_society_name

        # Payment Mode
        if project.pmo_id:
            result = await self.db.execute(
                select(PaymentMode).where(PaymentMode.pmo_id == project.pmo_id)
            )
            payment_mode = result.scalar_one_or_none()
            if payment_mode:
                response_data["paymentModeName"] = payment_mode.pmo_designation

        # Payment Condition (Term)
        if project.pco_id:
            result = await self.db.execute(
                select(PaymentTerm).where(PaymentTerm.pco_id == project.pco_id)
            )
            payment_term = result.scalar_one_or_none()
            if payment_term:
                response_data["paymentConditionName"] = payment_term.pco_designation
                response_data["paymentTermDays"] = payment_term.pco_numday + payment_term.pco_day_additional

        # VAT Rate
        if project.vat_id:
            result = await self.db.execute(
                select(VatRate).where(VatRate.vat_id == project.vat_id)
            )
            vat_rate = result.scalar_one_or_none()
            if vat_rate:
                response_data["vatRateName"] = vat_rate.vat_designation

        # Creator User
        if project.usr_creator_id:
            result = await self.db.execute(
                select(User).where(User.usr_id == project.usr_creator_id)
            )
            creator = result.scalar_one_or_none()
            if creator:
                response_data["creatorName"] = creator.display_name if hasattr(creator, 'display_name') else f"{creator.usr_firstname} {creator.usr_lastname}"

        return response_data

    async def update_project(
        self,
        project_id: int,
        data: ProjectUpdate
    ) -> ProjectDetailResponse:
        """
        Update a project.

        Args:
            project_id: Project ID
            data: Update data

        Returns:
            Updated project details

        Raises:
            ProjectNotFoundError: If project not found
            ProjectDuplicateCodeError: If new code already exists
        """
        existing = await self.repository.get_project(project_id)
        if not existing:
            raise ProjectNotFoundError(f"Project with ID {project_id} not found")

        # Check for duplicate code if changing
        if data.prj_code and data.prj_code != existing.prj_code:
            soc_id = data.soc_id if data.soc_id else existing.soc_id
            if await self.repository.check_code_exists(data.prj_code, soc_id, project_id):
                raise ProjectDuplicateCodeError(
                    f"Project with code '{data.prj_code}' already exists"
                )

        project = await self.repository.update_project(project_id, data)
        return await self._project_to_detail_response(project)

    async def delete_project(self, project_id: int) -> bool:
        """
        Delete a project.

        Args:
            project_id: Project ID

        Returns:
            True if deleted

        Raises:
            ProjectNotFoundError: If project not found
        """
        existing = await self.repository.get_project(project_id)
        if not existing:
            raise ProjectNotFoundError(f"Project with ID {project_id} not found")

        return await self.repository.delete_project(project_id)

    async def search_projects(
        self,
        params: ProjectSearchParams
    ) -> ProjectListResponse:
        """
        Search projects with filters and pagination.

        Args:
            params: Search parameters

        Returns:
            Paginated list of projects
        """
        projects, total = await self.repository.search_projects(params)

        items = [
            self._project_to_response(project)
            for project in projects
        ]

        total_pages = math.ceil(total / params.page_size) if total > 0 else 1

        return ProjectListResponse(
            items=items,
            total=total,
            page=params.page,
            page_size=params.page_size,
            total_pages=total_pages
        )

    async def get_projects_by_client(
        self,
        client_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[ProjectResponse]:
        """
        Get all projects for a client.

        Args:
            client_id: Client ID
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of projects
        """
        projects = await self.repository.get_projects_by_client(
            client_id, skip, limit
        )
        return [self._project_to_response(p) for p in projects]

    async def get_projects_by_society(
        self,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[ProjectResponse]:
        """
        Get all projects for a society.

        Args:
            soc_id: Society ID
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of projects
        """
        projects = await self.repository.get_projects_by_society(
            soc_id, skip, limit
        )
        return [self._project_to_response(p) for p in projects]

    async def get_project_lookup(
        self,
        soc_id: int,
        client_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """
        Get projects for dropdown/lookup.

        Args:
            soc_id: Society ID
            client_id: Optional client ID filter
            search: Optional search term
            limit: Maximum records to return

        Returns:
            List of lightweight project data for selection
        """
        return await self.repository.get_project_lookup(
            soc_id, client_id, search, limit
        )

    async def get_project_summary(
        self,
        soc_id: Optional[int] = None
    ) -> ProjectSummary:
        """
        Get summary statistics for projects.

        Args:
            soc_id: Optional society ID filter

        Returns:
            Project summary statistics
        """
        total_count = await self.repository.count_projects(soc_id=soc_id)

        return ProjectSummary(
            total_count=total_count,
            projects_by_client=0,  # Can be implemented if needed
            recent_projects=0      # Can be implemented if needed
        )

    # =====================
    # Helper Methods
    # =====================

    def _project_to_response(self, project: Project) -> ProjectResponse:
        """Convert a Project model to a response schema."""
        return ProjectResponse(
            prj_id=project.prj_id,
            prj_code=project.prj_code,
            prj_name=project.prj_name,
            cli_id=project.cli_id,
            pco_id=project.pco_id,
            pmo_id=project.pmo_id,
            vat_id=project.vat_id,
            soc_id=project.soc_id,
            usr_creator_id=project.usr_creator_id,
            prj_d_creation=project.prj_d_creation,
            prj_d_update=project.prj_d_update
        )

    async def _project_to_detail_response(
        self,
        project: Project
    ) -> ProjectDetailResponse:
        """Convert a Project model to a detailed response schema."""
        # Get related entity names
        client_name = None
        if project.client:
            client_name = project.client.cli_company_name

        society_name = None
        if project.society:
            society_name = project.society.soc_society_name

        creator_name = None
        if project.creator:
            creator_name = project.creator.display_name

        payment_term_name = None
        if project.payment_term:
            payment_term_name = project.payment_term.payt_designation

        payment_mode_name = None
        if project.payment_mode:
            payment_mode_name = project.payment_mode.pmo_designation

        vat_rate_name = None
        if project.vat_rate:
            vat_rate_name = project.vat_rate.vat_designation

        return ProjectDetailResponse(
            prj_id=project.prj_id,
            prj_code=project.prj_code,
            prj_name=project.prj_name,
            cli_id=project.cli_id,
            pco_id=project.pco_id,
            pmo_id=project.pmo_id,
            vat_id=project.vat_id,
            soc_id=project.soc_id,
            usr_creator_id=project.usr_creator_id,
            prj_d_creation=project.prj_d_creation,
            prj_d_update=project.prj_d_update,
            client_name=client_name,
            society_name=society_name,
            creator_name=creator_name,
            payment_term_name=payment_term_name,
            payment_mode_name=payment_mode_name,
            vat_rate_name=vat_rate_name
        )

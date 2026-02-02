"""
Repository for Project data access operations.
"""
from typing import Optional, List, Tuple
from datetime import datetime
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectSearchParams
)


class ProjectRepository:
    """Repository for project related data operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =====================
    # Project Operations
    # =====================

    async def create_project(self, data: ProjectCreate) -> Project:
        """Create a new project."""
        project = Project(
            prj_code=data.prj_code,
            prj_name=data.prj_name,
            cli_id=data.cli_id,
            pco_id=data.pco_id,
            pmo_id=data.pmo_id,
            vat_id=data.vat_id,
            soc_id=data.soc_id,
            usr_creator_id=data.usr_creator_id,
            prj_d_creation=datetime.utcnow()
        )

        self.db.add(project)
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def get_project(self, project_id: int) -> Optional[Project]:
        """Get a project by ID with related entities."""
        result = await self.db.execute(
            select(Project)
            .options(
                selectinload(Project.client),
                selectinload(Project.society),
                selectinload(Project.creator),
                selectinload(Project.payment_term),
                selectinload(Project.payment_mode),
                selectinload(Project.vat_rate)
            )
            .where(Project.prj_id == project_id)
        )
        return result.scalar_one_or_none()

    async def get_project_by_code(
        self,
        code: str,
        soc_id: int
    ) -> Optional[Project]:
        """Get a project by code within a society."""
        result = await self.db.execute(
            select(Project)
            .where(
                and_(
                    Project.prj_code == code,
                    Project.soc_id == soc_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def update_project(
        self,
        project_id: int,
        data: ProjectUpdate
    ) -> Optional[Project]:
        """Update a project."""
        project = await self.get_project(project_id)
        if not project:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(project, field, value)

        project.prj_d_update = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(project)
        return project

    async def delete_project(self, project_id: int) -> bool:
        """Delete a project."""
        project = await self.get_project(project_id)
        if not project:
            return False

        await self.db.delete(project)
        await self.db.flush()
        return True

    async def search_projects(
        self,
        params: ProjectSearchParams
    ) -> Tuple[List[Project], int]:
        """Search projects with filters and pagination."""
        query = select(Project).options(
            selectinload(Project.client),
            selectinload(Project.society),
            selectinload(Project.creator)
        )
        count_query = select(func.count(Project.prj_id))

        conditions = []

        # Text search across multiple fields
        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    Project.prj_name.ilike(search_term),
                    Project.prj_code.ilike(search_term)
                )
            )

        if params.code:
            conditions.append(Project.prj_code.ilike(f"%{params.code}%"))
        if params.name:
            conditions.append(Project.prj_name.ilike(f"%{params.name}%"))
        if params.client_id:
            conditions.append(Project.cli_id == params.client_id)
        if params.society_id:
            conditions.append(Project.soc_id == params.society_id)
        if params.creator_id:
            conditions.append(Project.usr_creator_id == params.creator_id)
        if params.date_from:
            conditions.append(Project.prj_d_creation >= params.date_from)
        if params.date_to:
            conditions.append(Project.prj_d_creation <= params.date_to)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_field = params.sort_by or "prj_d_creation"
        sort_column = getattr(Project, sort_field, Project.prj_d_creation)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        offset = (params.page - 1) * params.page_size
        query = query.offset(offset).limit(params.page_size)

        # Execute queries
        result = await self.db.execute(query)
        projects = list(result.scalars().all())

        count_result = await self.db.execute(count_query)
        total = count_result.scalar_one()

        return projects, total

    async def get_projects_by_society(
        self,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Project]:
        """Get all projects for a society."""
        result = await self.db.execute(
            select(Project)
            .options(selectinload(Project.client))
            .where(Project.soc_id == soc_id)
            .order_by(Project.prj_d_creation.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_projects_by_client(
        self,
        client_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Project]:
        """Get all projects for a client."""
        result = await self.db.execute(
            select(Project)
            .where(Project.cli_id == client_id)
            .order_by(Project.prj_d_creation.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_projects(
        self,
        soc_id: Optional[int] = None,
        client_id: Optional[int] = None
    ) -> int:
        """Count total projects, optionally filtered by society or client."""
        query = select(func.count(Project.prj_id))
        conditions = []

        if soc_id:
            conditions.append(Project.soc_id == soc_id)
        if client_id:
            conditions.append(Project.cli_id == client_id)

        if conditions:
            query = query.where(and_(*conditions))

        result = await self.db.execute(query)
        return result.scalar_one()

    async def check_code_exists(
        self,
        code: str,
        soc_id: int,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if a project code already exists."""
        query = select(func.count(Project.prj_id)).where(
            and_(
                Project.prj_code == code,
                Project.soc_id == soc_id
            )
        )
        if exclude_id:
            query = query.where(Project.prj_id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    # =====================
    # Lookup Operations
    # =====================

    async def get_project_lookup(
        self,
        soc_id: int,
        client_id: Optional[int] = None,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """
        Get projects for dropdown/lookup.
        Returns lightweight data for search/selection.
        """
        query = select(
            Project.prj_id,
            Project.prj_code,
            Project.prj_name,
            Project.cli_id
        ).where(Project.soc_id == soc_id)

        if client_id:
            query = query.where(Project.cli_id == client_id)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Project.prj_name.ilike(search_term),
                    Project.prj_code.ilike(search_term)
                )
            )

        query = query.order_by(Project.prj_d_creation.desc()).limit(limit)

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.prj_id,
                "code": row.prj_code,
                "name": row.prj_name,
                "client_id": row.cli_id,
                "display_name": f"{row.prj_code} - {row.prj_name}"
            }
            for row in rows
        ]

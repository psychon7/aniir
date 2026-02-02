"""
Pydantic schemas for Project operations.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# =====================
# Project Schemas
# =====================

class ProjectBase(BaseModel):
    """Base schema for Project."""
    prj_code: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Project code (unique identifier)"
    )
    prj_name: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Project name"
    )
    cli_id: int = Field(..., description="Client ID")
    pco_id: int = Field(..., description="Payment condition/term ID")
    pmo_id: int = Field(..., description="Payment mode ID")
    vat_id: int = Field(..., description="VAT rate ID")
    soc_id: int = Field(..., description="Society/Organization ID")


class ProjectCreate(ProjectBase):
    """Schema for creating a Project."""
    usr_creator_id: Optional[int] = Field(
        None,
        description="Creator user ID (defaults to current user)"
    )


class ProjectUpdate(BaseModel):
    """Schema for updating a Project."""
    prj_code: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Project code"
    )
    prj_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=1000,
        description="Project name"
    )
    cli_id: Optional[int] = Field(None, description="Client ID")
    pco_id: Optional[int] = Field(None, description="Payment condition/term ID")
    pmo_id: Optional[int] = Field(None, description="Payment mode ID")
    vat_id: Optional[int] = Field(None, description="VAT rate ID")
    soc_id: Optional[int] = Field(None, description="Society/Organization ID")


class ProjectResponse(ProjectBase):
    """Schema for Project response."""
    model_config = ConfigDict(from_attributes=True)

    prj_id: int = Field(..., description="Project ID")
    usr_creator_id: int = Field(..., description="Creator user ID")
    prj_d_creation: datetime = Field(..., description="Creation date")
    prj_d_update: Optional[datetime] = Field(None, description="Last update date")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get display name combining code and name."""
        return f"{self.prj_code} - {self.prj_name}"


class ProjectDetailResponse(BaseModel):
    """
    Schema for project detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /projects/{project_id} endpoint.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="prj_id", description="Project ID")
    code: str = Field(..., validation_alias="prj_code", description="Project code")
    name: str = Field(..., validation_alias="prj_name", description="Project name")

    # Timestamps
    createdAt: datetime = Field(..., validation_alias="prj_d_creation", description="Creation timestamp")
    updatedAt: Optional[datetime] = Field(None, validation_alias="prj_d_update", description="Last update timestamp")

    # Foreign key IDs
    clientId: int = Field(..., validation_alias="cli_id", description="Client ID")
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    paymentConditionId: int = Field(..., validation_alias="pco_id", description="Payment condition ID")
    paymentModeId: int = Field(..., validation_alias="pmo_id", description="Payment mode ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT ID")
    creatorId: int = Field(..., validation_alias="usr_creator_id", description="Creator user ID")

    # Text fields
    headerText: Optional[str] = Field(None, validation_alias="prj_header_text", description="Header text")
    footerText: Optional[str] = Field(None, validation_alias="prj_footer_text", description="Footer text")
    clientComment: Optional[str] = Field(None, validation_alias="prj_client_comment", description="Client comment")
    internalComment: Optional[str] = Field(None, validation_alias="prj_inter_comment", description="Internal comment")

    # =====================================================
    # Resolved lookup names (populated by service layer)
    # These are not from the ORM directly but enriched data
    # =====================================================
    clientName: Optional[str] = Field(None, description="Resolved client company name")
    societyName: Optional[str] = Field(None, description="Resolved society name")
    paymentModeName: Optional[str] = Field(None, description="Resolved payment mode name")
    paymentConditionName: Optional[str] = Field(None, description="Resolved payment condition name")
    paymentTermDays: Optional[int] = Field(None, description="Payment term total days")
    creatorName: Optional[str] = Field(None, description="Creator user display name")
    vatRateName: Optional[str] = Field(None, description="VAT rate designation")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get project's display name."""
        return f"{self.code} - {self.name}"


# =====================
# Search/Filter Schemas
# =====================

class ProjectSearchParams(BaseModel):
    """Search parameters for projects."""
    code: Optional[str] = Field(None, description="Filter by project code (partial match)")
    name: Optional[str] = Field(None, description="Filter by project name (partial match)")
    client_id: Optional[int] = Field(None, description="Filter by client")
    society_id: Optional[int] = Field(None, description="Filter by society")
    creator_id: Optional[int] = Field(None, description="Filter by creator")
    date_from: Optional[datetime] = Field(None, description="Created from date")
    date_to: Optional[datetime] = Field(None, description="Created to date")
    search: Optional[str] = Field(
        None,
        description="General search term (searches code and name)"
    )
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: str = Field(default="prj_d_creation", description="Sort field")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")


class ProjectListResponse(BaseModel):
    """Paginated list of projects."""
    items: List[ProjectResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# =====================
# Summary/Stats Schemas
# =====================

class ProjectSummary(BaseModel):
    """Summary statistics for projects."""
    total_count: int = Field(..., description="Total number of projects")
    projects_by_client: int = Field(default=0, description="Number of unique clients with projects")
    recent_projects: int = Field(default=0, description="Projects created in last 30 days")

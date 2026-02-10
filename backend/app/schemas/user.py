"""
Pydantic schemas for User API requests and responses.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field, EmailStr


# ==========================================================================
# User Base Schemas
# ==========================================================================

class UserBase(BaseModel):
    """Base schema for User."""
    usr_login: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Username for login"
    )
    usr_firstname: Optional[str] = Field(
        None,
        max_length=200,
        description="First name"
    )
    usr_lastname: Optional[str] = Field(
        None,
        max_length=200,
        description="Last name"
    )
    usr_title: Optional[str] = Field(
        None,
        max_length=200,
        description="Job title"
    )
    usr_email: Optional[str] = Field(
        None,
        max_length=200,
        description="Email address"
    )
    usr_tel: Optional[str] = Field(
        None,
        max_length=200,
        description="Telephone number"
    )
    usr_cellphone: Optional[str] = Field(
        None,
        max_length=200,
        description="Cellphone number"
    )
    usr_fax: Optional[str] = Field(
        None,
        max_length=200,
        description="Fax number"
    )
    usr_code_hr: Optional[str] = Field(
        None,
        max_length=200,
        description="HR code"
    )
    usr_address1: Optional[str] = Field(
        None,
        max_length=400,
        description="Address line 1"
    )
    usr_address2: Optional[str] = Field(
        None,
        max_length=400,
        description="Address line 2"
    )
    usr_postcode: Optional[str] = Field(
        None,
        max_length=400,
        description="Postal code"
    )
    usr_city: Optional[str] = Field(
        None,
        max_length=400,
        description="City"
    )
    usr_county: Optional[str] = Field(
        None,
        max_length=400,
        description="County/State"
    )
    usr_photo_path: Optional[str] = Field(
        None,
        max_length=2000,
        description="Profile photo path"
    )
    rol_id: int = Field(
        ...,
        description="Role ID (FK to TR_ROL_Role)"
    )
    civ_id: int = Field(
        ...,
        description="Civility ID (FK to TR_CIV_Civility)"
    )
    soc_id: int = Field(
        ...,
        description="Society ID (FK to TR_SOC_Society)"
    )
    usr_creator_id: Optional[int] = Field(
        None,
        description="Creator user ID (FK to TM_USR_User)"
    )
    usr_is_actived: bool = Field(
        True,
        description="Whether the user is active"
    )
    usr_super_right: bool = Field(
        False,
        description="Whether the user has admin/super rights"
    )


class UserCreate(UserBase):
    """Schema for creating a User."""
    usr_pwd: str = Field(
        ...,
        min_length=6,
        max_length=200,
        description="Password (will be hashed)"
    )


class UserUpdate(BaseModel):
    """Schema for updating a User (all fields optional)."""
    usr_login: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Username for login"
    )
    usr_pwd: Optional[str] = Field(
        None,
        min_length=6,
        max_length=200,
        description="New password (will be hashed)"
    )
    usr_firstname: Optional[str] = Field(
        None,
        max_length=200,
        description="First name"
    )
    usr_lastname: Optional[str] = Field(
        None,
        max_length=200,
        description="Last name"
    )
    usr_title: Optional[str] = Field(
        None,
        max_length=200,
        description="Job title"
    )
    usr_email: Optional[str] = Field(
        None,
        max_length=200,
        description="Email address"
    )
    usr_tel: Optional[str] = Field(
        None,
        max_length=200,
        description="Telephone number"
    )
    usr_cellphone: Optional[str] = Field(
        None,
        max_length=200,
        description="Cellphone number"
    )
    usr_fax: Optional[str] = Field(
        None,
        max_length=200,
        description="Fax number"
    )
    usr_code_hr: Optional[str] = Field(
        None,
        max_length=200,
        description="HR code"
    )
    usr_address1: Optional[str] = Field(
        None,
        max_length=400,
        description="Address line 1"
    )
    usr_address2: Optional[str] = Field(
        None,
        max_length=400,
        description="Address line 2"
    )
    usr_postcode: Optional[str] = Field(
        None,
        max_length=400,
        description="Postal code"
    )
    usr_city: Optional[str] = Field(
        None,
        max_length=400,
        description="City"
    )
    usr_county: Optional[str] = Field(
        None,
        max_length=400,
        description="County/State"
    )
    usr_photo_path: Optional[str] = Field(
        None,
        max_length=2000,
        description="Profile photo path"
    )
    rol_id: Optional[int] = Field(
        None,
        description="Role ID (FK to TR_ROL_Role)"
    )
    civ_id: Optional[int] = Field(
        None,
        description="Civility ID (FK to TR_CIV_Civility)"
    )
    soc_id: Optional[int] = Field(
        None,
        description="Society ID (FK to TR_SOC_Society)"
    )
    usr_creator_id: Optional[int] = Field(
        None,
        description="Creator user ID (FK to TM_USR_User)"
    )
    usr_is_actived: Optional[bool] = Field(
        None,
        description="Whether the user is active"
    )
    usr_super_right: Optional[bool] = Field(
        None,
        description="Whether the user has admin/super rights"
    )


# ==========================================================================
# Role/Civility/Society Nested Schemas
# ==========================================================================

class RoleInfo(BaseModel):
    """Nested role information for user response."""
    model_config = ConfigDict(from_attributes=True)

    rol_id: int = Field(..., description="Role ID")
    rol_name: str = Field(..., description="Role name")
    rol_active: bool = Field(..., description="Role is active")

    @computed_field
    @property
    def is_admin_role(self) -> bool:
        """Check if this is an admin role."""
        return self.rol_id in (1, 5)


class CivilityInfo(BaseModel):
    """Nested civility information for user response."""
    model_config = ConfigDict(from_attributes=True)

    civ_id: int = Field(..., description="Civility ID")
    civ_designation: str = Field(..., description="Civility designation (Mr., Ms., etc.)")
    civ_active: bool = Field(..., description="Civility is active")


class SocietyInfo(BaseModel):
    """Nested society information for user response."""
    model_config = ConfigDict(from_attributes=True)

    soc_id: int = Field(..., description="Society ID")
    soc_society_name: str = Field(..., description="Society name")


# ==========================================================================
# User Response Schemas
# ==========================================================================

class UserResponse(BaseModel):
    """Schema for User response."""
    model_config = ConfigDict(from_attributes=True)

    usr_id: int = Field(..., description="User ID")
    usr_login: str = Field(..., description="Username for login")
    usr_firstname: Optional[str] = Field(None, description="First name")
    usr_lastname: Optional[str] = Field(None, description="Last name")
    usr_title: Optional[str] = Field(None, description="Job title")
    usr_email: Optional[str] = Field(None, description="Email address")
    usr_tel: Optional[str] = Field(None, description="Telephone number")
    usr_cellphone: Optional[str] = Field(None, description="Cellphone number")
    usr_fax: Optional[str] = Field(None, description="Fax number")
    usr_code_hr: Optional[str] = Field(None, description="HR code")
    usr_address1: Optional[str] = Field(None, description="Address line 1")
    usr_address2: Optional[str] = Field(None, description="Address line 2")
    usr_postcode: Optional[str] = Field(None, description="Postal code")
    usr_city: Optional[str] = Field(None, description="City")
    usr_county: Optional[str] = Field(None, description="County/State")
    usr_photo_path: Optional[str] = Field(None, description="Profile photo path")
    rol_id: int = Field(..., description="Role ID")
    civ_id: int = Field(..., description="Civility ID")
    soc_id: int = Field(..., description="Society ID")
    usr_creator_id: Optional[int] = Field(None, description="Creator user ID")
    usr_is_actived: bool = Field(..., description="Whether the user is active")
    usr_super_right: bool = Field(..., description="Whether the user has admin rights")
    usr_d_creation: datetime = Field(..., description="Creation timestamp")
    usr_d_update: datetime = Field(..., description="Last update timestamp")

    # Nested related data
    role: Optional[RoleInfo] = Field(None, description="Role information")
    civility: Optional[CivilityInfo] = Field(None, description="Civility information")
    society: Optional[SocietyInfo] = Field(None, description="Society information")

    # --- camelCase computed fields for frontend ---

    @computed_field
    @property
    def id(self) -> int:
        return self.usr_id

    @computed_field
    @property
    def login(self) -> str:
        return self.usr_login

    @computed_field
    @property
    def firstName(self) -> Optional[str]:
        return self.usr_firstname

    @computed_field
    @property
    def lastName(self) -> Optional[str]:
        return self.usr_lastname

    @computed_field
    @property
    def fullName(self) -> str:
        if self.usr_firstname and self.usr_lastname:
            return f"{self.usr_firstname} {self.usr_lastname}"
        return self.usr_login

    @computed_field
    @property
    def title(self) -> Optional[str]:
        return self.usr_title

    @computed_field
    @property
    def email(self) -> Optional[str]:
        return self.usr_email

    @computed_field
    @property
    def telephone(self) -> Optional[str]:
        return self.usr_tel

    @computed_field
    @property
    def cellphone(self) -> Optional[str]:
        return self.usr_cellphone

    @computed_field
    @property
    def fax(self) -> Optional[str]:
        return self.usr_fax

    @computed_field
    @property
    def hrCode(self) -> Optional[str]:
        return self.usr_code_hr

    @computed_field
    @property
    def address1(self) -> Optional[str]:
        return self.usr_address1

    @computed_field
    @property
    def address2(self) -> Optional[str]:
        return self.usr_address2

    @computed_field
    @property
    def postcode(self) -> Optional[str]:
        return self.usr_postcode

    @computed_field
    @property
    def city(self) -> Optional[str]:
        return self.usr_city

    @computed_field
    @property
    def county(self) -> Optional[str]:
        return self.usr_county

    @computed_field
    @property
    def photoPath(self) -> Optional[str]:
        return self.usr_photo_path

    @computed_field
    @property
    def roleId(self) -> int:
        return self.rol_id

    @computed_field
    @property
    def roleName(self) -> Optional[str]:
        return self.role.rol_name if self.role else None

    @computed_field
    @property
    def civilityId(self) -> int:
        return self.civ_id

    @computed_field
    @property
    def civilityDesignation(self) -> Optional[str]:
        return self.civility.civ_designation if self.civility else None

    @computed_field
    @property
    def societyId(self) -> int:
        return self.soc_id

    @computed_field
    @property
    def societyName(self) -> Optional[str]:
        return self.society.soc_society_name if self.society else None

    @computed_field
    @property
    def creatorId(self) -> Optional[int]:
        return self.usr_creator_id

    @computed_field
    @property
    def isActive(self) -> bool:
        return self.usr_is_actived

    @computed_field
    @property
    def isAdmin(self) -> bool:
        return self.usr_super_right or (self.role is not None and self.role.is_admin_role)

    @computed_field
    @property
    def createdAt(self) -> str:
        return self.usr_d_creation.isoformat()

    @computed_field
    @property
    def updatedAt(self) -> str:
        return self.usr_d_update.isoformat()

    # --- legacy snake_case computed fields ---

    @computed_field
    @property
    def display_name(self) -> str:
        """Get user's display name."""
        if self.usr_firstname and self.usr_lastname:
            return f"{self.usr_firstname} {self.usr_lastname}"
        return self.usr_login

    @computed_field
    @property
    def full_name(self) -> str:
        """Get user's full name with civility."""
        parts = []
        if self.civility:
            parts.append(self.civility.civ_designation)
        if self.usr_firstname:
            parts.append(self.usr_firstname)
        if self.usr_lastname:
            parts.append(self.usr_lastname)
        return " ".join(parts) if parts else self.usr_login

    @computed_field
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.usr_super_right or (self.role is not None and self.role.is_admin_role)

    @computed_field
    @property
    def primary_phone(self) -> Optional[str]:
        """Get user's primary phone (cellphone or tel)."""
        return self.usr_cellphone or self.usr_tel

    @computed_field
    @property
    def full_address(self) -> Optional[str]:
        """Get user's full address."""
        parts = [
            self.usr_address1,
            self.usr_address2,
            self.usr_postcode,
            self.usr_city,
            self.usr_county
        ]
        filtered = [p for p in parts if p]
        return ", ".join(filtered) if filtered else None


class UserListResponse(BaseModel):
    """Schema for listing users (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    usr_id: int = Field(..., description="User ID")
    usr_login: str = Field(..., description="Username for login")
    usr_firstname: Optional[str] = Field(None, description="First name")
    usr_lastname: Optional[str] = Field(None, description="Last name")
    usr_email: Optional[str] = Field(None, description="Email address")
    rol_id: int = Field(..., description="Role ID")
    soc_id: int = Field(..., description="Society ID")
    usr_is_actived: bool = Field(..., description="Whether the user is active")
    usr_super_right: bool = Field(..., description="Whether the user has admin rights")
    usr_d_creation: datetime = Field(..., description="Creation timestamp")

    # Nested related data (lightweight)
    role: Optional[RoleInfo] = Field(None, description="Role information")
    society: Optional[SocietyInfo] = Field(None, description="Society information")

    # --- camelCase computed fields for frontend ---

    @computed_field
    @property
    def id(self) -> int:
        return self.usr_id

    @computed_field
    @property
    def login(self) -> str:
        return self.usr_login

    @computed_field
    @property
    def firstName(self) -> Optional[str]:
        return self.usr_firstname

    @computed_field
    @property
    def lastName(self) -> Optional[str]:
        return self.usr_lastname

    @computed_field
    @property
    def fullName(self) -> str:
        if self.usr_firstname and self.usr_lastname:
            return f"{self.usr_firstname} {self.usr_lastname}"
        return self.usr_login

    @computed_field
    @property
    def email(self) -> Optional[str]:
        return self.usr_email

    @computed_field
    @property
    def roleName(self) -> Optional[str]:
        return self.role.rol_name if self.role else None

    @computed_field
    @property
    def societyName(self) -> Optional[str]:
        return self.society.soc_society_name if self.society else None

    @computed_field
    @property
    def isActive(self) -> bool:
        return self.usr_is_actived

    @computed_field
    @property
    def isAdmin(self) -> bool:
        return self.usr_super_right or (self.role is not None and self.role.is_admin_role)

    @computed_field
    @property
    def display_name(self) -> str:
        """Get user's display name."""
        if self.usr_firstname and self.usr_lastname:
            return f"{self.usr_firstname} {self.usr_lastname}"
        return self.usr_login

    @computed_field
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.usr_super_right or (self.role is not None and self.role.is_admin_role)


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class UserSearchParams(BaseModel):
    """Search/filter parameters for user list."""
    search: Optional[str] = Field(
        None,
        max_length=100,
        description="Search in username, first name, last name, email"
    )
    role_id: Optional[int] = Field(
        None,
        description="Filter by role ID"
    )
    society_id: Optional[int] = Field(
        None,
        description="Filter by society ID"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Filter by active status"
    )
    is_admin: Optional[bool] = Field(
        None,
        description="Filter by admin status"
    )


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class UserListPaginatedResponse(BaseModel):
    """Paginated response for user list."""
    items: List[UserListResponse] = Field(
        ...,
        description="List of users"
    )
    total: int = Field(
        ...,
        description="Total count of users matching criteria"
    )
    skip: int = Field(
        ...,
        description="Number of items skipped"
    )
    limit: int = Field(
        ...,
        description="Maximum items returned"
    )


# ==========================================================================
# Lookup Schemas
# ==========================================================================

class UserLookup(BaseModel):
    """User lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    usr_id: int = Field(..., description="User ID")
    usr_login: str = Field(..., description="Username")
    usr_firstname: Optional[str] = Field(None, description="First name")
    usr_lastname: Optional[str] = Field(None, description="Last name")
    usr_is_actived: bool = Field(..., description="Is active")

    @computed_field
    @property
    def id(self) -> int:
        return self.usr_id

    @computed_field
    @property
    def login(self) -> str:
        return self.usr_login

    @computed_field
    @property
    def firstName(self) -> Optional[str]:
        return self.usr_firstname

    @computed_field
    @property
    def lastName(self) -> Optional[str]:
        return self.usr_lastname

    @computed_field
    @property
    def fullName(self) -> str:
        if self.usr_firstname and self.usr_lastname:
            return f"{self.usr_firstname} {self.usr_lastname}"
        return self.usr_login

    @computed_field
    @property
    def isActive(self) -> bool:
        return self.usr_is_actived

    @computed_field
    @property
    def display_name(self) -> str:
        """Get user's display name."""
        if self.usr_firstname and self.usr_lastname:
            return f"{self.usr_firstname} {self.usr_lastname}"
        return self.usr_login


class RoleLookup(BaseModel):
    """Role lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    rol_id: int = Field(..., description="Role ID")
    rol_name: str = Field(..., description="Role name")
    rol_active: bool = Field(..., description="Is active")

    @computed_field
    @property
    def id(self) -> int:
        return self.rol_id

    @computed_field
    @property
    def name(self) -> str:
        return self.rol_name

    @computed_field
    @property
    def isActive(self) -> bool:
        return self.rol_active

    @computed_field
    @property
    def display_name(self) -> str:
        """Get role display name."""
        return self.rol_name


class CivilityLookup(BaseModel):
    """Civility lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    civ_id: int = Field(..., description="Civility ID")
    civ_designation: str = Field(..., description="Civility designation")
    civ_active: bool = Field(..., description="Is active")

    @computed_field
    @property
    def id(self) -> int:
        return self.civ_id

    @computed_field
    @property
    def designation(self) -> str:
        return self.civ_designation

    @computed_field
    @property
    def isActive(self) -> bool:
        return self.civ_active

    @computed_field
    @property
    def display_name(self) -> str:
        """Get civility display name."""
        return self.civ_designation


# ==========================================================================
# API Response Schemas
# ==========================================================================

class UserAPIResponse(BaseModel):
    """Standard API response wrapper for user operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[UserResponse] = Field(
        None,
        description="User data"
    )


class UserErrorResponse(BaseModel):
    """Error response for user operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

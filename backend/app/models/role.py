"""
Role model.
Maps to existing TR_ROL_Role table.

Actual DB schema:
  rol_id: int NOT NULL [PK]
  rol_name: nvarchar(200) NOT NULL
  rol_active: bit NOT NULL
  rol_level: int NOT NULL
"""
from typing import List, TYPE_CHECKING
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Role(Base):
    """
    Role reference table model.
    Maps to existing TR_ROL_Role table.

    This is a reference table that stores role definitions for user access control.
    Roles define the permissions and access levels for users in the ERP system.

    Sample data:
    - Admin (rol_id=1): Full system access
    - Manager (rol_id=5): Management access
    - User: Standard user access
    - Viewer: Read-only access

    Note: Users with rol_id=1 or rol_id=5 are considered administrators.
    """
    __tablename__ = "TR_ROL_Role"

    # Primary Key
    rol_id: Mapped[int] = mapped_column(
        "rol_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # Role Info
    rol_name: Mapped[str] = mapped_column(
        "rol_name",
        String(200),
        nullable=False
    )

    # Status
    rol_active: Mapped[bool] = mapped_column(
        "rol_active",
        Boolean,
        nullable=False,
        default=True
    )

    # Level
    rol_level: Mapped[int] = mapped_column(
        "rol_level",
        Integer,
        nullable=False,
        default=0
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="role",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Role(rol_id={self.rol_id}, name='{self.rol_name}', active={self.rol_active})>"

    @property
    def id(self) -> int:
        """Get role ID (alias for rol_id)."""
        return self.rol_id

    @property
    def name(self) -> str:
        """Get role name."""
        return self.rol_name

    @property
    def display_name(self) -> str:
        """Get role's display name."""
        return self.rol_name

    @property
    def is_active(self) -> bool:
        """Check if role is active."""
        return self.rol_active

    @property
    def is_admin_role(self) -> bool:
        """Check if this is an admin role (rol_id 1 or 5)."""
        return self.rol_id in (1, 5)

"""
User Model - SQLAlchemy model for user management

Maps to TM_USR_User table.

Actual DB schema:
  usr_id: int NOT NULL [PK]
  rol_id: int NOT NULL
  usr_login: nvarchar(200) NOT NULL
  usr_pwd: nvarchar(2000) NOT NULL
  usr_firstname: nvarchar(200) NULL
  usr_lastname: nvarchar(200) NULL
  usr_title: nvarchar(200) NULL
  civ_id: int NOT NULL
  usr_tel: nvarchar(200) NULL
  usr_cellphone: nvarchar(200) NULL
  usr_fax: nvarchar(200) NULL
  usr_email: nvarchar(200) NULL
  usr_code_hr: nvarchar(200) NULL
  usr_d_creation: datetime NOT NULL
  usr_d_update: datetime NOT NULL
  usr_is_actived: bit NOT NULL
  usr_photo_path: nvarchar(2000) NULL
  soc_id: int NOT NULL
  usr_address1: nvarchar(400) NULL
  usr_address2: nvarchar(400) NULL
  usr_postcode: nvarchar(400) NULL
  usr_city: nvarchar(400) NULL
  usr_county: nvarchar(400) NULL
  usr_super_right: bit NOT NULL
  usr_creator_id: int NULL
  usr_comment: nvarchar(1000) NULL
  usr_rcv_purchase_notif: bit NULL
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.society import Society


class Civility(Base):
    """
    Civility reference table model (Mr., Ms., Dr., etc.).
    Maps to existing TR_CIV_Civility table.

    Actual DB schema:
      civ_id: int NOT NULL [PK]
      civ_designation: nvarchar(200) NOT NULL
      civ_active: bit NOT NULL
    """
    __tablename__ = "TR_CIV_Civility"
    __table_args__ = {'extend_existing': True}

    civ_id: Mapped[int] = mapped_column(
        "civ_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )
    civ_designation: Mapped[str] = mapped_column(
        "civ_designation",
        String(200),
        nullable=False
    )
    civ_active: Mapped[bool] = mapped_column(
        "civ_active",
        Boolean,
        nullable=False,
        default=True
    )

    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        back_populates="civility",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Civility(civ_id={self.civ_id}, designation='{self.civ_designation}')>"

    @property
    def display_name(self) -> str:
        """Get civility's display name."""
        return self.civ_designation

    @property
    def is_active(self) -> bool:
        """Alias for civ_active for schema compatibility."""
        return self.civ_active


class User(Base):
    """
    User model - represents system users.
    Maps to TM_USR_User table with actual DB column names.
    """
    __tablename__ = "TM_USR_User"
    __table_args__ = {'extend_existing': True}

    # Primary key
    usr_id = Column("usr_id", Integer, primary_key=True, index=True, autoincrement=True)

    # Core fields - actual DB column names
    usr_login = Column("usr_login", String(200), nullable=False)
    usr_pwd = Column("usr_pwd", String(2000), nullable=False)
    usr_firstname = Column("usr_firstname", String(200), nullable=True)
    usr_lastname = Column("usr_lastname", String(200), nullable=True)
    usr_title = Column("usr_title", String(200), nullable=True)
    usr_email = Column("usr_email", String(200), nullable=True)
    usr_tel = Column("usr_tel", String(200), nullable=True)
    usr_cellphone = Column("usr_cellphone", String(200), nullable=True)
    usr_fax = Column("usr_fax", String(200), nullable=True)
    usr_code_hr = Column("usr_code_hr", String(200), nullable=True)

    # Status
    usr_is_actived = Column("usr_is_actived", Boolean, nullable=False, default=True)
    usr_super_right = Column("usr_super_right", Boolean, nullable=False, default=False)

    # Timestamps
    usr_d_creation = Column("usr_d_creation", DateTime, nullable=False, default=datetime.utcnow)
    usr_d_update = Column("usr_d_update", DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Foreign keys - actual DB column names
    rol_id = Column("rol_id", Integer, ForeignKey("TR_ROL_Role.rol_id"), nullable=False)
    soc_id = Column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    civ_id = Column("civ_id", Integer, ForeignKey("TR_CIV_Civility.civ_id"), nullable=False)
    usr_creator_id = Column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)

    # Photo and address
    usr_photo_path = Column("usr_photo_path", String(2000), nullable=True)
    usr_address1 = Column("usr_address1", String(400), nullable=True)
    usr_address2 = Column("usr_address2", String(400), nullable=True)
    usr_postcode = Column("usr_postcode", String(400), nullable=True)
    usr_city = Column("usr_city", String(400), nullable=True)
    usr_county = Column("usr_county", String(400), nullable=True)

    # Other
    usr_comment = Column("usr_comment", String(1000), nullable=True)
    usr_rcv_purchase_notif = Column("usr_rcv_purchase_notif", Boolean, nullable=True)

    # Relationships
    role = relationship("Role", back_populates="users", lazy="selectin")
    society = relationship("Society", back_populates="users", lazy="selectin")
    civility = relationship("Civility", back_populates="users", lazy="selectin")

    # ==========================================================================
    # Property aliases for API compatibility
    # ==========================================================================

    @property
    def id(self) -> int:
        return self.usr_id

    @property
    def email(self) -> str:
        return self.usr_email or self.usr_login

    @property
    def first_name(self) -> Optional[str]:
        return self.usr_firstname

    @property
    def last_name(self) -> Optional[str]:
        return self.usr_lastname

    @property
    def is_active(self) -> bool:
        return self.usr_is_actived

    @property
    def is_super_admin(self) -> bool:
        return self.usr_super_right

    @property
    def full_name(self) -> str:
        """Get user's full name"""
        parts = [self.usr_firstname, self.usr_lastname]
        return " ".join(p for p in parts if p) or self.usr_login

    def __repr__(self) -> str:
        return f"<User(usr_id={self.usr_id}, login='{self.usr_login}')>"

"""
SupplierContact model.
Maps to actual TM_SCO_Supplier_Contact table.

Actual DB schema:
  sco_id: int NOT NULL [PK]
  sco_firstname: nvarchar(200) NOT NULL
  sco_lastname: nvarchar(200) NOT NULL
  civ_id: int NOT NULL -> TR_CIV_Civility.civ_id
  sco_ref: nvarchar(50) NULL
  sco_adresse_title: nvarchar(200) NULL
  sco_address1: nvarchar(200) NULL
  sco_address2: nvarchar(200) NULL
  sco_postcode: nvarchar(50) NULL
  sco_city: nvarchar(200) NULL
  sco_country: nvarchar(200) NULL
  sco_tel1: nvarchar(100) NULL
  sco_tel2: nvarchar(100) NULL
  sco_fax: nvarchar(100) NULL
  sco_cellphone: nvarchar(100) NULL
  sco_email: nvarchar(100) NULL
  sco_recieve_newsletter: bit NOT NULL
  sco_newsletter_email: nvarchar(100) NULL
  sup_id: int NOT NULL -> TM_SUP_Supplier.sup_id
  usr_created_by: int NOT NULL -> TM_USR_User.usr_id
  sco_d_creation: datetime NOT NULL
  sco_d_update: datetime NOT NULL
  sco_comment: ntext NULL
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier


class SupplierContact(Base):
    """
    SupplierContact model.
    Maps to actual TM_SCO_Supplier_Contact table.
    """
    __tablename__ = "TM_SCO_Supplier_Contact"

    # Primary Key
    sco_id: Mapped[int] = mapped_column("sco_id", Integer, primary_key=True, autoincrement=True)

    # Name fields - note: no underscore in actual DB column names
    sco_firstname: Mapped[str] = mapped_column("sco_firstname", String(200), nullable=False)
    sco_lastname: Mapped[str] = mapped_column("sco_lastname", String(200), nullable=False)

    # Civility FK
    civ_id: Mapped[int] = mapped_column("civ_id", Integer, ForeignKey("TR_CIV_Civility.civ_id"), nullable=False)

    # Reference
    sco_ref: Mapped[Optional[str]] = mapped_column("sco_ref", String(50), nullable=True)

    # Address fields
    sco_adresse_title: Mapped[Optional[str]] = mapped_column("sco_adresse_title", String(200), nullable=True)
    sco_address1: Mapped[Optional[str]] = mapped_column("sco_address1", String(200), nullable=True)
    sco_address2: Mapped[Optional[str]] = mapped_column("sco_address2", String(200), nullable=True)
    sco_postcode: Mapped[Optional[str]] = mapped_column("sco_postcode", String(50), nullable=True)
    sco_city: Mapped[Optional[str]] = mapped_column("sco_city", String(200), nullable=True)
    sco_country: Mapped[Optional[str]] = mapped_column("sco_country", String(200), nullable=True)

    # Contact phones
    sco_tel1: Mapped[Optional[str]] = mapped_column("sco_tel1", String(100), nullable=True)
    sco_tel2: Mapped[Optional[str]] = mapped_column("sco_tel2", String(100), nullable=True)
    sco_fax: Mapped[Optional[str]] = mapped_column("sco_fax", String(100), nullable=True)
    sco_cellphone: Mapped[Optional[str]] = mapped_column("sco_cellphone", String(100), nullable=True)
    sco_email: Mapped[Optional[str]] = mapped_column("sco_email", String(100), nullable=True)

    # Newsletter settings
    sco_recieve_newsletter: Mapped[bool] = mapped_column("sco_recieve_newsletter", Boolean, nullable=False, default=False)
    sco_newsletter_email: Mapped[Optional[str]] = mapped_column("sco_newsletter_email", String(100), nullable=True)

    # FK to Supplier
    sup_id: Mapped[int] = mapped_column("sup_id", Integer, ForeignKey("TM_SUP_Supplier.sup_id"), nullable=False)

    # Audit fields
    usr_created_by: Mapped[int] = mapped_column("usr_created_by", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)
    sco_d_creation: Mapped[datetime] = mapped_column("sco_d_creation", DateTime, nullable=False)
    sco_d_update: Mapped[datetime] = mapped_column("sco_d_update", DateTime, nullable=False)

    # Comment
    sco_comment: Mapped[Optional[str]] = mapped_column("sco_comment", Text, nullable=True)

    # Relationships
    supplier: Mapped["Supplier"] = relationship("Supplier", lazy="selectin")

    def __repr__(self) -> str:
        return f"<SupplierContact(sco_id={self.sco_id}, name='{self.sco_firstname} {self.sco_lastname}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.sco_id

    @property
    def full_name(self) -> str:
        return f"{self.sco_firstname} {self.sco_lastname}"

    @property
    def first_name(self) -> str:
        return self.sco_firstname

    @property
    def last_name(self) -> str:
        return self.sco_lastname

    @property
    def email(self) -> Optional[str]:
        return self.sco_email

    @property
    def phone(self) -> Optional[str]:
        return self.sco_tel1

    @property
    def mobile(self) -> Optional[str]:
        return self.sco_cellphone

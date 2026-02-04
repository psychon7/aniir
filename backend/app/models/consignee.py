"""
Consignee model.
Maps to TM_CON_CONSIGNEE table.

Legacy DB schema (EDMX):
  con_id: int NOT NULL [PK]
  con_firstname: nvarchar NULL
  con_lastname: nvarchar NULL
  civ_id: int NOT NULL -> TR_CIV_Civility.civ_id
  con_code: nvarchar NULL
  con_adresse_title: nvarchar NULL
  con_address1: nvarchar NULL
  con_address2: nvarchar NULL
  con_address3: nvarchar NULL
  con_postcode: nvarchar NULL
  con_city: nvarchar NULL
  con_province: nvarchar NULL
  con_country: nvarchar NULL
  con_tel1: nvarchar NULL
  con_tel2: nvarchar NULL
  con_fax: nvarchar NULL
  con_cellphone: nvarchar NULL
  con_email: nvarchar NULL
  con_recieve_newsletter: bit NOT NULL
  con_newsletter_email: nvarchar NULL
  con_is_delivery_adr: bit NOT NULL
  con_is_invoicing_adr: bit NOT NULL
  usr_created_by: int NOT NULL -> TM_USR_User.usr_id
  soc_id: int NOT NULL -> TR_SOC_Society.soc_id
  con_d_creation: datetime NOT NULL
  con_d_update: datetime NOT NULL
  con_comment: ntext NULL
  con_cmu_id: int NULL -> TR_CMU_Commune.cmu_id
  con_company_name: nvarchar NULL
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import Civility, User
    from app.models.society import Society


class Consignee(Base):
    """Consignee model for delivery/invoicing addresses."""

    __tablename__ = "TM_CON_CONSIGNEE"

    con_id: Mapped[int] = mapped_column("con_id", Integer, primary_key=True, autoincrement=True)

    con_firstname: Mapped[Optional[str]] = mapped_column("con_firstname", String(200), nullable=True)
    con_lastname: Mapped[Optional[str]] = mapped_column("con_lastname", String(200), nullable=True)
    civ_id: Mapped[int] = mapped_column("civ_id", Integer, ForeignKey("TR_CIV_Civility.civ_id"), nullable=False)
    con_code: Mapped[Optional[str]] = mapped_column("con_code", String(200), nullable=True)
    con_adresse_title: Mapped[Optional[str]] = mapped_column("con_adresse_title", String(200), nullable=True)

    con_address1: Mapped[Optional[str]] = mapped_column("con_address1", String(200), nullable=True)
    con_address2: Mapped[Optional[str]] = mapped_column("con_address2", String(200), nullable=True)
    con_address3: Mapped[Optional[str]] = mapped_column("con_address3", String(200), nullable=True)
    con_postcode: Mapped[Optional[str]] = mapped_column("con_postcode", String(50), nullable=True)
    con_city: Mapped[Optional[str]] = mapped_column("con_city", String(200), nullable=True)
    con_province: Mapped[Optional[str]] = mapped_column("con_province", String(200), nullable=True)
    con_country: Mapped[Optional[str]] = mapped_column("con_country", String(200), nullable=True)

    con_tel1: Mapped[Optional[str]] = mapped_column("con_tel1", String(100), nullable=True)
    con_tel2: Mapped[Optional[str]] = mapped_column("con_tel2", String(100), nullable=True)
    con_fax: Mapped[Optional[str]] = mapped_column("con_fax", String(100), nullable=True)
    con_cellphone: Mapped[Optional[str]] = mapped_column("con_cellphone", String(100), nullable=True)
    con_email: Mapped[Optional[str]] = mapped_column("con_email", String(200), nullable=True)

    con_recieve_newsletter: Mapped[bool] = mapped_column("con_recieve_newsletter", Boolean, nullable=False, default=False)
    con_newsletter_email: Mapped[Optional[str]] = mapped_column("con_newsletter_email", String(200), nullable=True)
    con_is_delivery_adr: Mapped[bool] = mapped_column("con_is_delivery_adr", Boolean, nullable=False, default=False)
    con_is_invoicing_adr: Mapped[bool] = mapped_column("con_is_invoicing_adr", Boolean, nullable=False, default=False)

    usr_created_by: Mapped[int] = mapped_column("usr_created_by", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    con_d_creation: Mapped[datetime] = mapped_column("con_d_creation", DateTime, nullable=False)
    con_d_update: Mapped[datetime] = mapped_column("con_d_update", DateTime, nullable=False)

    con_comment: Mapped[Optional[str]] = mapped_column("con_comment", Text, nullable=True)
    con_cmu_id: Mapped[Optional[int]] = mapped_column("con_cmu_id", Integer, nullable=True)
    con_company_name: Mapped[Optional[str]] = mapped_column("con_company_name", String(200), nullable=True)

    civility: Mapped[Optional["Civility"]] = relationship("Civility", lazy="joined")
    creator: Mapped[Optional["User"]] = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<Consignee(con_id={self.con_id}, name='{self.con_firstname} {self.con_lastname}')>"

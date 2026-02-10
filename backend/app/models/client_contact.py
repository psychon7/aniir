"""
ClientContact model.
Maps to actual TM_CCO_Client_Contact table.

Actual DB schema:
  cco_id: int NOT NULL [PK]
  cco_firstname: nvarchar(200) NOT NULL
  cco_lastname: nvarchar(200) NOT NULL
  civ_id: int NOT NULL -> TR_CIV_Civility.civ_id
  cco_ref: nvarchar(50) NULL
  cco_adresse_title: nvarchar(200) NULL
  cco_address1: nvarchar(200) NULL
  cco_address2: nvarchar(200) NULL
  cco_postcode: nvarchar(50) NULL
  cco_city: nvarchar(200) NULL
  cco_country: nvarchar(200) NULL
  cco_tel1: nvarchar(100) NULL
  cco_tel2: nvarchar(100) NULL
  cco_fax: nvarchar(100) NULL
  cco_cellphone: nvarchar(100) NULL
  cco_email: nvarchar(100) NULL
  cco_recieve_newsletter: bit NOT NULL
  cco_newsletter_email: nvarchar(100) NULL
  cco_is_delivery_adr: bit NOT NULL
  cco_is_invoicing_adr: bit NOT NULL
  cli_id: int NOT NULL -> TM_CLI_CLient.cli_id
  usr_created_by: int NOT NULL -> TM_USR_User.usr_id
  cco_d_creation: datetime NOT NULL
  cco_d_update: datetime NOT NULL
  cco_comment: ntext NULL
  cmu_id: int NULL -> TR_CMU_Commune.cmu_id
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.client import Client


class ClientContact(Base):
    """
    ClientContact model.
    Maps to actual TM_CCO_Client_Contact table.
    Represents individual contacts associated with a client.
    """
    __tablename__ = "TM_CCO_Client_Contact"

    # Primary Key
    cco_id: Mapped[int] = mapped_column("cco_id", Integer, primary_key=True, autoincrement=True)

    # Names
    cco_firstname: Mapped[str] = mapped_column("cco_firstname", String(200), nullable=False)
    cco_lastname: Mapped[str] = mapped_column("cco_lastname", String(200), nullable=False)

    # Civility (Mr., Mrs., etc.)
    civ_id: Mapped[int] = mapped_column("civ_id", Integer, ForeignKey("TR_CIV_Civility.civ_id"), nullable=False)

    # Reference
    cco_ref: Mapped[Optional[str]] = mapped_column("cco_ref", String(50), nullable=True)

    # Address
    cco_adresse_title: Mapped[Optional[str]] = mapped_column("cco_adresse_title", String(200), nullable=True)
    cco_address1: Mapped[Optional[str]] = mapped_column("cco_address1", String(200), nullable=True)
    cco_address2: Mapped[Optional[str]] = mapped_column("cco_address2", String(200), nullable=True)
    cco_postcode: Mapped[Optional[str]] = mapped_column("cco_postcode", String(50), nullable=True)
    cco_city: Mapped[Optional[str]] = mapped_column("cco_city", String(200), nullable=True)
    cco_country: Mapped[Optional[str]] = mapped_column("cco_country", String(200), nullable=True)
    cmu_id: Mapped[Optional[int]] = mapped_column("cmu_id", Integer, ForeignKey("TR_CMU_Commune.cmu_id"), nullable=True)

    # Contact Information
    cco_tel1: Mapped[Optional[str]] = mapped_column("cco_tel1", String(100), nullable=True)
    cco_tel2: Mapped[Optional[str]] = mapped_column("cco_tel2", String(100), nullable=True)
    cco_fax: Mapped[Optional[str]] = mapped_column("cco_fax", String(100), nullable=True)
    cco_cellphone: Mapped[Optional[str]] = mapped_column("cco_cellphone", String(100), nullable=True)
    cco_email: Mapped[Optional[str]] = mapped_column("cco_email", String(100), nullable=True)

    # Newsletter
    cco_recieve_newsletter: Mapped[bool] = mapped_column("cco_recieve_newsletter", Boolean, nullable=False, default=False)
    cco_newsletter_email: Mapped[Optional[str]] = mapped_column("cco_newsletter_email", String(100), nullable=True)

    # Flags
    cco_is_delivery_adr: Mapped[bool] = mapped_column("cco_is_delivery_adr", Boolean, nullable=False, default=False)
    cco_is_invoicing_adr: Mapped[bool] = mapped_column("cco_is_invoicing_adr", Boolean, nullable=False, default=False)

    # Client relationship
    cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)

    # Creator and dates
    usr_created_by: Mapped[int] = mapped_column("usr_created_by", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)
    cco_d_creation: Mapped[datetime] = mapped_column("cco_d_creation", DateTime, nullable=False)
    cco_d_update: Mapped[datetime] = mapped_column("cco_d_update", DateTime, nullable=False)

    # Comment
    cco_comment: Mapped[Optional[str]] = mapped_column("cco_comment", Text, nullable=True)

    # Role
    cco_role: Mapped[Optional[str]] = mapped_column("cco_role", String(100), nullable=True)

    # Relationships
    client: Mapped["Client"] = relationship("Client", lazy="selectin")

    def __repr__(self) -> str:
        return f"<ClientContact(cco_id={self.cco_id}, name='{self.cco_firstname} {self.cco_lastname}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.cco_id

    @property
    def first_name(self) -> str:
        return self.cco_firstname

    @property
    def last_name(self) -> str:
        return self.cco_lastname

    @property
    def full_name(self) -> str:
        """Get the full name of the contact."""
        return f"{self.cco_firstname} {self.cco_lastname}"

    @property
    def email(self) -> Optional[str]:
        return self.cco_email

    @property
    def phone(self) -> Optional[str]:
        return self.cco_tel1

    @property
    def mobile(self) -> Optional[str]:
        return self.cco_cellphone

    @property
    def role(self) -> Optional[str]:
        return self.cco_role

    @property
    def client_id(self) -> int:
        return self.cli_id

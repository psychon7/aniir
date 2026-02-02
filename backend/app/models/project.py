"""
Project model.
Maps to actual TM_PRJ_Project table.

Actual DB schema:
  prj_id: int NOT NULL [PK]
  prj_code: nvarchar(50) NOT NULL
  prj_name: nvarchar(1000) NOT NULL
  prj_d_creation: datetime NOT NULL
  prj_d_update: datetime NULL
  cli_id: int NOT NULL -> TM_CLI_CLient.cli_id
  pco_id: int NOT NULL -> TR_PCO_Payment_Condition.pco_id
  pmo_id: int NOT NULL -> TR_PMO_Payment_Mode.pmo_id
  vat_id: int NOT NULL -> TR_VAT_Vat.vat_id
  soc_id: int NOT NULL -> TR_SOC_Society.soc_id
  prj_header_text: ntext NULL
  prj_footer_text: ntext NULL
  prj_client_comment: nvarchar(4000) NULL
  prj_inter_comment: nvarchar(4000) NULL
  usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
"""
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.user import User


class Project(Base):
    """
    Project model.
    Maps to actual TM_PRJ_Project table.

    Represents a business project or opportunity associated with a client.
    """
    __tablename__ = "TM_PRJ_Project"

    # Primary Key
    prj_id: Mapped[int] = mapped_column("prj_id", Integer, primary_key=True, autoincrement=True)

    # Project Code and Name
    prj_code: Mapped[str] = mapped_column("prj_code", String(50), nullable=False)
    prj_name: Mapped[str] = mapped_column("prj_name", String(1000), nullable=False)

    # Timestamps
    prj_d_creation: Mapped[datetime] = mapped_column("prj_d_creation", DateTime, nullable=False)
    prj_d_update: Mapped[Optional[datetime]] = mapped_column("prj_d_update", DateTime, nullable=True)

    # Client relationship - note the typo CLient in actual DB
    cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)

    # Payment Condition
    pco_id: Mapped[int] = mapped_column("pco_id", Integer, ForeignKey("TR_PCO_Payment_Condition.pco_id"), nullable=False)

    # Payment Mode
    pmo_id: Mapped[int] = mapped_column("pmo_id", Integer, ForeignKey("TR_PMO_Payment_Mode.pmo_id"), nullable=False)

    # VAT Rate
    vat_id: Mapped[int] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)

    # Society (Organization/Company)
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)

    # Header and footer text
    prj_header_text: Mapped[Optional[str]] = mapped_column("prj_header_text", Text, nullable=True)
    prj_footer_text: Mapped[Optional[str]] = mapped_column("prj_footer_text", Text, nullable=True)

    # Comments
    prj_client_comment: Mapped[Optional[str]] = mapped_column("prj_client_comment", String(4000), nullable=True)
    prj_inter_comment: Mapped[Optional[str]] = mapped_column("prj_inter_comment", String(4000), nullable=True)

    # Creator User
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # Relationships
    client: Mapped["Client"] = relationship("Client", backref="projects", foreign_keys=[cli_id])
    creator: Mapped["User"] = relationship("User", backref="created_projects", foreign_keys=[usr_creator_id])

    def __repr__(self) -> str:
        return f"<Project(prj_id={self.prj_id}, code='{self.prj_code}', name='{self.prj_name}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.prj_id

    @property
    def code(self) -> str:
        return self.prj_code

    @property
    def name(self) -> str:
        return self.prj_name

    @property
    def client_id(self) -> int:
        return self.cli_id

    @property
    def society_id(self) -> int:
        return self.soc_id

    @property
    def creator_id(self) -> int:
        return self.usr_creator_id

    @property
    def payment_term_id(self) -> int:
        return self.pco_id

    @property
    def payment_mode_id(self) -> int:
        return self.pmo_id

    @property
    def vat_rate_id(self) -> int:
        return self.vat_id

    @property
    def created_at(self) -> datetime:
        return self.prj_d_creation

    @property
    def updated_at(self) -> Optional[datetime]:
        return self.prj_d_update

    @property
    def display_name(self) -> str:
        return f"{self.prj_code} - {self.prj_name}"

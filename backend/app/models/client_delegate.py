"""
Client Delegate SQLAlchemy Model

Maps to TR_CDL_Client_Delegate table.
A delegate is another entity (usually a parent company or billing agent)
that receives invoices on behalf of a client.
"""
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.client import Client


class ClientDelegate(Base):
    """
    Client Delegate model.
    Maps to TR_CDL_Client_Delegate table.
    """
    __tablename__ = "TR_CDL_Client_Delegate"

    # Primary key
    cdl_id: Mapped[int] = mapped_column("cdl_id", Integer, primary_key=True, autoincrement=True)

    # Foreign keys
    cdl_cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)
    cdl_delegate_cli_id: Mapped[Optional[int]] = mapped_column("cli_delegate_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=True)

    # Delegate information (when delegate is not an existing client)
    cdl_company_name: Mapped[Optional[str]] = mapped_column("cdl_company_name", String(250), nullable=True)
    cdl_contact_name: Mapped[Optional[str]] = mapped_column("cdl_contact_name", String(200), nullable=True)
    cdl_email: Mapped[Optional[str]] = mapped_column("cdl_email", String(100), nullable=True)
    cdl_phone: Mapped[Optional[str]] = mapped_column("cdl_phone", String(100), nullable=True)

    # Address
    cdl_address1: Mapped[Optional[str]] = mapped_column("cdl_address1", String(200), nullable=True)
    cdl_address2: Mapped[Optional[str]] = mapped_column("cdl_address2", String(200), nullable=True)
    cdl_postcode: Mapped[Optional[str]] = mapped_column("cdl_postcode", String(50), nullable=True)
    cdl_city: Mapped[Optional[str]] = mapped_column("cdl_city", String(200), nullable=True)
    cdl_country: Mapped[Optional[str]] = mapped_column("cdl_country", String(200), nullable=True)

    # VAT information
    cdl_vat_number: Mapped[Optional[str]] = mapped_column("cdl_vat_number", String(50), nullable=True)

    # NOTE: cdl_is_active, cdl_is_primary, cdl_notes, cdl_d_creation, cdl_d_update,
    # cdl_created_by, cdl_updated_by columns do NOT exist in the legacy database table.
    # They were defined in the model but the table was never migrated to add them.

    # Relationships
    client: Mapped["Client"] = relationship(
        "Client",
        foreign_keys=[cdl_cli_id],
        backref="delegates"
    )
    delegate_client: Mapped[Optional["Client"]] = relationship(
        "Client",
        foreign_keys=[cdl_delegate_cli_id]
    )

    def __repr__(self) -> str:
        return f"<ClientDelegate(cdl_id={self.cdl_id}, client={self.cdl_cli_id}, delegate={self.cdl_company_name or self.cdl_delegate_cli_id})>"

    # Property aliases
    @property
    def id(self) -> int:
        return self.cdl_id

    @property
    def client_id(self) -> int:
        return self.cdl_cli_id

    @property
    def delegate_client_id(self) -> Optional[int]:
        return self.cdl_delegate_cli_id

    @property
    def company_name(self) -> Optional[str]:
        return self.cdl_company_name


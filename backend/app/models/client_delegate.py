"""
Client Delegate SQLAlchemy Model

Maps to TR_CDL_Client_Delegate table.
A delegate is another client entity (usually a parent company or billing agent)
that receives invoices on behalf of a client.

This is a junction table with only 3 columns: cdl_id, cli_id, cli_delegate_id.
All delegate information is resolved from the linked Client record.
"""
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.client import Client


class ClientDelegate(Base):
    """
    Client Delegate model.
    Maps to TR_CDL_Client_Delegate table (junction table).
    """
    __tablename__ = "TR_CDL_Client_Delegate"

    # Primary key
    cdl_id: Mapped[int] = mapped_column("cdl_id", Integer, primary_key=True, autoincrement=True)

    # Foreign keys
    cdl_cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)
    cdl_delegate_cli_id: Mapped[Optional[int]] = mapped_column("cli_delegate_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=True)

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
        return f"<ClientDelegate(cdl_id={self.cdl_id}, client={self.cdl_cli_id}, delegate_client={self.cdl_delegate_cli_id})>"

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

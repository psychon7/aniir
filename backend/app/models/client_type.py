"""
ClientType model.
Maps to existing TR_CTY_Client_Type table.

Actual DB schema:
  cty_id: int NOT NULL [PK]
  cty_description: nvarchar(20) NOT NULL
"""
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class ClientType(Base):
    """
    ClientType reference table model.
    Maps to existing TR_CTY_Client_Type table.

    This is a reference table that stores client type/classification definitions
    (e.g., 'Client', 'Prospect', 'Delegataire'). Client types help categorize
    clients for reporting and business logic purposes.
    """
    __tablename__ = "TR_CTY_Client_Type"

    # Primary Key
    cty_id: Mapped[int] = mapped_column(
        "cty_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # Client Type Info
    cty_description: Mapped[str] = mapped_column(
        "cty_description",
        String(20),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<ClientType(cty_id={self.cty_id}, description='{self.cty_description}')>"

    @property
    def id(self) -> int:
        return self.cty_id

    @property
    def display_name(self) -> str:
        """Get client type's display name."""
        return self.cty_description

    # Backward compatibility aliases
    @property
    def ct_id(self) -> int:
        return self.cty_id

    @property
    def ct_description(self) -> str:
        return self.cty_description

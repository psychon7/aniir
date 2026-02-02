"""
VAT Rate model.
Maps to existing TR_VAT_Vat table.

Actual DB schema:
  vat_id: int NOT NULL [PK]
  vat_designation: nvarchar(200) NOT NULL
  vat_vat_rate: decimal NOT NULL
  vat_description: nvarchar(30) NOT NULL
"""
from decimal import Decimal
from sqlalchemy import Integer, String, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class VatRate(Base):
    """
    VAT Rate reference table model.
    Maps to existing TR_VAT_Vat table.

    This is a reference table that stores VAT/Tax rate definitions
    (e.g., 20%, 5.5%, 0%) with their designations and descriptions.
    """
    __tablename__ = "TR_VAT_Vat"

    # Primary Key
    vat_id: Mapped[int] = mapped_column(
        "vat_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # VAT Info
    vat_designation: Mapped[str] = mapped_column(
        "vat_designation",
        String(200),
        nullable=False
    )
    vat_vat_rate: Mapped[Decimal] = mapped_column(
        "vat_vat_rate",
        Numeric(16, 4),
        nullable=False
    )
    vat_description: Mapped[str] = mapped_column(
        "vat_description",
        String(30),
        nullable=False
    )

    def __repr__(self) -> str:
        return f"<VatRate(vat_id={self.vat_id}, designation='{self.vat_designation}', rate={self.vat_vat_rate})>"

    @property
    def id(self) -> int:
        return self.vat_id

    @property
    def display_name(self) -> str:
        """Get VAT rate's display name with percentage."""
        return f"{self.vat_designation} ({self.vat_vat_rate}%)"

    @property
    def rate_decimal(self) -> Decimal:
        """Get the rate as a decimal multiplier (e.g., 0.20 for 20%)."""
        return self.vat_vat_rate / Decimal("100")

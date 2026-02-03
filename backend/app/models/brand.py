"""
Brand model.
Maps to existing TR_BRA_Brand table.
"""
from typing import Optional
from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Brand(Base):
    """
    Brand reference table model.
    Maps to existing TR_BRA_Brand table.

    This is a reference table that stores brand definitions
    (e.g., Samsung, Apple, LG) for products.
    """
    __tablename__ = "TR_BRA_Brand"

    # Primary Key
    bra_id: Mapped[int] = mapped_column(
        "bra_id",
        Integer,
        primary_key=True,
        autoincrement=True
    )

    # Society (for multi-tenant support)
    soc_id: Mapped[int] = mapped_column(
        "soc_id",
        Integer,
        ForeignKey("TR_SOC_Society.soc_id"),
        nullable=False
    )

    # Brand Info
    bra_code: Mapped[str] = mapped_column(
        "bra_code",
        String(50),
        nullable=False
    )
    bra_name: Mapped[str] = mapped_column(
        "bra_name",
        String(100),
        nullable=False
    )
    bra_description: Mapped[Optional[str]] = mapped_column(
        "bra_description",
        String(500),
        nullable=True
    )

    # Status
    bra_isactive: Mapped[bool] = mapped_column(
        "bra_isactive",
        Boolean,
        nullable=False,
        default=True
    )

    # Optional Firebase ID
    f_id: Mapped[Optional[str]] = mapped_column(
        "f_id",
        String(100),
        nullable=True
    )

    def __repr__(self) -> str:
        return f"<Brand(bra_id={self.bra_id}, code='{self.bra_code}', name='{self.bra_name}')>"

    @property
    def display_name(self) -> str:
        """Get brand's display name."""
        return f"{self.bra_code} - {self.bra_name}"

    @property
    def is_active(self) -> bool:
        """Alias for bra_isactive."""
        return self.bra_isactive

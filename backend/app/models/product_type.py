"""
ProductType model - Maps to existing TM_PTY_Product_Type table.

Actual DB schema:
  pty_id: int NOT NULL [PK]
  soc_id: int NOT NULL
  pty_name: nvarchar(200) NOT NULL
  pty_description: nvarchar(4000) NULL
  pty_specifications_fields: xml NULL
  pty_active: bit NOT NULL
  cor_id: int NULL
"""
from typing import Optional
from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class ProductType(Base):
    """
    ProductType model mapping to TM_PTY_Product_Type table.

    Represents a category or type of product in the catalog.
    """
    __tablename__ = "TM_PTY_Product_Type"

    # Primary Key
    pty_id: Mapped[int] = mapped_column("pty_id", Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    cor_id: Mapped[Optional[int]] = mapped_column("cor_id", Integer, nullable=True)

    # Basic Info
    pty_name: Mapped[str] = mapped_column("pty_name", String(200), nullable=False)
    pty_description: Mapped[Optional[str]] = mapped_column("pty_description", String(4000), nullable=True)

    # Status
    pty_active: Mapped[bool] = mapped_column("pty_active", Boolean, nullable=False, default=True)

    def __repr__(self) -> str:
        return f"<ProductType(pty_id={self.pty_id}, name='{self.pty_name}')>"

    # Property aliases for API compatibility
    @property
    def id(self) -> int:
        return self.pty_id

    @property
    def name(self) -> str:
        return self.pty_name

    @property
    def is_active(self) -> bool:
        return self.pty_active

    @property
    def display_name(self) -> str:
        """Get display name for the product type."""
        return self.pty_name

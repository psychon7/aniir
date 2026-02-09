"""
UnitOfMeasure model mapping to TR_UOM_UnitOfMeasure table.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class UnitOfMeasure(Base):
    """Unit of measure reference data."""
    __tablename__ = "TR_UOM_UnitOfMeasure"

    uom_id: Mapped[int] = mapped_column("uom_id", Integer, primary_key=True, autoincrement=True)
    uom_name: Mapped[str] = mapped_column("uom_name", String(100), nullable=False)
    uom_code: Mapped[str] = mapped_column("uom_code", String(20), nullable=False)
    uom_description: Mapped[Optional[str]] = mapped_column("uom_description", String(500), nullable=True)
    uom_is_active: Mapped[bool] = mapped_column("uom_is_active", Boolean, nullable=False, default=True)
    uom_d_creation: Mapped[Optional[datetime]] = mapped_column("uom_d_creation", DateTime, nullable=True)
    uom_d_update: Mapped[Optional[datetime]] = mapped_column("uom_d_update", DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<UnitOfMeasure(uom_id={self.uom_id}, code='{self.uom_code}')>"

    @property
    def id(self) -> int:
        return self.uom_id

    @property
    def name(self) -> str:
        return self.uom_name

    @property
    def code(self) -> str:
        return self.uom_code

    @property
    def is_active(self) -> bool:
        return self.uom_is_active

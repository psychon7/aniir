"""
BusinessUnit model mapping to TR_BU_BusinessUnit table.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Integer, String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class BusinessUnit(Base):
    """Business unit for multi-business segmentation."""
    __tablename__ = "TR_BU_BusinessUnit"

    bu_id: Mapped[int] = mapped_column("bu_id", Integer, primary_key=True, autoincrement=True)
    bu_name: Mapped[str] = mapped_column("bu_name", String(200), nullable=False)
    bu_code: Mapped[Optional[str]] = mapped_column("bu_code", String(50), nullable=True)
    bu_description: Mapped[Optional[str]] = mapped_column("bu_description", String(500), nullable=True)
    bu_is_active: Mapped[bool] = mapped_column("bu_is_active", Boolean, nullable=False, default=True)
    bu_color: Mapped[Optional[str]] = mapped_column("bu_color", String(50), nullable=True)
    bu_d_creation: Mapped[Optional[datetime]] = mapped_column("bu_d_creation", DateTime, nullable=True)
    bu_d_update: Mapped[Optional[datetime]] = mapped_column("bu_d_update", DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<BusinessUnit(bu_id={self.bu_id}, name='{self.bu_name}')>"

    @property
    def id(self) -> int:
        return self.bu_id

    @property
    def name(self) -> str:
        return self.bu_name

    @property
    def is_active(self) -> bool:
        return self.bu_is_active

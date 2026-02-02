"""
Warehouse model.
Maps to actual TM_WHS_WareHouse table.

Actual DB schema:
  whs_id: int NOT NULL [PK]
  whs_name: nvarchar(100) NOT NULL
  whs_code: nvarchar(100) NULL
  whs_address1: nvarchar(200) NULL
  whs_address2: nvarchar(200) NULL
  whs_postcode: nvarchar(50) NULL
  whs_city: nvarchar(200) NULL
  whs_country: nvarchar(200) NULL
  whs_volume: int NULL
"""
from typing import Optional
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class Warehouse(Base):
    """
    Warehouse model.
    Maps to actual TM_WHS_WareHouse table.

    Represents warehouse/storage locations for inventory management.
    """
    __tablename__ = "TM_WHS_WareHouse"

    # Primary Key
    whs_id: Mapped[int] = mapped_column("whs_id", Integer, primary_key=True, autoincrement=True)

    # Basic Info
    whs_name: Mapped[str] = mapped_column("whs_name", String(100), nullable=False)
    whs_code: Mapped[Optional[str]] = mapped_column("whs_code", String(100), nullable=True)

    # Address Info
    whs_address1: Mapped[Optional[str]] = mapped_column("whs_address1", String(200), nullable=True)
    whs_address2: Mapped[Optional[str]] = mapped_column("whs_address2", String(200), nullable=True)
    whs_postcode: Mapped[Optional[str]] = mapped_column("whs_postcode", String(50), nullable=True)
    whs_city: Mapped[Optional[str]] = mapped_column("whs_city", String(200), nullable=True)
    whs_country: Mapped[Optional[str]] = mapped_column("whs_country", String(200), nullable=True)

    # Volume capacity
    whs_volume: Mapped[Optional[int]] = mapped_column("whs_volume", Integer, nullable=True)

    def __repr__(self) -> str:
        return f"<Warehouse(whs_id={self.whs_id}, name='{self.whs_name}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.whs_id

    @property
    def wh_id(self) -> int:
        return self.whs_id

    @property
    def display_name(self) -> str:
        return self.whs_name

    @property
    def code(self) -> Optional[str]:
        return self.whs_code

    @property
    def name(self) -> str:
        return self.whs_name

    @property
    def full_address(self) -> str:
        parts = [self.whs_address1, self.whs_address2, self.whs_city, self.whs_postcode, self.whs_country]
        return ", ".join(p for p in parts if p)

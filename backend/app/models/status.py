"""
Status SQLAlchemy Model

Maps to existing TR_STT_Status table.

Actual DB schema:
  stt_id: int NOT NULL [PK]
  stt_order: int NOT NULL
  stt_value: nvarchar(100) NOT NULL
  stt_tab_name: nvarchar(100) NOT NULL
  stt_actived: bit NOT NULL
  stt_description: nvarchar(200) NULL
"""
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship, Mapped
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.order import ClientOrder
    from app.models.costplan import CostPlan


class Status(Base):
    """Status model mapping to TR_STT_Status table"""

    __tablename__ = "TR_STT_Status"

    # Primary key
    stt_id = Column("stt_id", Integer, primary_key=True, autoincrement=True)

    # Status details - matching actual DB columns
    stt_order = Column("stt_order", Integer, nullable=False)
    stt_value = Column("stt_value", String(100), nullable=False)
    stt_tab_name = Column("stt_tab_name", String(100), nullable=False)  # Entity type (e.g., 'Client', 'Order')
    stt_actived = Column("stt_actived", Boolean, nullable=False, default=True)
    stt_description = Column("stt_description", String(200), nullable=True)

    # Property aliases for backward compatibility
    @property
    def sta_id(self) -> int:
        return self.stt_id

    @property
    def sta_code(self) -> str:
        return self.stt_value

    @property
    def sta_name(self) -> str:
        return self.stt_value

    @property
    def sta_entity_type(self) -> str:
        return self.stt_tab_name

    @property
    def sta_is_active(self) -> bool:
        return self.stt_actived

    @property
    def sta_sort_order(self) -> int:
        return self.stt_order

    def __repr__(self) -> str:
        return f"<Status(stt_id={self.stt_id}, value='{self.stt_value}', tab='{self.stt_tab_name}')>"

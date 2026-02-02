"""
PaymentMode model - Maps to existing TR_PMO_Payment_Mode table.

Actual DB schema:
  pmo_id: int NOT NULL [PK]
  pmo_designation: nvarchar(60) NOT NULL
  pmo_isactive: bit NOT NULL
"""
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class PaymentMode(Base):
    """PaymentMode model mapping to TR_PMO_Payment_Mode table"""
    __tablename__ = "TR_PMO_Payment_Mode"

    pmo_id: Mapped[int] = mapped_column("pmo_id", Integer, primary_key=True, autoincrement=True)
    pmo_designation: Mapped[str] = mapped_column("pmo_designation", String(60), nullable=False)
    pmo_isactive: Mapped[bool] = mapped_column("pmo_isactive", Boolean, nullable=False, default=True)

    @property
    def id(self) -> int:
        return self.pmo_id

    @property
    def name(self) -> str:
        return self.pmo_designation

    @property
    def is_active(self) -> bool:
        return self.pmo_isactive

    def __repr__(self) -> str:
        return f"<PaymentMode(pmo_id={self.pmo_id}, designation='{self.pmo_designation}')>"

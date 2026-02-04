"""
Cost Plan Status model.

Maps to existing TR_CST_CostPlan_Statut table.

Actual DB schema:
  cst_id: int NOT NULL [PK]
  cst_designation: nvarchar(200) NOT NULL
  cst_isactive: bit NOT NULL
"""
from sqlalchemy import Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base


class CostPlanStatus(Base):
    """Cost plan status reference model."""
    __tablename__ = "TR_CST_CostPlan_Statut"
    __table_args__ = {"extend_existing": True}

    cst_id: Mapped[int] = mapped_column("cst_id", Integer, primary_key=True, autoincrement=True)
    cst_designation: Mapped[str] = mapped_column("cst_designation", String(200), nullable=False)
    cst_isactive: Mapped[bool] = mapped_column("cst_isactive", Boolean, nullable=False, default=True)

    @property
    def display_name(self) -> str:
        return self.cst_designation

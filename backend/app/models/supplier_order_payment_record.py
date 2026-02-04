"""
Supplier Order Payment Record model.
Maps to TR_SPR_SupplierOrder_Payment_Record table.

Actual DB schema (from EDMX):
  spr_id: int NOT NULL [PK]
  spr_d_creation: datetime NOT NULL
  spr_d_payment: datetime NOT NULL
  spr_amount: decimal NOT NULL
  spr_comment: nvarchar NULL
  sol_id: int NULL -> TM_SOL_SupplierOrder_Lines.sol_id
  spr_d_update: datetime NULL
  sod_id: int NULL -> TM_SOD_Supplier_Order.sod_id
  spr_file: nvarchar NULL
  spr_payer: nvarchar NULL
  spr_payment_code: nvarchar NULL
  spr_guid: nvarchar NULL
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.supplier_order import SupplierOrder, SupplierOrderLine


class SupplierOrderPaymentRecord(Base):
    """Supplier order payment record model."""

    __tablename__ = "TR_SPR_SupplierOrder_Payment_Record"

    spr_id: Mapped[int] = mapped_column("spr_id", Integer, primary_key=True, autoincrement=True)
    spr_d_creation: Mapped[datetime] = mapped_column("spr_d_creation", DateTime, nullable=False)
    spr_d_payment: Mapped[datetime] = mapped_column("spr_d_payment", DateTime, nullable=False)
    spr_amount: Mapped[Decimal] = mapped_column("spr_amount", Numeric(18, 2), nullable=False)
    spr_comment: Mapped[Optional[str]] = mapped_column("spr_comment", String(4000), nullable=True)
    sol_id: Mapped[Optional[int]] = mapped_column(
        "sol_id",
        Integer,
        ForeignKey("TM_SOL_SupplierOrder_Lines.sol_id"),
        nullable=True,
    )
    spr_d_update: Mapped[Optional[datetime]] = mapped_column("spr_d_update", DateTime, nullable=True)
    sod_id: Mapped[Optional[int]] = mapped_column(
        "sod_id",
        Integer,
        ForeignKey("TM_SOD_Supplier_Order.sod_id"),
        nullable=True,
    )
    spr_file: Mapped[Optional[str]] = mapped_column("spr_file", String(2000), nullable=True)
    spr_payer: Mapped[Optional[str]] = mapped_column("spr_payer", String(200), nullable=True)
    spr_payment_code: Mapped[Optional[str]] = mapped_column("spr_payment_code", String(200), nullable=True)
    spr_guid: Mapped[Optional[str]] = mapped_column("spr_guid", String(200), nullable=True)

    order: Mapped[Optional["SupplierOrder"]] = relationship("SupplierOrder", lazy="joined")
    line: Mapped[Optional["SupplierOrderLine"]] = relationship("SupplierOrderLine", lazy="joined")

    def __repr__(self) -> str:
        return f"<SupplierOrderPaymentRecord(spr_id={self.spr_id}, amount={self.spr_amount})>"

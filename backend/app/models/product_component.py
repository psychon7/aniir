"""
Product component relation model.

Maps to TI_PRC_ProductComponent and links a parent product to
another product used as DRIVER / ACCESSORY / OPTION.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, Numeric, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.product import Product


class ProductComponent(Base):
    """Product-to-product component relation."""

    __tablename__ = "TI_PRC_ProductComponent"
    __table_args__ = (
        UniqueConstraint("prd_id", "component_prd_id", "prc_component_type", name="UQ_TI_PRC_ProductComponent_Link"),
    )

    prc_id: Mapped[int] = mapped_column("prc_id", Integer, primary_key=True, autoincrement=True)
    prd_id: Mapped[int] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id", ondelete="CASCADE"), nullable=False)
    component_prd_id: Mapped[int] = mapped_column("component_prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=False)

    prc_component_type: Mapped[str] = mapped_column("prc_component_type", String(20), nullable=False)
    prc_quantity: Mapped[Optional[float]] = mapped_column("prc_quantity", Numeric(18, 4), nullable=True)
    prc_is_required: Mapped[bool] = mapped_column("prc_is_required", Boolean, nullable=False, default=True)
    prc_order: Mapped[int] = mapped_column("prc_order", Integer, nullable=False, default=0)

    prc_d_creation: Mapped[datetime] = mapped_column("prc_d_creation", DateTime, nullable=False, default=datetime.utcnow)
    prc_d_update: Mapped[Optional[datetime]] = mapped_column("prc_d_update", DateTime, nullable=True)

    product: Mapped["Product"] = relationship(
        "Product",
        foreign_keys=[prd_id],
        back_populates="components_as_parent",
    )
    component_product: Mapped["Product"] = relationship(
        "Product",
        foreign_keys=[component_prd_id],
        back_populates="components_as_child",
    )

    @property
    def id(self) -> int:
        return self.prc_id

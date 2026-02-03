"""
Supplier Product Price SQLAlchemy Model

Maps to TM_SPP_Supplier_Product_Price table.
Stores pricing information for products from specific suppliers.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier
    from app.models.product import Product


class SupplierProductPrice(Base):
    """
    Supplier Product Price model.
    Maps to TM_SPP_Supplier_Product_Price table.
    """
    __tablename__ = "TM_SPP_Supplier_Product_Price"

    # Primary key
    spp_id: Mapped[int] = mapped_column("spp_id", Integer, primary_key=True, autoincrement=True)

    # Foreign keys
    spp_sup_id: Mapped[int] = mapped_column("spp_sup_id", Integer, ForeignKey("TM_SUP_Supplier.sup_id"), nullable=False)
    spp_prd_id: Mapped[int] = mapped_column("spp_prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=False)
    spp_soc_id: Mapped[Optional[int]] = mapped_column("spp_soc_id", Integer, nullable=True)

    # Supplier's product reference (their SKU)
    spp_supplier_ref: Mapped[Optional[str]] = mapped_column("spp_supplier_ref", String(100), nullable=True)
    spp_supplier_name: Mapped[Optional[str]] = mapped_column("spp_supplier_name", String(200), nullable=True)

    # Pricing fields
    spp_unit_cost: Mapped[Decimal] = mapped_column("spp_unit_cost", Numeric(18, 4), nullable=False)
    spp_discount_percent: Mapped[Optional[Decimal]] = mapped_column("spp_discount_percent", Numeric(5, 2), nullable=True)
    spp_min_order_qty: Mapped[Optional[int]] = mapped_column("spp_min_order_qty", Integer, nullable=True)
    spp_lead_time_days: Mapped[Optional[int]] = mapped_column("spp_lead_time_days", Integer, nullable=True)

    # Currency
    spp_cur_id: Mapped[Optional[int]] = mapped_column("spp_cur_id", Integer, nullable=True)

    # Validity period
    spp_valid_from: Mapped[Optional[datetime]] = mapped_column("spp_valid_from", DateTime, nullable=True)
    spp_valid_to: Mapped[Optional[datetime]] = mapped_column("spp_valid_to", DateTime, nullable=True)

    # Priority (for selecting among multiple suppliers)
    spp_priority: Mapped[int] = mapped_column("spp_priority", Integer, default=1, nullable=False)

    # Preferred supplier flag
    spp_is_preferred: Mapped[bool] = mapped_column("spp_is_preferred", Boolean, default=False, nullable=False)

    # Status
    spp_is_active: Mapped[bool] = mapped_column("spp_is_active", Boolean, default=True, nullable=False)

    # Notes
    spp_notes: Mapped[Optional[str]] = mapped_column("spp_notes", String(500), nullable=True)

    # Audit fields
    spp_d_creation: Mapped[Optional[datetime]] = mapped_column("spp_d_creation", DateTime, nullable=True)
    spp_d_update: Mapped[Optional[datetime]] = mapped_column("spp_d_update", DateTime, nullable=True)
    spp_created_by: Mapped[Optional[int]] = mapped_column("spp_created_by", Integer, nullable=True)
    spp_updated_by: Mapped[Optional[int]] = mapped_column("spp_updated_by", Integer, nullable=True)

    # Relationships
    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="product_prices")
    product: Mapped["Product"] = relationship("Product", back_populates="supplier_prices")

    def __repr__(self) -> str:
        return f"<SupplierProductPrice(spp_id={self.spp_id}, supplier={self.spp_sup_id}, product={self.spp_prd_id}, cost={self.spp_unit_cost})>"

    # Property aliases
    @property
    def id(self) -> int:
        return self.spp_id

    @property
    def supplier_id(self) -> int:
        return self.spp_sup_id

    @property
    def product_id(self) -> int:
        return self.spp_prd_id

    @property
    def unit_cost(self) -> Decimal:
        return self.spp_unit_cost

    @property
    def is_active(self) -> bool:
        return self.spp_is_active

    @property
    def is_preferred(self) -> bool:
        return self.spp_is_preferred

    def is_valid(self, check_date: datetime = None) -> bool:
        """Check if the price is valid for a given date."""
        if check_date is None:
            check_date = datetime.utcnow()

        if not self.spp_is_active:
            return False

        if self.spp_valid_from and check_date < self.spp_valid_from:
            return False

        if self.spp_valid_to and check_date > self.spp_valid_to:
            return False

        return True

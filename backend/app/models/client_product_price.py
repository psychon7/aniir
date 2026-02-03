"""
Client Product Price SQLAlchemy Model

Maps to TM_CPP_Client_Product_Price table.
Stores special pricing for specific client/product combinations.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, String, Numeric, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.product import Product


class ClientProductPrice(Base):
    """
    Client Product Price model.
    Maps to TM_CPP_Client_Product_Price table.
    """
    __tablename__ = "TM_CPP_Client_Product_Price"

    # Primary key
    cpp_id: Mapped[int] = mapped_column("cpp_id", Integer, primary_key=True, autoincrement=True)

    # Foreign keys
    cpp_cli_id: Mapped[int] = mapped_column("cpp_cli_id", Integer, ForeignKey("TM_CLI_Client.cli_id"), nullable=False)
    cpp_prd_id: Mapped[int] = mapped_column("cpp_prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=False)
    cpp_soc_id: Mapped[Optional[int]] = mapped_column("cpp_soc_id", Integer, nullable=True)

    # Pricing fields
    cpp_unit_price: Mapped[Decimal] = mapped_column("cpp_unit_price", Numeric(18, 4), nullable=False)
    cpp_discount_percent: Mapped[Optional[Decimal]] = mapped_column("cpp_discount_percent", Numeric(5, 2), nullable=True)
    cpp_min_quantity: Mapped[Optional[int]] = mapped_column("cpp_min_quantity", Integer, nullable=True)
    cpp_max_quantity: Mapped[Optional[int]] = mapped_column("cpp_max_quantity", Integer, nullable=True)

    # Currency
    cpp_cur_id: Mapped[Optional[int]] = mapped_column("cpp_cur_id", Integer, nullable=True)

    # Validity period
    cpp_valid_from: Mapped[Optional[datetime]] = mapped_column("cpp_valid_from", DateTime, nullable=True)
    cpp_valid_to: Mapped[Optional[datetime]] = mapped_column("cpp_valid_to", DateTime, nullable=True)

    # Status
    cpp_is_active: Mapped[bool] = mapped_column("cpp_is_active", Boolean, default=True, nullable=False)

    # Notes
    cpp_notes: Mapped[Optional[str]] = mapped_column("cpp_notes", String(500), nullable=True)

    # Audit fields
    cpp_d_creation: Mapped[Optional[datetime]] = mapped_column("cpp_d_creation", DateTime, nullable=True)
    cpp_d_update: Mapped[Optional[datetime]] = mapped_column("cpp_d_update", DateTime, nullable=True)
    cpp_created_by: Mapped[Optional[int]] = mapped_column("cpp_created_by", Integer, nullable=True)
    cpp_updated_by: Mapped[Optional[int]] = mapped_column("cpp_updated_by", Integer, nullable=True)

    # Relationships
    client: Mapped["Client"] = relationship("Client", back_populates="product_prices")
    product: Mapped["Product"] = relationship("Product", back_populates="client_prices")

    def __repr__(self) -> str:
        return f"<ClientProductPrice(cpp_id={self.cpp_id}, client={self.cpp_cli_id}, product={self.cpp_prd_id}, price={self.cpp_unit_price})>"

    # Property aliases
    @property
    def id(self) -> int:
        return self.cpp_id

    @property
    def client_id(self) -> int:
        return self.cpp_cli_id

    @property
    def product_id(self) -> int:
        return self.cpp_prd_id

    @property
    def unit_price(self) -> Decimal:
        return self.cpp_unit_price

    @property
    def discount_percent(self) -> Optional[Decimal]:
        return self.cpp_discount_percent

    @property
    def is_active(self) -> bool:
        return self.cpp_is_active

    def is_valid(self, check_date: datetime = None) -> bool:
        """Check if the price is valid for a given date."""
        if check_date is None:
            check_date = datetime.utcnow()

        if not self.cpp_is_active:
            return False

        if self.cpp_valid_from and check_date < self.cpp_valid_from:
            return False

        if self.cpp_valid_to and check_date > self.cpp_valid_to:
            return False

        return True

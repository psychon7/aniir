"""
ShippingReceiving model.
Maps to actual TM_SRV_Shipping_Receiving table.

Actual DB schema:
  srv_id: int NOT NULL [PK]
  srv_is_rev: bit NOT NULL (is receiving/inbound)
  srv_time: datetime NOT NULL
  srv_code: nvarchar(100) NOT NULL
  srv_description: nvarchar(1000) NULL
  usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
  srv_total_quantity: decimal NULL
  srv_total_real: decimal NULL
  srv_is_lend: bit NOT NULL
  srv_d_lend_return_pre: datetime NULL
  srv_is_return_client: bit NULL
  srv_d_return_client: datetime NULL
  srv_is_destroy: bit NULL
  srv_d_destroy: datetime NULL
  srv_is_return_supplier: bit NULL
  srv_d_return_supplier: datetime NULL
  srv_is_damaged: bit NULL
  srv_d_damaged: datetime NULL
  srv_client: nvarchar(200) NULL
  srv_valid: bit NOT NULL
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class ShippingReceiving(Base):
    """
    ShippingReceiving model.
    Maps to actual TM_SRV_Shipping_Receiving table.

    Represents a shipping or receiving record.
    srv_is_rev = True means receiving (inbound), False means shipping (outbound).
    """
    __tablename__ = "TM_SRV_Shipping_Receiving"

    # Primary Key
    srv_id: Mapped[int] = mapped_column("srv_id", Integer, primary_key=True, autoincrement=True)

    # Receiving flag (True = receiving/inbound, False = shipping/outbound)
    srv_is_rev: Mapped[bool] = mapped_column("srv_is_rev", Boolean, nullable=False, default=False)

    # Time and code
    srv_time: Mapped[datetime] = mapped_column("srv_time", DateTime, nullable=False)
    srv_code: Mapped[str] = mapped_column("srv_code", String(100), nullable=False)
    srv_description: Mapped[Optional[str]] = mapped_column("srv_description", String(1000), nullable=True)

    # Creator
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # Totals
    srv_total_quantity: Mapped[Optional[Decimal]] = mapped_column("srv_total_quantity", Numeric(18, 4), nullable=True)
    srv_total_real: Mapped[Optional[Decimal]] = mapped_column("srv_total_real", Numeric(18, 4), nullable=True)

    # Lending info
    srv_is_lend: Mapped[bool] = mapped_column("srv_is_lend", Boolean, nullable=False, default=False)
    srv_d_lend_return_pre: Mapped[Optional[datetime]] = mapped_column("srv_d_lend_return_pre", DateTime, nullable=True)

    # Return to client
    srv_is_return_client: Mapped[Optional[bool]] = mapped_column("srv_is_return_client", Boolean, nullable=True)
    srv_d_return_client: Mapped[Optional[datetime]] = mapped_column("srv_d_return_client", DateTime, nullable=True)

    # Destroy flag
    srv_is_destroy: Mapped[Optional[bool]] = mapped_column("srv_is_destroy", Boolean, nullable=True)
    srv_d_destroy: Mapped[Optional[datetime]] = mapped_column("srv_d_destroy", DateTime, nullable=True)

    # Return to supplier
    srv_is_return_supplier: Mapped[Optional[bool]] = mapped_column("srv_is_return_supplier", Boolean, nullable=True)
    srv_d_return_supplier: Mapped[Optional[datetime]] = mapped_column("srv_d_return_supplier", DateTime, nullable=True)

    # Damaged flag
    srv_is_damaged: Mapped[Optional[bool]] = mapped_column("srv_is_damaged", Boolean, nullable=True)
    srv_d_damaged: Mapped[Optional[datetime]] = mapped_column("srv_d_damaged", DateTime, nullable=True)

    # Client name (denormalized)
    srv_client: Mapped[Optional[str]] = mapped_column("srv_client", String(200), nullable=True)

    # Valid flag
    srv_valid: Mapped[bool] = mapped_column("srv_valid", Boolean, nullable=False, default=True)

    # Relationships
    creator: Mapped["User"] = relationship("User", backref="shipping_receiving_records", foreign_keys=[usr_creator_id])
    lines: Mapped[List["ShippingReceivingLine"]] = relationship("ShippingReceivingLine", back_populates="shipping_receiving", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ShippingReceiving(srv_id={self.srv_id}, code='{self.srv_code}', is_receiving={self.srv_is_rev})>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.srv_id

    @property
    def code(self) -> str:
        return self.srv_code

    @property
    def is_receiving(self) -> bool:
        return self.srv_is_rev

    @property
    def is_shipping(self) -> bool:
        return not self.srv_is_rev

    @property
    def total_quantity(self) -> Optional[Decimal]:
        return self.srv_total_quantity

    @property
    def is_valid(self) -> bool:
        return self.srv_valid


class ShippingReceivingLine(Base):
    """
    ShippingReceivingLine model.
    Maps to actual TM_SRL_Shipping_Receiving_Line table.

    Actual DB schema:
      srl_id: int NOT NULL [PK]
      srv_id: int NOT NULL -> TM_SRV_Shipping_Receiving.srv_id
      lgl_id: int NULL -> TM_LGL_Logistic_Lines.lgl_id
      dfl_id: int NULL -> TM_DFL_DevlieryForm_Line.dfl_id
      srl_quantity: decimal NULL
      srl_unit_price: decimal NULL
      srl_total_price: decimal NULL
      prd_id: int NULL -> TM_PRD_Product.prd_id
      pit_id: int NULL -> TM_PIT_Product_Instance.pit_id
      srl_prd_ref: nvarchar(200) NULL
      srl_prd_name: nvarchar(200) NULL
      srl_prd_des: nvarchar(1000) NULL
      srl_description: nvarchar(1000) NULL
      srl_quantity_real: decimal NULL
      srl_total_price_real: decimal NULL
      whs_id: int NOT NULL -> TM_WHS_WareHouse.whs_id
      she_id: int NOT NULL -> TM_SHE_Shelves.she_id
    """
    __tablename__ = "TM_SRL_Shipping_Receiving_Line"

    # Primary Key
    srl_id: Mapped[int] = mapped_column("srl_id", Integer, primary_key=True, autoincrement=True)

    # FK to ShippingReceiving
    srv_id: Mapped[int] = mapped_column("srv_id", Integer, ForeignKey("TM_SRV_Shipping_Receiving.srv_id"), nullable=False)

    # FK to Logistic Lines (optional)
    lgl_id: Mapped[Optional[int]] = mapped_column("lgl_id", Integer, ForeignKey("TM_LGL_Logistic_Lines.lgl_id"), nullable=True)

    # FK to Delivery Form Line (optional)
    dfl_id: Mapped[Optional[int]] = mapped_column("dfl_id", Integer, ForeignKey("TM_DFL_DevlieryForm_Line.dfl_id"), nullable=True)

    # Quantity and pricing
    srl_quantity: Mapped[Optional[Decimal]] = mapped_column("srl_quantity", Numeric(18, 4), nullable=True)
    srl_unit_price: Mapped[Optional[Decimal]] = mapped_column("srl_unit_price", Numeric(18, 4), nullable=True)
    srl_total_price: Mapped[Optional[Decimal]] = mapped_column("srl_total_price", Numeric(18, 4), nullable=True)

    # Product references (optional)
    prd_id: Mapped[Optional[int]] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=True)
    pit_id: Mapped[Optional[int]] = mapped_column("pit_id", Integer, ForeignKey("TM_PIT_Product_Instance.pit_id"), nullable=True)

    # Product info (denormalized)
    srl_prd_ref: Mapped[Optional[str]] = mapped_column("srl_prd_ref", String(200), nullable=True)
    srl_prd_name: Mapped[Optional[str]] = mapped_column("srl_prd_name", String(200), nullable=True)
    srl_prd_des: Mapped[Optional[str]] = mapped_column("srl_prd_des", String(1000), nullable=True)
    srl_description: Mapped[Optional[str]] = mapped_column("srl_description", String(1000), nullable=True)

    # Real quantities/prices
    srl_quantity_real: Mapped[Optional[Decimal]] = mapped_column("srl_quantity_real", Numeric(18, 4), nullable=True)
    srl_total_price_real: Mapped[Optional[Decimal]] = mapped_column("srl_total_price_real", Numeric(18, 4), nullable=True)

    # Warehouse and shelf (required)
    whs_id: Mapped[int] = mapped_column("whs_id", Integer, ForeignKey("TM_WHS_WareHouse.whs_id"), nullable=False)
    she_id: Mapped[int] = mapped_column("she_id", Integer, ForeignKey("TM_SHE_Shelves.she_id"), nullable=False)

    # Relationships
    shipping_receiving: Mapped["ShippingReceiving"] = relationship("ShippingReceiving", back_populates="lines")

    def __repr__(self) -> str:
        return f"<ShippingReceivingLine(srl_id={self.srl_id}, srv_id={self.srv_id}, prd_ref='{self.srl_prd_ref}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.srl_id

    @property
    def quantity(self) -> Optional[Decimal]:
        return self.srl_quantity

    @property
    def unit_price(self) -> Optional[Decimal]:
        return self.srl_unit_price

    @property
    def total_price(self) -> Optional[Decimal]:
        return self.srl_total_price

    @property
    def product_ref(self) -> Optional[str]:
        return self.srl_prd_ref

    @property
    def product_name(self) -> Optional[str]:
        return self.srl_prd_name
"""
SQLAlchemy models for Supplier Orders.

This module contains:
- SupplierOrder: Supplier Order model (TM_SOD_Supplier_Order)
- SupplierOrderLine: Supplier Order line items (TM_SOL_SupplierOrder_Lines)

Actual DB tables:
- TM_SOD_Supplier_Order: Supplier orders (purchase orders)
- TM_SOL_SupplierOrder_Lines: Order line items
"""
from decimal import Decimal
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import (
    Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from datetime import datetime
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier
    from app.models.product import Product
    from app.models.vat_rate import VatRate


# =============================================================================
# SupplierOrder Model (TM_SOD_Supplier_Order)
# =============================================================================


class SupplierOrder(Base):
    """
    Supplier Order model (Purchase Order).
    Maps to TM_SOD_Supplier_Order table.

    Actual DB schema:
      sod_id: int NOT NULL [PK]
      sod_code: nvarchar(50) NULL
      sod_name: nvarchar(1000) NULL
      sup_id: int NOT NULL -> TM_SUP_Supplier.sup_id
      sco_id: int NULL -> TM_SCO_Supplier_Contact.sco_id
      soc_id: int NOT NULL -> TR_SOC_Society.soc_id
      usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
      pin_id: int NULL -> TM_PIN_Purchase_Intent.pin_id
      cur_id: int NOT NULL -> TR_CUR_Currency.cur_id
      vat_id: int NOT NULL -> TR_VAT_Vat.vat_id
      sod_inter_comment: nvarchar(4000) NULL
      sod_supplier_comment: nvarchar(4000) NULL
      sod_d_creation: datetime NOT NULL
      sod_d_update: datetime NOT NULL
      sod_file: nvarchar(2000) NULL
      sod_discount_amount: decimal(16,4) NULL
      sod_need2pay: decimal NULL
      sod_paid: decimal NULL
      sod_total_ht: decimal NULL
      sod_total_ttc: decimal NULL
      sod_started: bit NULL
      sod_canceled: bit NULL
      sod_d_exp_delivery: datetime NULL
    """
    __tablename__ = "TM_SOD_Supplier_Order"

    # Primary Key
    sod_id: Mapped[int] = mapped_column("sod_id", Integer, primary_key=True, autoincrement=True)

    # Reference code and name
    sod_code: Mapped[Optional[str]] = mapped_column("sod_code", String(50), nullable=True)
    sod_name: Mapped[Optional[str]] = mapped_column("sod_name", String(1000), nullable=True)

    # Supplier relationship
    sup_id: Mapped[int] = mapped_column("sup_id", Integer, ForeignKey("TM_SUP_Supplier.sup_id"), nullable=False)

    # Supplier contact (optional)
    sco_id: Mapped[Optional[int]] = mapped_column("sco_id", Integer, ForeignKey("TM_SCO_Supplier_Contact.sco_id"), nullable=True)

    # Society
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)

    # Creator
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # Purchase intent (optional link)
    pin_id: Mapped[Optional[int]] = mapped_column("pin_id", Integer, ForeignKey("TM_PIN_Purchase_Intent.pin_id"), nullable=True)

    # Currency and VAT
    cur_id: Mapped[int] = mapped_column("cur_id", Integer, ForeignKey("TR_CUR_Currency.cur_id"), nullable=False)
    vat_id: Mapped[int] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)

    # Comments
    sod_inter_comment: Mapped[Optional[str]] = mapped_column("sod_inter_comment", String(4000), nullable=True)
    sod_supplier_comment: Mapped[Optional[str]] = mapped_column("sod_supplier_comment", String(4000), nullable=True)

    # Dates
    sod_d_creation: Mapped[datetime] = mapped_column("sod_d_creation", DateTime, nullable=False)
    sod_d_update: Mapped[datetime] = mapped_column("sod_d_update", DateTime, nullable=False)
    sod_d_exp_delivery: Mapped[Optional[datetime]] = mapped_column("sod_d_exp_delivery", DateTime, nullable=True)

    # File attachment
    sod_file: Mapped[Optional[str]] = mapped_column("sod_file", String(2000), nullable=True)

    # Amounts
    sod_discount_amount: Mapped[Optional[Decimal]] = mapped_column("sod_discount_amount", Numeric(16, 4), nullable=True)
    sod_need2pay: Mapped[Optional[Decimal]] = mapped_column("sod_need2pay", Numeric(18, 4), nullable=True)
    sod_paid: Mapped[Optional[Decimal]] = mapped_column("sod_paid", Numeric(18, 4), nullable=True)
    sod_total_ht: Mapped[Optional[Decimal]] = mapped_column("sod_total_ht", Numeric(18, 4), nullable=True)
    sod_total_ttc: Mapped[Optional[Decimal]] = mapped_column("sod_total_ttc", Numeric(18, 4), nullable=True)

    # Status flags
    sod_started: Mapped[Optional[bool]] = mapped_column("sod_started", Boolean, nullable=True, default=False)
    sod_canceled: Mapped[Optional[bool]] = mapped_column("sod_canceled", Boolean, nullable=True, default=False)

    # Relationships
    lines: Mapped[List["SupplierOrderLine"]] = relationship(
        "SupplierOrderLine",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    supplier: Mapped["Supplier"] = relationship(
        "Supplier",
        foreign_keys=[sup_id],
        lazy="joined"
    )

    def __repr__(self) -> str:
        return f"<SupplierOrder(sod_id={self.sod_id}, code='{self.sod_code}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.sod_id

    @property
    def code(self) -> Optional[str]:
        return self.sod_code

    @property
    def reference(self) -> Optional[str]:
        return self.sod_code

    @property
    def name(self) -> Optional[str]:
        return self.sod_name

    @property
    def is_canceled(self) -> bool:
        return self.sod_canceled or False

    @property
    def is_started(self) -> bool:
        return self.sod_started or False

    @property
    def total_ht(self) -> Decimal:
        return self.sod_total_ht or Decimal("0")

    @property
    def total_ttc(self) -> Decimal:
        return self.sod_total_ttc or Decimal("0")


# =============================================================================
# SupplierOrderLine Model (TM_SOL_SupplierOrder_Lines)
# =============================================================================


class SupplierOrderLine(Base):
    """
    Supplier Order Line model.
    Maps to TM_SOL_SupplierOrder_Lines table.

    Actual DB schema:
      sol_id: int NOT NULL [PK]
      sod_id: int NOT NULL -> TM_SOD_Supplier_Order.sod_id
      prd_id: int NULL -> TM_PRD_Product.prd_id
      pit_id: int NULL -> TM_PIT_Product_Instance.pit_id
      pil_id: int NULL -> TM_PIL_PurchaseIntent_Lines.pil_id
      sol_order: int NULL
      sol_quantity: int NULL
      sol_description: nvarchar(4000) NULL
      sol_unit_price: decimal(16,4) NULL
      sol_discount_amount: decimal(16,4) NULL
      sol_total_price: decimal(16,4) NULL
      sol_price_with_dis: decimal(16,4) NULL
      sol_total_crude_price: decimal(16,4) NULL
      vat_id: int NULL -> TR_VAT_Vat.vat_id
    """
    __tablename__ = "TM_SOL_SupplierOrder_Lines"

    # Primary Key
    sol_id: Mapped[int] = mapped_column("sol_id", Integer, primary_key=True, autoincrement=True)

    # Foreign key to SupplierOrder
    sod_id: Mapped[int] = mapped_column("sod_id", Integer, ForeignKey("TM_SOD_Supplier_Order.sod_id"), nullable=False)

    # Product references
    prd_id: Mapped[Optional[int]] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=True)
    pit_id: Mapped[Optional[int]] = mapped_column("pit_id", Integer, ForeignKey("TM_PIT_Product_Instance.pit_id"), nullable=True)

    # Link to purchase intent line (optional)
    pil_id: Mapped[Optional[int]] = mapped_column("pil_id", Integer, ForeignKey("TM_PIL_PurchaseIntent_Lines.pil_id"), nullable=True)

    # Line sequence/order
    sol_order: Mapped[Optional[int]] = mapped_column("sol_order", Integer, nullable=True)

    # Quantity
    sol_quantity: Mapped[Optional[int]] = mapped_column("sol_quantity", Integer, nullable=True)

    # Description
    sol_description: Mapped[Optional[str]] = mapped_column("sol_description", String(4000), nullable=True)

    # Pricing
    sol_unit_price: Mapped[Optional[Decimal]] = mapped_column("sol_unit_price", Numeric(16, 4), nullable=True)
    sol_discount_amount: Mapped[Optional[Decimal]] = mapped_column("sol_discount_amount", Numeric(16, 4), nullable=True)
    sol_total_price: Mapped[Optional[Decimal]] = mapped_column("sol_total_price", Numeric(16, 4), nullable=True)
    sol_price_with_dis: Mapped[Optional[Decimal]] = mapped_column("sol_price_with_dis", Numeric(16, 4), nullable=True)
    sol_total_crude_price: Mapped[Optional[Decimal]] = mapped_column("sol_total_crude_price", Numeric(16, 4), nullable=True)

    # VAT
    vat_id: Mapped[Optional[int]] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=True)

    # Relationship to order
    order: Mapped["SupplierOrder"] = relationship("SupplierOrder", back_populates="lines")

    def __repr__(self) -> str:
        desc = self.sol_description[:30] if self.sol_description else 'N/A'
        return f"<SupplierOrderLine(sol_id={self.sol_id}, description='{desc}...')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.sol_id

    @property
    def description(self) -> Optional[str]:
        return self.sol_description

    @property
    def quantity(self) -> Optional[int]:
        return self.sol_quantity

    @property
    def unit_price(self) -> Optional[Decimal]:
        return self.sol_unit_price

    @property
    def total_price(self) -> Optional[Decimal]:
        return self.sol_total_price

    @property
    def line_order(self) -> Optional[int]:
        return self.sol_order

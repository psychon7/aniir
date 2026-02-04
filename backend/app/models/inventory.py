"""
Inventory models mapped to legacy warehouse tables.

Tables:
  TM_INV_Inventory
  TI_INVR_INV_Record
  TI_PIV_PRE_INV_Inventory
  TR_PSH_Product_Shelves
  TM_SHE_Shelves
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.product import Product, ProductInstance
    from app.models.warehouse import Warehouse


class Inventory(Base):
    """Inventory record for a product/product instance."""

    __tablename__ = "TM_INV_Inventory"

    inv_id: Mapped[int] = mapped_column("inv_id", Integer, primary_key=True, autoincrement=True)
    prd_id: Mapped[Optional[int]] = mapped_column(
        "prd_id",
        Integer,
        ForeignKey("TM_PRD_Product.prd_id"),
        nullable=True,
    )
    pit_id: Mapped[Optional[int]] = mapped_column(
        "pit_id",
        Integer,
        ForeignKey("TM_PIT_Product_Instance.pit_id"),
        nullable=True,
    )
    prd_name: Mapped[Optional[str]] = mapped_column("prd_name", String(200), nullable=True)
    prd_ref: Mapped[Optional[str]] = mapped_column("prd_ref", String(200), nullable=True)
    prd_description: Mapped[Optional[str]] = mapped_column("prd_description", String(1000), nullable=True)
    inv_quantity: Mapped[Optional[Decimal]] = mapped_column("inv_quantity", Numeric(18, 4), nullable=True)
    inv_d_update: Mapped[datetime] = mapped_column("inv_d_update", DateTime, nullable=False)
    inv_description: Mapped[Optional[str]] = mapped_column("inv_description", String(2000), nullable=True)

    product: Mapped[Optional["Product"]] = relationship("Product", lazy="joined")
    product_instance: Mapped[Optional["ProductInstance"]] = relationship("ProductInstance", lazy="joined")
    records: Mapped[List["InventoryRecord"]] = relationship(
        "InventoryRecord",
        back_populates="inventory",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    pre_inventory: Mapped[List["PreInventory"]] = relationship(
        "PreInventory",
        back_populates="inventory",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    product_shelves: Mapped[List["ProductShelves"]] = relationship(
        "ProductShelves",
        back_populates="inventory",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Inventory(inv_id={self.inv_id}, qty={self.inv_quantity})>"


class InventoryRecord(Base):
    """Inventory record history."""

    __tablename__ = "TI_INVR_INV_Record"

    invr_id: Mapped[int] = mapped_column("invr_id", Integer, primary_key=True, autoincrement=True)
    inv_id: Mapped[int] = mapped_column(
        "inv_id",
        Integer,
        ForeignKey("TM_INV_Inventory.inv_id"),
        nullable=False,
    )
    invr_d_record: Mapped[datetime] = mapped_column("invr_d_record", DateTime, nullable=False)
    invr_quantity: Mapped[Optional[Decimal]] = mapped_column("invr_quantity", Numeric(18, 4), nullable=True)

    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="records")

    def __repr__(self) -> str:
        return f"<InventoryRecord(invr_id={self.invr_id}, inv_id={self.inv_id})>"


class PreInventory(Base):
    """Pre-inventory reservation table."""

    __tablename__ = "TI_PIV_PRE_INV_Inventory"

    piv_id: Mapped[int] = mapped_column("piv_id", Integer, primary_key=True, autoincrement=True)
    inv_id: Mapped[int] = mapped_column(
        "inv_id",
        Integer,
        ForeignKey("TM_INV_Inventory.inv_id"),
        nullable=False,
    )
    piv_quantity: Mapped[Optional[Decimal]] = mapped_column("piv_quantity", Numeric(18, 4), nullable=True)
    piv_d_update: Mapped[datetime] = mapped_column("piv_d_update", DateTime, nullable=False)

    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="pre_inventory")

    def __repr__(self) -> str:
        return f"<PreInventory(piv_id={self.piv_id}, inv_id={self.inv_id})>"


class ProductShelves(Base):
    """Join between inventory and warehouse/shelf locations."""

    __tablename__ = "TR_PSH_Product_Shelves"

    psh_id: Mapped[int] = mapped_column("psh_id", Integer, primary_key=True, autoincrement=True)
    inv_id: Mapped[int] = mapped_column(
        "inv_id",
        Integer,
        ForeignKey("TM_INV_Inventory.inv_id"),
        nullable=False,
    )
    whs_id: Mapped[int] = mapped_column(
        "whs_id",
        Integer,
        ForeignKey("TM_WHS_WareHouse.whs_id"),
        nullable=False,
    )
    she_id: Mapped[int] = mapped_column(
        "she_id",
        Integer,
        ForeignKey("TM_SHE_Shelves.she_id"),
        nullable=False,
    )

    inventory: Mapped["Inventory"] = relationship("Inventory", back_populates="product_shelves")
    warehouse: Mapped[Optional["Warehouse"]] = relationship("Warehouse", lazy="joined")
    shelf: Mapped[Optional["Shelf"]] = relationship("Shelf", lazy="joined")

    def __repr__(self) -> str:
        return f"<ProductShelves(psh_id={self.psh_id}, inv_id={self.inv_id})>"


class Shelf(Base):
    """Shelf location inside a warehouse."""

    __tablename__ = "TM_SHE_Shelves"

    she_id: Mapped[int] = mapped_column("she_id", Integer, primary_key=True, autoincrement=True)
    whs_id: Mapped[int] = mapped_column(
        "whs_id",
        Integer,
        ForeignKey("TM_WHS_WareHouse.whs_id"),
        nullable=False,
    )
    she_code: Mapped[Optional[str]] = mapped_column("she_code", String(200), nullable=True)
    she_floor: Mapped[Optional[int]] = mapped_column("she_floor", Integer, nullable=True)
    she_line: Mapped[Optional[int]] = mapped_column("she_line", Integer, nullable=True)
    she_row: Mapped[Optional[int]] = mapped_column("she_row", Integer, nullable=True)
    she_length: Mapped[Optional[Decimal]] = mapped_column("she_length", Numeric(18, 4), nullable=True)
    she_width: Mapped[Optional[Decimal]] = mapped_column("she_width", Numeric(18, 4), nullable=True)
    she_height: Mapped[Optional[Decimal]] = mapped_column("she_height", Numeric(18, 4), nullable=True)
    she_availabel_volume: Mapped[Optional[Decimal]] = mapped_column("she_availabel_volume", Numeric(18, 4), nullable=True)

    warehouse: Mapped[Optional["Warehouse"]] = relationship("Warehouse", lazy="joined")

    def __repr__(self) -> str:
        return f"<Shelf(she_id={self.she_id}, whs_id={self.whs_id})>"

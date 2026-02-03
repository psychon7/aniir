"""
SQLAlchemy models for Supplier Invoices.

This module contains:
- SupplierInvoice: Supplier Invoice model (TM_SIN_Supplier_Invoice)
- SupplierInvoiceLine: Supplier Invoice line items (TM_SIL_SupplierInvoice_Lines)

Actual DB tables:
- TM_SIN_Supplier_Invoice: Supplier invoices (purchase invoices)
- TM_SIL_SupplierInvoice_Lines: Invoice line items
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
    from app.models.supplier_order import SupplierOrder
    from app.models.product import Product
    from app.models.vat_rate import VatRate


# =============================================================================
# SupplierInvoice Model (TM_SIN_Supplier_Invoice)
# =============================================================================


class SupplierInvoice(Base):
    """
    Supplier Invoice model (Purchase Invoice).
    Maps to TM_SIN_Supplier_Invoice table.

    Actual DB schema:
      sin_id: int NOT NULL [PK]
      sin_code: nvarchar(50) NULL
      sin_name: nvarchar(1000) NULL
      sup_id: int NOT NULL -> TM_SUP_Supplier.sup_id
      sco_id: int NULL -> TM_SCO_Supplier_Contact.sco_id
      soc_id: int NOT NULL -> TR_SOC_Society.soc_id
      usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
      sod_id: int NULL -> TM_SOD_Supplier_Order.sod_id
      cur_id: int NOT NULL -> TR_CUR_Currency.cur_id
      vat_id: int NOT NULL -> TR_VAT_Vat.vat_id
      bac_id: int NULL -> TR_BAC_Bank_Account.bac_id
      sin_inter_comment: nvarchar(4000) NULL
      sin_supplier_comment: nvarchar(4000) NULL
      sin_d_creation: datetime NOT NULL
      sin_d_update: datetime NOT NULL
      sin_file: nvarchar(2000) NULL
      sin_discount_amount: decimal(16,4) NULL
      sin_is_paid: bit NULL
      sin_bank_receipt_file: nvarchar(2000) NULL
      sin_bank_receipt_number: nvarchar(100) NULL
      sin_start_production: bit NULL
      sin_d_start_production: datetime NULL
      sin_d_complete_production_pre: datetime NULL
      sin_d_complete_production: datetime NULL
      sin_complete_production: bit NULL
      sin_all_product_stored: bit NULL
    """
    __tablename__ = "TM_SIN_Supplier_Invoice"

    # Primary Key
    sin_id: Mapped[int] = mapped_column("sin_id", Integer, primary_key=True, autoincrement=True)

    # Reference code and name
    sin_code: Mapped[Optional[str]] = mapped_column("sin_code", String(50), nullable=True)
    sin_name: Mapped[Optional[str]] = mapped_column("sin_name", String(1000), nullable=True)

    # Supplier relationship
    sup_id: Mapped[int] = mapped_column("sup_id", Integer, ForeignKey("TM_SUP_Supplier.sup_id"), nullable=False)

    # Supplier contact (optional)
    sco_id: Mapped[Optional[int]] = mapped_column("sco_id", Integer, ForeignKey("TM_SCO_Supplier_Contact.sco_id"), nullable=True)

    # Society
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)

    # Creator
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # Supplier order (optional link)
    sod_id: Mapped[Optional[int]] = mapped_column("sod_id", Integer, ForeignKey("TM_SOD_Supplier_Order.sod_id"), nullable=True)

    # Currency and VAT
    cur_id: Mapped[int] = mapped_column("cur_id", Integer, ForeignKey("TR_CUR_Currency.cur_id"), nullable=False)
    vat_id: Mapped[int] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)

    # Bank account (optional)
    bac_id: Mapped[Optional[int]] = mapped_column("bac_id", Integer, ForeignKey("TR_BAC_Bank_Account.bac_id"), nullable=True)

    # Comments
    sin_inter_comment: Mapped[Optional[str]] = mapped_column("sin_inter_comment", String(4000), nullable=True)
    sin_supplier_comment: Mapped[Optional[str]] = mapped_column("sin_supplier_comment", String(4000), nullable=True)

    # Dates
    sin_d_creation: Mapped[datetime] = mapped_column("sin_d_creation", DateTime, nullable=False)
    sin_d_update: Mapped[datetime] = mapped_column("sin_d_update", DateTime, nullable=False)

    # File attachment
    sin_file: Mapped[Optional[str]] = mapped_column("sin_file", String(2000), nullable=True)

    # Amounts
    sin_discount_amount: Mapped[Optional[Decimal]] = mapped_column("sin_discount_amount", Numeric(16, 4), nullable=True)

    # Payment status
    sin_is_paid: Mapped[Optional[bool]] = mapped_column("sin_is_paid", Boolean, nullable=True, default=False)

    # Bank receipt info
    sin_bank_receipt_file: Mapped[Optional[str]] = mapped_column("sin_bank_receipt_file", String(2000), nullable=True)
    sin_bank_receipt_number: Mapped[Optional[str]] = mapped_column("sin_bank_receipt_number", String(100), nullable=True)

    # Production tracking
    sin_start_production: Mapped[Optional[bool]] = mapped_column("sin_start_production", Boolean, nullable=True, default=False)
    sin_d_start_production: Mapped[Optional[datetime]] = mapped_column("sin_d_start_production", DateTime, nullable=True)
    sin_d_complete_production_pre: Mapped[Optional[datetime]] = mapped_column("sin_d_complete_production_pre", DateTime, nullable=True)
    sin_d_complete_production: Mapped[Optional[datetime]] = mapped_column("sin_d_complete_production", DateTime, nullable=True)
    sin_complete_production: Mapped[Optional[bool]] = mapped_column("sin_complete_production", Boolean, nullable=True, default=False)
    sin_all_product_stored: Mapped[Optional[bool]] = mapped_column("sin_all_product_stored", Boolean, nullable=True, default=False)

    # Relationships
    lines: Mapped[List["SupplierInvoiceLine"]] = relationship(
        "SupplierInvoiceLine",
        back_populates="invoice",
        cascade="all, delete-orphan"
    )

    supplier: Mapped["Supplier"] = relationship(
        "Supplier",
        foreign_keys=[sup_id],
        lazy="joined"
    )

    order: Mapped[Optional["SupplierOrder"]] = relationship(
        "SupplierOrder",
        foreign_keys=[sod_id],
        lazy="joined"
    )

    def __repr__(self) -> str:
        return f"<SupplierInvoice(sin_id={self.sin_id}, code='{self.sin_code}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.sin_id

    @property
    def code(self) -> Optional[str]:
        return self.sin_code

    @property
    def reference(self) -> Optional[str]:
        return self.sin_code

    @property
    def name(self) -> Optional[str]:
        return self.sin_name

    @property
    def is_paid(self) -> bool:
        return self.sin_is_paid or False

    @property
    def production_started(self) -> bool:
        return self.sin_start_production or False

    @property
    def production_complete(self) -> bool:
        return self.sin_complete_production or False

    @property
    def all_stored(self) -> bool:
        return self.sin_all_product_stored or False


# =============================================================================
# SupplierInvoiceLine Model (TM_SIL_SupplierInvoice_Lines)
# =============================================================================


class SupplierInvoiceLine(Base):
    """
    Supplier Invoice Line model.
    Maps to TM_SIL_SupplierInvoice_Lines table.

    Actual DB schema:
      sil_id: int NOT NULL [PK]
      sin_id: int NOT NULL -> TM_SIN_Supplier_Invoice.sin_id
      prd_id: int NULL -> TM_PRD_Product.prd_id
      pit_id: int NULL -> TM_PIT_Product_Instance.pit_id
      sol_id: int NULL -> TM_SOL_SupplierOrder_Lines.sol_id
      sil_order: int NULL
      sil_quantity: int NULL
      sil_description: nvarchar(4000) NULL
      sil_unit_price: decimal(16,4) NULL
      sil_discount_amount: decimal(16,4) NULL
      sil_total_price: decimal(16,4) NULL
      sil_price_with_dis: decimal(16,4) NULL
      sil_total_crude_price: decimal(16,4) NULL
      vat_id: int NULL -> TR_VAT_Vat.vat_id
    """
    __tablename__ = "TM_SIL_SupplierInvoice_Lines"

    # Primary Key
    sil_id: Mapped[int] = mapped_column("sil_id", Integer, primary_key=True, autoincrement=True)

    # Foreign key to SupplierInvoice
    sin_id: Mapped[int] = mapped_column("sin_id", Integer, ForeignKey("TM_SIN_Supplier_Invoice.sin_id"), nullable=False)

    # Product references
    prd_id: Mapped[Optional[int]] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=True)
    pit_id: Mapped[Optional[int]] = mapped_column("pit_id", Integer, ForeignKey("TM_PIT_Product_Instance.pit_id"), nullable=True)

    # Link to supplier order line (optional)
    sol_id: Mapped[Optional[int]] = mapped_column("sol_id", Integer, ForeignKey("TM_SOL_SupplierOrder_Lines.sol_id"), nullable=True)

    # Line sequence/order
    sil_order: Mapped[Optional[int]] = mapped_column("sil_order", Integer, nullable=True)

    # Quantity
    sil_quantity: Mapped[Optional[int]] = mapped_column("sil_quantity", Integer, nullable=True)

    # Description
    sil_description: Mapped[Optional[str]] = mapped_column("sil_description", String(4000), nullable=True)

    # Pricing
    sil_unit_price: Mapped[Optional[Decimal]] = mapped_column("sil_unit_price", Numeric(16, 4), nullable=True)
    sil_discount_amount: Mapped[Optional[Decimal]] = mapped_column("sil_discount_amount", Numeric(16, 4), nullable=True)
    sil_total_price: Mapped[Optional[Decimal]] = mapped_column("sil_total_price", Numeric(16, 4), nullable=True)
    sil_price_with_dis: Mapped[Optional[Decimal]] = mapped_column("sil_price_with_dis", Numeric(16, 4), nullable=True)
    sil_total_crude_price: Mapped[Optional[Decimal]] = mapped_column("sil_total_crude_price", Numeric(16, 4), nullable=True)

    # VAT
    vat_id: Mapped[Optional[int]] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=True)

    # Relationship to invoice
    invoice: Mapped["SupplierInvoice"] = relationship("SupplierInvoice", back_populates="lines")

    def __repr__(self) -> str:
        desc = self.sil_description[:30] if self.sil_description else 'N/A'
        return f"<SupplierInvoiceLine(sil_id={self.sil_id}, description='{desc}...')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.sil_id

    @property
    def description(self) -> Optional[str]:
        return self.sil_description

    @property
    def quantity(self) -> Optional[int]:
        return self.sil_quantity

    @property
    def unit_price(self) -> Optional[Decimal]:
        return self.sil_unit_price

    @property
    def total_price(self) -> Optional[Decimal]:
        return self.sil_total_price

    @property
    def line_order(self) -> Optional[int]:
        return self.sil_order

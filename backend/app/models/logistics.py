"""
Logistics models.
Maps to legacy logistics tables:
  TM_LGS_Logistic
  TM_LGL_Logistic_Lines
  TR_LSI_Logistic_SupplierInvoice
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.supplier import Supplier
    from app.models.user import User
    from app.models.consignee import Consignee
    from app.models.supplier_order import SupplierOrder, SupplierOrderLine
    from app.models.supplier_invoice import SupplierInvoice, SupplierInvoiceLine
    from app.models.client_invoice_line import ClientInvoiceLine
    from app.models.product import Product, ProductInstance


class Logistic(Base):
    """Logistics container/shipment record."""

    __tablename__ = "TM_LGS_Logistic"

    lgs_id: Mapped[int] = mapped_column("lgs_id", Integer, primary_key=True, autoincrement=True)
    lgs_code: Mapped[str] = mapped_column("lgs_code", String(100), nullable=False)
    lgs_name: Mapped[Optional[str]] = mapped_column("lgs_name", String(200), nullable=True)
    lgs_is_send: Mapped[bool] = mapped_column("lgs_is_send", Boolean, nullable=False, default=False)
    sup_id: Mapped[Optional[int]] = mapped_column(
        "sup_id",
        Integer,
        ForeignKey("TM_SUP_Supplier.sup_id"),
        nullable=True,
    )
    lgs_d_send: Mapped[Optional[datetime]] = mapped_column("lgs_d_send", DateTime, nullable=True)
    lgs_d_arrive_pre: Mapped[Optional[datetime]] = mapped_column("lgs_d_arrive_pre", DateTime, nullable=True)
    lgs_d_arrive: Mapped[Optional[datetime]] = mapped_column("lgs_d_arrive", DateTime, nullable=True)
    lgs_comment: Mapped[Optional[str]] = mapped_column("lgs_comment", String(4000), nullable=True)
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    lgs_file: Mapped[Optional[str]] = mapped_column("lgs_file", String(2000), nullable=True)
    lgs_guid: Mapped[Optional[str]] = mapped_column("lgs_guid", String(200), nullable=True)
    lgs_is_purchase: Mapped[bool] = mapped_column("lgs_is_purchase", Boolean, nullable=False, default=False)
    lgs_tracking_number: Mapped[Optional[str]] = mapped_column("lgs_tracking_number", String(200), nullable=True)
    usr_id_creator: Mapped[int] = mapped_column(
        "usr_id_creator",
        Integer,
        ForeignKey("TM_USR_User.usr_id"),
        nullable=False,
    )
    lgs_d_creation: Mapped[datetime] = mapped_column("lgs_d_creation", DateTime, nullable=False)
    lgs_d_update: Mapped[datetime] = mapped_column("lgs_d_update", DateTime, nullable=False)
    lgs_is_received: Mapped[bool] = mapped_column("lgs_is_received", Boolean, nullable=False, default=False)
    lgs_is_stockin: Mapped[bool] = mapped_column("lgs_is_stockin", Boolean, nullable=False, default=False)
    lgs_d_stockin: Mapped[Optional[datetime]] = mapped_column("lgs_d_stockin", DateTime, nullable=True)
    con_id: Mapped[Optional[int]] = mapped_column(
        "con_id",
        Integer,
        ForeignKey("TM_CON_CONSIGNEE.con_id"),
        nullable=True,
    )
    sod_id: Mapped[Optional[int]] = mapped_column(
        "sod_id",
        Integer,
        ForeignKey("TM_SOD_Supplier_Order.sod_id"),
        nullable=True,
    )

    supplier: Mapped[Optional["Supplier"]] = relationship("Supplier", lazy="joined")
    consignee: Mapped[Optional["Consignee"]] = relationship("Consignee", lazy="joined")
    creator: Mapped[Optional["User"]] = relationship("User", lazy="joined")
    supplier_order: Mapped[Optional["SupplierOrder"]] = relationship("SupplierOrder", lazy="joined")
    lines: Mapped[List["LogisticLine"]] = relationship(
        "LogisticLine",
        back_populates="logistic",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Logistic(lgs_id={self.lgs_id}, code='{self.lgs_code}')>"


class LogisticLine(Base):
    """Logistics line item."""

    __tablename__ = "TM_LGL_Logistic_Lines"

    lgl_id: Mapped[int] = mapped_column("lgl_id", Integer, primary_key=True, autoincrement=True)
    lgl_guid: Mapped[Optional[str]] = mapped_column("lgl_guid", String(200), nullable=True)
    lgs_id: Mapped[int] = mapped_column(
        "lgs_id",
        Integer,
        ForeignKey("TM_LGS_Logistic.lgs_id"),
        nullable=False,
    )
    lgs_quantity: Mapped[Optional[Decimal]] = mapped_column("lgs_quantity", Numeric(18, 4), nullable=True)
    lgs_unit_price: Mapped[Optional[Decimal]] = mapped_column("lgs_unit_price", Numeric(18, 4), nullable=True)
    lgs_total_price: Mapped[Optional[Decimal]] = mapped_column("lgs_total_price", Numeric(18, 4), nullable=True)
    lgs_prd_name: Mapped[Optional[str]] = mapped_column("lgs_prd_name", String(200), nullable=True)
    lgs_prd_ref: Mapped[Optional[str]] = mapped_column("lgs_prd_ref", String(200), nullable=True)
    lgs_description: Mapped[Optional[str]] = mapped_column("lgs_description", String(1000), nullable=True)
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
    sil_id: Mapped[Optional[int]] = mapped_column(
        "sil_id",
        Integer,
        ForeignKey("TM_SIL_SupplierInvoice_Lines.sil_id"),
        nullable=True,
    )
    lgl_prd_des: Mapped[Optional[str]] = mapped_column("lgl_prd_des", String(1000), nullable=True)
    sol_id: Mapped[Optional[int]] = mapped_column(
        "sol_id",
        Integer,
        ForeignKey("TM_SOL_SupplierOrder_Lines.sol_id"),
        nullable=True,
    )
    cii_id: Mapped[Optional[int]] = mapped_column(
        "cii_id",
        Integer,
        ForeignKey("TM_CII_ClientInvoice_Line.cii_id"),
        nullable=True,
    )
    cgl_id: Mapped[Optional[int]] = mapped_column("cgl_id", Integer, nullable=True)

    logistic: Mapped["Logistic"] = relationship("Logistic", back_populates="lines")
    supplier_order_line: Mapped[Optional["SupplierOrderLine"]] = relationship("SupplierOrderLine", lazy="joined")
    supplier_invoice_line: Mapped[Optional["SupplierInvoiceLine"]] = relationship("SupplierInvoiceLine", lazy="joined")
    client_invoice_line: Mapped[Optional["ClientInvoiceLine"]] = relationship("ClientInvoiceLine", lazy="joined")
    product: Mapped[Optional["Product"]] = relationship("Product", lazy="joined")
    product_instance: Mapped[Optional["ProductInstance"]] = relationship("ProductInstance", lazy="joined")

    def __repr__(self) -> str:
        return f"<LogisticLine(lgl_id={self.lgl_id}, lgs_id={self.lgs_id})>"


class LogisticSupplierInvoice(Base):
    """Join table between logistics and supplier invoices."""

    __tablename__ = "TR_LSI_Logistic_SupplierInvoice"

    lsi_id: Mapped[int] = mapped_column("lsi_id", Integer, primary_key=True, autoincrement=True)
    lgs_id: Mapped[int] = mapped_column(
        "lgs_id",
        Integer,
        ForeignKey("TM_LGS_Logistic.lgs_id"),
        nullable=False,
    )
    sin_id: Mapped[int] = mapped_column(
        "sin_id",
        Integer,
        ForeignKey("TM_SIN_Supplier_Invoice.sin_id"),
        nullable=False,
    )

    logistic: Mapped["Logistic"] = relationship("Logistic", lazy="joined")
    supplier_invoice: Mapped[Optional["SupplierInvoice"]] = relationship("SupplierInvoice", lazy="joined")

    def __repr__(self) -> str:
        return f"<LogisticSupplierInvoice(lsi_id={self.lsi_id}, lgs_id={self.lgs_id})>"

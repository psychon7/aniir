"""
ClientInvoiceLine model - Maps to TM_CII_ClientInvoice_Line table.

Actual DB schema:
  cii_id: int NOT NULL [PK]
  cin_id: int NOT NULL
  cii_level1: int NULL
  cii_description: nvarchar(4000) NULL
  prd_id: int NULL
  cii_ref: nvarchar(100) NULL
  cii_unit_price: decimal NULL
  cii_quantity: decimal NULL
  cii_total_price: decimal NULL
  vat_id: int NULL
  dfl_id: int NULL
  cii_level2: int NULL
  cii_purchase_price: decimal NULL
  cii_total_crude_price: decimal NULL
  cii_prd_name: nvarchar(100) NULL
  cii_discount_percentage: decimal NULL
  cii_discount_amount: decimal NULL
  cii_price_with_discount_ht: decimal NULL
  cii_margin: decimal NULL
  pit_id: int NULL
  ltp_id: int NOT NULL
  cii_av_id: int NULL
  cii_prd_des: nvarchar(1000) NULL
  cii_image_url: nvarchar(2000) NULL
  col_id: int NULL
  sol_id: int NULL
"""
from typing import Optional, TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.invoice import ClientInvoice


class ClientInvoiceLine(Base):
    """
    Client Invoice Line model - Maps to TM_CII_ClientInvoice_Line table.
    """
    __tablename__ = "TM_CII_ClientInvoice_Line"

    # Primary Key
    cii_id: Mapped[int] = mapped_column("cii_id", Integer, primary_key=True, autoincrement=True)

    # Foreign Keys
    cin_id: Mapped[int] = mapped_column("cin_id", Integer, ForeignKey("TM_CIN_Client_Invoice.cin_id"), nullable=False)
    prd_id: Mapped[Optional[int]] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=True)
    vat_id: Mapped[Optional[int]] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=True)
    pit_id: Mapped[Optional[int]] = mapped_column("pit_id", Integer, ForeignKey("TM_PIT_Product_Instance.pit_id"), nullable=True)
    ltp_id: Mapped[int] = mapped_column("ltp_id", Integer, ForeignKey("TR_LTP_Line_Type.ltp_id"), nullable=False)
    dfl_id: Mapped[Optional[int]] = mapped_column("dfl_id", Integer, ForeignKey("TM_DFL_DevlieryForm_Line.dfl_id"), nullable=True)
    col_id: Mapped[Optional[int]] = mapped_column("col_id", Integer, ForeignKey("TM_COL_ClientOrder_Lines.col_id"), nullable=True)
    sol_id: Mapped[Optional[int]] = mapped_column("sol_id", Integer, ForeignKey("TM_SOL_SupplierOrder_Lines.sol_id"), nullable=True)
    cii_av_id: Mapped[Optional[int]] = mapped_column("cii_av_id", Integer, ForeignKey("TM_CII_ClientInvoice_Line.cii_id"), nullable=True)

    # Line details
    cii_level1: Mapped[Optional[int]] = mapped_column("cii_level1", Integer, nullable=True)
    cii_level2: Mapped[Optional[int]] = mapped_column("cii_level2", Integer, nullable=True)
    cii_description: Mapped[Optional[str]] = mapped_column("cii_description", String(4000), nullable=True)
    cii_ref: Mapped[Optional[str]] = mapped_column("cii_ref", String(100), nullable=True)
    cii_prd_name: Mapped[Optional[str]] = mapped_column("cii_prd_name", String(100), nullable=True)
    cii_prd_des: Mapped[Optional[str]] = mapped_column("cii_prd_des", String(1000), nullable=True)
    cii_image_url: Mapped[Optional[str]] = mapped_column("cii_image_url", String(2000), nullable=True)

    # Quantity and pricing
    cii_quantity: Mapped[Optional[Decimal]] = mapped_column("cii_quantity", Numeric(18, 4), nullable=True)
    cii_unit_price: Mapped[Optional[Decimal]] = mapped_column("cii_unit_price", Numeric(18, 4), nullable=True)
    cii_purchase_price: Mapped[Optional[Decimal]] = mapped_column("cii_purchase_price", Numeric(18, 4), nullable=True)

    # Discount
    cii_discount_percentage: Mapped[Optional[Decimal]] = mapped_column("cii_discount_percentage", Numeric(18, 2), nullable=True)
    cii_discount_amount: Mapped[Optional[Decimal]] = mapped_column("cii_discount_amount", Numeric(18, 2), nullable=True)

    # Calculated amounts
    cii_total_price: Mapped[Optional[Decimal]] = mapped_column("cii_total_price", Numeric(18, 2), nullable=True)
    cii_total_crude_price: Mapped[Optional[Decimal]] = mapped_column("cii_total_crude_price", Numeric(18, 2), nullable=True)
    cii_price_with_discount_ht: Mapped[Optional[Decimal]] = mapped_column("cii_price_with_discount_ht", Numeric(18, 2), nullable=True)
    cii_margin: Mapped[Optional[Decimal]] = mapped_column("cii_margin", Numeric(18, 2), nullable=True)

    # Relationships
    invoice: Mapped["ClientInvoice"] = relationship("ClientInvoice", back_populates="lines")

    # Property aliases for API compatibility
    @property
    def id(self) -> int:
        return self.cii_id

    @property
    def invl_id(self) -> int:
        """Backward compatibility alias."""
        return self.cii_id

    @property
    def invoice_id(self) -> int:
        return self.cin_id

    @property
    def product_id(self) -> Optional[int]:
        return self.prd_id

    @property
    def description(self) -> Optional[str]:
        return self.cii_description

    @property
    def quantity(self) -> Optional[Decimal]:
        return self.cii_quantity

    @property
    def unit_price(self) -> Optional[Decimal]:
        return self.cii_unit_price

    @property
    def discount_percent(self) -> Optional[Decimal]:
        return self.cii_discount_percentage

    @property
    def line_total(self) -> Optional[Decimal]:
        return self.cii_total_price

    @property
    def product_name(self) -> Optional[str]:
        return self.cii_prd_name

    @property
    def product_reference(self) -> Optional[str]:
        return self.cii_ref

    def __repr__(self) -> str:
        return f"<ClientInvoiceLine(cii_id={self.cii_id}, cin_id={self.cin_id}, total={self.cii_total_price})>"

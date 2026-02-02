"""
DeliveryForm and DeliveryFormLine models.
Maps to actual TM_DFO_Delivery_Form and TM_DFL_DevlieryForm_Line tables.

Note: The typo "DevlieryForm" is in the actual database table name.

Actual DB schema for TM_DFO_Delivery_Form:
  dfo_id: int NOT NULL [PK]
  dfo_code: nvarchar(50) NOT NULL
  dfo_d_creation: datetime NOT NULL
  dfo_d_update: datetime NOT NULL
  dfo_d_delivery: datetime NOT NULL
  dfo_header_text: ntext NULL
  dfo_footer_text: ntext NULL
  dfo_delivery_comment: nvarchar(4000) NULL
  dfo_inter_comment: nvarchar(4000) NULL
  usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
  cod_id: int NOT NULL -> TM_COD_Client_Order.cod_id
  dfo_dlv_cco_firstname: nvarchar(200) NULL
  dfo_dlv_cco_lastname: nvarchar(200) NULL
  dfo_dlv_cco_address1: nvarchar(200) NULL
  dfo_dlv_cco_address2: nvarchar(200) NULL
  dfo_dlv_cco_postcode: nvarchar(50) NULL
  dfo_dlv_cco_city: nvarchar(200) NULL
  dfo_dlv_cco_country: nvarchar(200) NULL
  dfo_dlv_cco_tel1: nvarchar(100) NULL
  dfo_dlv_cco_fax: nvarchar(100) NULL
  dfo_dlv_cco_cellphone: nvarchar(100) NULL
  dfo_dlv_cco_email: nvarchar(100) NULL
  dfo_file: nvarchar(2000) NULL
  cli_id: int NOT NULL -> TM_CLI_CLient.cli_id
  soc_id: int NOT NULL -> TR_SOC_Society.soc_id
  dfo_deliveried: bit NOT NULL
  dfo_client_adr: bit NULL
  dfo_import_field: xml NULL
  dfo_gdoc_nb: int NULL

Actual DB schema for TM_DFL_DevlieryForm_Line:
  dfl_id: int NOT NULL [PK]
  dfo_id: int NOT NULL -> TM_DFO_Delivery_Form.dfo_id
  col_id: int NULL -> TM_COL_ClientOrder_Lines.col_id
  dfl_description: nvarchar(4000) NULL
  dfl_quantity: decimal NULL
  cii_id: int NULL -> TM_CII_ClientInvoice_Line.cii_id
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Integer, String, DateTime, Numeric, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.order import ClientOrder, ClientOrderLine
    from app.models.user import User


class DeliveryForm(Base):
    """
    Delivery Form model.
    Maps to actual TM_DFO_Delivery_Form table.

    Represents a delivery note/shipping document for client orders.
    """
    __tablename__ = "TM_DFO_Delivery_Form"

    # Primary Key
    dfo_id: Mapped[int] = mapped_column("dfo_id", Integer, primary_key=True, autoincrement=True)

    # Reference code
    dfo_code: Mapped[str] = mapped_column("dfo_code", String(50), nullable=False)

    # Dates
    dfo_d_creation: Mapped[datetime] = mapped_column("dfo_d_creation", DateTime, nullable=False)
    dfo_d_update: Mapped[datetime] = mapped_column("dfo_d_update", DateTime, nullable=False)
    dfo_d_delivery: Mapped[datetime] = mapped_column("dfo_d_delivery", DateTime, nullable=False)

    # Header and footer text
    dfo_header_text: Mapped[Optional[str]] = mapped_column("dfo_header_text", Text, nullable=True)
    dfo_footer_text: Mapped[Optional[str]] = mapped_column("dfo_footer_text", Text, nullable=True)

    # Comments
    dfo_delivery_comment: Mapped[Optional[str]] = mapped_column("dfo_delivery_comment", String(4000), nullable=True)
    dfo_inter_comment: Mapped[Optional[str]] = mapped_column("dfo_inter_comment", String(4000), nullable=True)

    # Creator and Order
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)
    cod_id: Mapped[int] = mapped_column("cod_id", Integer, ForeignKey("TM_COD_Client_Order.cod_id"), nullable=False)

    # Delivery contact information (embedded copy of contact info)
    dfo_dlv_cco_firstname: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_firstname", String(200), nullable=True)
    dfo_dlv_cco_lastname: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_lastname", String(200), nullable=True)
    dfo_dlv_cco_address1: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_address1", String(200), nullable=True)
    dfo_dlv_cco_address2: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_address2", String(200), nullable=True)
    dfo_dlv_cco_postcode: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_postcode", String(50), nullable=True)
    dfo_dlv_cco_city: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_city", String(200), nullable=True)
    dfo_dlv_cco_country: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_country", String(200), nullable=True)
    dfo_dlv_cco_tel1: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_tel1", String(100), nullable=True)
    dfo_dlv_cco_fax: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_fax", String(100), nullable=True)
    dfo_dlv_cco_cellphone: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_cellphone", String(100), nullable=True)
    dfo_dlv_cco_email: Mapped[Optional[str]] = mapped_column("dfo_dlv_cco_email", String(100), nullable=True)

    # File attachment
    dfo_file: Mapped[Optional[str]] = mapped_column("dfo_file", String(2000), nullable=True)

    # Client and Society
    cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)

    # Delivery status
    dfo_deliveried: Mapped[bool] = mapped_column("dfo_deliveried", Boolean, nullable=False, default=False)
    dfo_client_adr: Mapped[Optional[bool]] = mapped_column("dfo_client_adr", Boolean, nullable=True)

    # Import field (XML)
    # Note: XML type not directly supported, using Text as fallback
    dfo_import_field: Mapped[Optional[str]] = mapped_column("dfo_import_field", Text, nullable=True)

    # Google Docs number
    dfo_gdoc_nb: Mapped[Optional[int]] = mapped_column("dfo_gdoc_nb", Integer, nullable=True)

    # Relationships
    lines: Mapped[List["DeliveryFormLine"]] = relationship(
        "DeliveryFormLine",
        back_populates="delivery_form",
        cascade="all, delete-orphan"
    )

    client: Mapped["Client"] = relationship("Client", backref="delivery_forms", foreign_keys=[cli_id])
    order: Mapped["ClientOrder"] = relationship("ClientOrder", backref="delivery_forms", foreign_keys=[cod_id])
    creator: Mapped["User"] = relationship("User", backref="created_delivery_forms", foreign_keys=[usr_creator_id])

    def __repr__(self) -> str:
        return f"<DeliveryForm(dfo_id={self.dfo_id}, code='{self.dfo_code}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.dfo_id

    @property
    def del_id(self) -> int:
        return self.dfo_id

    @property
    def reference(self) -> str:
        return self.dfo_code

    @property
    def order_id(self) -> int:
        return self.cod_id

    @property
    def client_id(self) -> int:
        return self.cli_id

    @property
    def delivery_date(self) -> datetime:
        return self.dfo_d_delivery

    @property
    def is_delivered(self) -> bool:
        return self.dfo_deliveried

    @property
    def line_count(self) -> int:
        return len(self.lines) if self.lines else 0

    @property
    def total_quantity(self) -> Decimal:
        if not self.lines:
            return Decimal("0")
        return sum(line.dfl_quantity or Decimal("0") for line in self.lines)

    @property
    def full_shipping_address(self) -> str:
        parts = []
        if self.dfo_dlv_cco_address1:
            parts.append(self.dfo_dlv_cco_address1)
        if self.dfo_dlv_cco_city:
            parts.append(self.dfo_dlv_cco_city)
        if self.dfo_dlv_cco_postcode:
            parts.append(self.dfo_dlv_cco_postcode)
        if self.dfo_dlv_cco_country:
            parts.append(self.dfo_dlv_cco_country)
        return ", ".join(parts) if parts else ""


class DeliveryFormLine(Base):
    """
    Delivery Form Line model.
    Maps to actual TM_DFL_DevlieryForm_Line table.

    Note: The typo "DevlieryForm" is in the actual database table name.
    """
    __tablename__ = "TM_DFL_DevlieryForm_Line"

    # Primary Key
    dfl_id: Mapped[int] = mapped_column("dfl_id", Integer, primary_key=True, autoincrement=True)

    # Foreign Key - Parent Delivery Form
    dfo_id: Mapped[int] = mapped_column("dfo_id", Integer, ForeignKey("TM_DFO_Delivery_Form.dfo_id"), nullable=False)

    # Foreign Key - Source Order Line (optional)
    col_id: Mapped[Optional[int]] = mapped_column("col_id", Integer, ForeignKey("TM_COL_ClientOrder_Lines.col_id"), nullable=True)

    # Description
    dfl_description: Mapped[Optional[str]] = mapped_column("dfl_description", String(4000), nullable=True)

    # Quantity
    dfl_quantity: Mapped[Optional[Decimal]] = mapped_column("dfl_quantity", Numeric(18, 2), nullable=True)

    # Foreign Key - Client Invoice Line (optional, for linking to invoice)
    cii_id: Mapped[Optional[int]] = mapped_column("cii_id", Integer, ForeignKey("TM_CII_ClientInvoice_Line.cii_id"), nullable=True)

    # Relationships
    delivery_form: Mapped["DeliveryForm"] = relationship("DeliveryForm", back_populates="lines")
    order_line: Mapped[Optional["ClientOrderLine"]] = relationship("ClientOrderLine", backref="delivery_form_lines")

    def __repr__(self) -> str:
        return f"<DeliveryFormLine(dfl_id={self.dfl_id}, quantity={self.dfl_quantity})>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.dfl_id

    @property
    def delivery_form_id(self) -> int:
        return self.dfo_id

    @property
    def order_line_id(self) -> Optional[int]:
        return self.col_id

    @property
    def quantity(self) -> Optional[Decimal]:
        return self.dfl_quantity

    @property
    def description(self) -> Optional[str]:
        return self.dfl_description

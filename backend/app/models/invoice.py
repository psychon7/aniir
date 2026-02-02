"""
Client Invoice SQLAlchemy model.
Maps to existing TM_CIN_Client_Invoice table.

Actual DB schema:
  cin_id: int NOT NULL [PK]
  cin_code: nvarchar(50) NOT NULL
  cod_id: int NULL
  cli_id: int NOT NULL
  cin_d_creation: datetime NOT NULL
  cin_d_update: datetime NULL
  cin_d_invoice: datetime NULL
  usr_creator_id: int NOT NULL
  cin_header_text: ntext NULL
  cin_footer_text: ntext NULL
  cur_id: int NOT NULL
  cin_account: bit NOT NULL
  cin_d_term: datetime NULL
  pco_id: int NOT NULL
  pmo_id: int NOT NULL
  cco_id_invoicing: int NULL
  cin_isinvoice: bit NOT NULL
  vat_id: int NOT NULL
  prj_id: int NULL
  dfo_id: int NULL
  soc_id: int NOT NULL
  cin_name: nvarchar(1000) NULL
  ... (address fields, discount, etc.)
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    Column, Integer, String, DateTime, Date, Numeric,
    ForeignKey, Boolean, Text
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

# Re-export ClientInvoiceLine for backward compatibility
from app.models.client_invoice_line import ClientInvoiceLine

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.status import Status
    from app.models.currency import Currency
    from app.models.client_invoice_payment import ClientInvoicePayment


class ClientInvoice(Base):
    """Maps to TM_CIN_Client_Invoice table with actual DB column names."""
    __tablename__ = "TM_CIN_Client_Invoice"
    __table_args__ = {"extend_existing": True}

    # Primary key
    cin_id: Mapped[int] = mapped_column("cin_id", Integer, primary_key=True, autoincrement=True)

    # Reference
    cin_code: Mapped[str] = mapped_column("cin_code", String(50), nullable=False)
    cin_name: Mapped[Optional[str]] = mapped_column("cin_name", String(1000), nullable=True)

    # Foreign keys
    cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)
    cod_id: Mapped[Optional[int]] = mapped_column("cod_id", Integer, ForeignKey("TM_COD_Client_Order.cod_id"), nullable=True)
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)
    cur_id: Mapped[int] = mapped_column("cur_id", Integer, ForeignKey("TR_CUR_Currency.cur_id"), nullable=False)
    pco_id: Mapped[int] = mapped_column("pco_id", Integer, ForeignKey("TR_PCO_Payment_Condition.pco_id"), nullable=False)
    pmo_id: Mapped[int] = mapped_column("pmo_id", Integer, ForeignKey("TR_PMO_Payment_Mode.pmo_id"), nullable=False)
    vat_id: Mapped[int] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    prj_id: Mapped[Optional[int]] = mapped_column("prj_id", Integer, ForeignKey("TM_PRJ_Project.prj_id"), nullable=True)
    dfo_id: Mapped[Optional[int]] = mapped_column("dfo_id", Integer, ForeignKey("TM_DFO_Delivery_Form.dfo_id"), nullable=True)
    cco_id_invoicing: Mapped[Optional[int]] = mapped_column("cco_id_invoicing", Integer, ForeignKey("TM_CCO_Client_Contact.cco_id"), nullable=True)

    # Dates
    cin_d_creation: Mapped[datetime] = mapped_column("cin_d_creation", DateTime, nullable=False)
    cin_d_update: Mapped[Optional[datetime]] = mapped_column("cin_d_update", DateTime, nullable=True)
    cin_d_invoice: Mapped[Optional[datetime]] = mapped_column("cin_d_invoice", DateTime, nullable=True)
    cin_d_term: Mapped[Optional[datetime]] = mapped_column("cin_d_term", DateTime, nullable=True)
    cin_d_encaissement: Mapped[Optional[datetime]] = mapped_column("cin_d_encaissement", DateTime, nullable=True)

    # Status flags
    cin_account: Mapped[bool] = mapped_column("cin_account", Boolean, nullable=False, default=False)
    cin_isinvoice: Mapped[bool] = mapped_column("cin_isinvoice", Boolean, nullable=False, default=True)
    cin_invoiced: Mapped[bool] = mapped_column("cin_invoiced", Boolean, nullable=False, default=False)
    cin_is_full_paid: Mapped[Optional[bool]] = mapped_column("cin_is_full_paid", Boolean, nullable=True)
    cin_key_project: Mapped[Optional[bool]] = mapped_column("cin_key_project", Boolean, nullable=True)

    # Text fields
    cin_header_text: Mapped[Optional[str]] = mapped_column("cin_header_text", Text, nullable=True)
    cin_footer_text: Mapped[Optional[str]] = mapped_column("cin_footer_text", Text, nullable=True)
    cin_client_comment: Mapped[Optional[str]] = mapped_column("cin_client_comment", String(4000), nullable=True)
    cin_inter_comment: Mapped[Optional[str]] = mapped_column("cin_inter_comment", String(4000), nullable=True)

    # Discount and amounts
    cin_discount_percentage: Mapped[Optional[Decimal]] = mapped_column("cin_discount_percentage", Numeric(18, 2), nullable=True)
    cin_discount_amount: Mapped[Optional[Decimal]] = mapped_column("cin_discount_amount", Numeric(18, 2), nullable=True)
    cin_rest_to_pay: Mapped[Optional[Decimal]] = mapped_column("cin_rest_to_pay", Numeric(18, 2), nullable=True)
    cin_margin: Mapped[Optional[Decimal]] = mapped_column("cin_margin", Numeric(18, 2), nullable=True)

    # File
    cin_file: Mapped[Optional[str]] = mapped_column("cin_file", String(2000), nullable=True)

    # Invoicing address (snapshot)
    cin_inv_cco_firstname: Mapped[Optional[str]] = mapped_column("cin_inv_cco_firstname", String(200), nullable=True)
    cin_inv_cco_lastname: Mapped[Optional[str]] = mapped_column("cin_inv_cco_lastname", String(200), nullable=True)
    cin_inv_cco_address1: Mapped[Optional[str]] = mapped_column("cin_inv_cco_address1", String(200), nullable=True)
    cin_inv_cco_address2: Mapped[Optional[str]] = mapped_column("cin_inv_cco_address2", String(200), nullable=True)
    cin_inv_cco_postcode: Mapped[Optional[str]] = mapped_column("cin_inv_cco_postcode", String(50), nullable=True)
    cin_inv_cco_city: Mapped[Optional[str]] = mapped_column("cin_inv_cco_city", String(200), nullable=True)
    cin_inv_cco_country: Mapped[Optional[str]] = mapped_column("cin_inv_cco_country", String(200), nullable=True)
    cin_inv_cco_tel1: Mapped[Optional[str]] = mapped_column("cin_inv_cco_tel1", String(100), nullable=True)
    cin_inv_cco_fax: Mapped[Optional[str]] = mapped_column("cin_inv_cco_fax", String(100), nullable=True)
    cin_inv_cco_cellphone: Mapped[Optional[str]] = mapped_column("cin_inv_cco_cellphone", String(100), nullable=True)
    cin_inv_cco_email: Mapped[Optional[str]] = mapped_column("cin_inv_cco_email", String(100), nullable=True)

    # Commercial users
    usr_com_1: Mapped[Optional[int]] = mapped_column("usr_com_1", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    usr_com_2: Mapped[Optional[int]] = mapped_column("usr_com_2", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    usr_com_3: Mapped[Optional[int]] = mapped_column("usr_com_3", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)

    # Other references
    cin_avoir_id: Mapped[Optional[int]] = mapped_column("cin_avoir_id", Integer, ForeignKey("TM_CIN_Client_Invoice.cin_id"), nullable=True)
    sod_id: Mapped[Optional[int]] = mapped_column("sod_id", Integer, nullable=True)
    cin_bank: Mapped[Optional[int]] = mapped_column("cin_bank", Integer, nullable=True)
    tte_id: Mapped[Optional[int]] = mapped_column("tte_id", Integer, ForeignKey("TR_TTE_TRADE_TERMS.tte_id"), nullable=True)
    cin_delegator_id: Mapped[Optional[int]] = mapped_column("cin_delegator_id", Integer, nullable=True)

    # Relationships
    lines: Mapped[List["ClientInvoiceLine"]] = relationship(
        "ClientInvoiceLine",
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    payments: Mapped[List["ClientInvoicePayment"]] = relationship(
        "ClientInvoicePayment",
        back_populates="invoice",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # Property aliases for API compatibility
    @property
    def inv_id(self):
        return self.cin_id

    @property
    def inv_reference(self):
        return self.cin_code

    @property
    def inv_client_id(self):
        return self.cli_id

    @property
    def inv_date(self):
        return self.cin_d_invoice

    @property
    def inv_created_at(self):
        return self.cin_d_creation

    @property
    def inv_updated_at(self):
        return self.cin_d_update

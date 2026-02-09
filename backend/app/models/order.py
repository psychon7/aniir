"""
SQLAlchemy models for Orders.

This module contains:
- ClientOrder: Client Order model (TM_COD_Client_Order)
- ClientOrderLine: Order line items (TM_COL_ClientOrder_Lines)

Actual DB tables:
- TM_COD_Client_Order: Client orders
- TM_COL_ClientOrder_Lines: Order line items
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
    from app.models.client import Client
    from app.models.product import Product
    from app.models.vat_rate import VatRate


# =============================================================================
# ClientOrder Model (TM_COD_Client_Order)
# =============================================================================


class ClientOrder(Base):
    """
    Client Order model.
    Maps to TM_COD_Client_Order table.

    Actual DB schema:
      cod_id: int NOT NULL [PK]
      cod_code: nvarchar(50) NOT NULL
      cod_d_creation: datetime NOT NULL
      cod_d_update: datetime NOT NULL
      cli_id: int NOT NULL -> TM_CLI_CLient.cli_id
      pco_id: int NOT NULL -> TR_PCO_Payment_Condition.pco_id
      pmo_id: int NOT NULL -> TR_PMO_Payment_Mode.pmo_id
      cod_d_pre_delivery_from: datetime NULL
      cod_d_pre_delivery_to: datetime NULL
      cod_header_text: ntext NULL
      cod_footer_text: ntext NULL
      cco_id_invoicing: int NULL -> TM_CCO_Client_Contact.cco_id
      cco_id_delivery: int NULL -> TM_CCO_Client_Contact.cco_id
      cod_client_comment: nvarchar(4000) NULL
      cod_inter_comment: nvarchar(4000) NULL
      usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
      cpl_id: int NULL -> TM_CPL_Cost_Plan.cpl_id
      vat_id: int NOT NULL -> TR_VAT_Vat.vat_id
      prj_id: int NOT NULL -> TM_PRJ_Project.prj_id
      soc_id: int NOT NULL -> TR_SOC_Society.soc_id
      cod_name: nvarchar(1000) NULL
      cod_discount_percentage: decimal NULL
      cod_discount_amount: decimal NULL
      cod_d_end_work: datetime NULL
      cod_file: nvarchar(2000) NULL
      usr_com_1: int NULL -> TM_USR_User.usr_id
      usr_com_2: int NULL -> TM_USR_User.usr_id
      usr_com_3: int NULL -> TM_USR_User.usr_id
      cod_key_project: bit NULL
    """
    __tablename__ = "TM_COD_Client_Order"

    # Primary Key
    cod_id: Mapped[int] = mapped_column("cod_id", Integer, primary_key=True, autoincrement=True)

    # Reference code
    cod_code: Mapped[str] = mapped_column("cod_code", String(50), nullable=False)

    # Dates
    cod_d_creation: Mapped[datetime] = mapped_column("cod_d_creation", DateTime, nullable=False)
    cod_d_update: Mapped[datetime] = mapped_column("cod_d_update", DateTime, nullable=False)
    cod_d_pre_delivery_from: Mapped[Optional[datetime]] = mapped_column("cod_d_pre_delivery_from", DateTime, nullable=True)
    cod_d_pre_delivery_to: Mapped[Optional[datetime]] = mapped_column("cod_d_pre_delivery_to", DateTime, nullable=True)
    cod_d_end_work: Mapped[Optional[datetime]] = mapped_column("cod_d_end_work", DateTime, nullable=True)

    # Client relationship
    cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)

    # Payment terms and mode
    pco_id: Mapped[int] = mapped_column("pco_id", Integer, ForeignKey("TR_PCO_Payment_Condition.pco_id"), nullable=False)
    pmo_id: Mapped[int] = mapped_column("pmo_id", Integer, ForeignKey("TR_PMO_Payment_Mode.pmo_id"), nullable=False)

    # Header and footer text
    cod_header_text: Mapped[Optional[str]] = mapped_column("cod_header_text", Text, nullable=True)
    cod_footer_text: Mapped[Optional[str]] = mapped_column("cod_footer_text", Text, nullable=True)

    # Invoicing contact
    cco_id_invoicing: Mapped[Optional[int]] = mapped_column("cco_id_invoicing", Integer, ForeignKey("TM_CCO_Client_Contact.cco_id"), nullable=True)
    cco_id_delivery: Mapped[Optional[int]] = mapped_column("cco_id_delivery", Integer, ForeignKey("TM_CCO_Client_Contact.cco_id"), nullable=True)

    # Invoicing contact snapshot
    cod_inv_cco_ref: Mapped[Optional[str]] = mapped_column("cod_inv_cco_ref", String(50), nullable=True)
    cod_inv_cco_adresse_title: Mapped[Optional[str]] = mapped_column("cod_inv_cco_adresse_title", String(200), nullable=True)
    cod_inv_cco_firstname: Mapped[Optional[str]] = mapped_column("cod_inv_cco_firstname", String(200), nullable=True)
    cod_inv_cco_lastname: Mapped[Optional[str]] = mapped_column("cod_inv_cco_lastname", String(200), nullable=True)
    cod_inv_cco_address1: Mapped[Optional[str]] = mapped_column("cod_inv_cco_address1", String(200), nullable=True)
    cod_inv_cco_address2: Mapped[Optional[str]] = mapped_column("cod_inv_cco_address2", String(200), nullable=True)
    cod_inv_cco_postcode: Mapped[Optional[str]] = mapped_column("cod_inv_cco_postcode", String(50), nullable=True)
    cod_inv_cco_city: Mapped[Optional[str]] = mapped_column("cod_inv_cco_city", String(200), nullable=True)
    cod_inv_cco_country: Mapped[Optional[str]] = mapped_column("cod_inv_cco_country", String(200), nullable=True)
    cod_inv_cco_tel1: Mapped[Optional[str]] = mapped_column("cod_inv_cco_tel1", String(100), nullable=True)
    cod_inv_cco_tel2: Mapped[Optional[str]] = mapped_column("cod_inv_cco_tel2", String(100), nullable=True)
    cod_inv_cco_fax: Mapped[Optional[str]] = mapped_column("cod_inv_cco_fax", String(100), nullable=True)
    cod_inv_cco_cellphone: Mapped[Optional[str]] = mapped_column("cod_inv_cco_cellphone", String(100), nullable=True)
    cod_inv_cco_email: Mapped[Optional[str]] = mapped_column("cod_inv_cco_email", String(100), nullable=True)

    # Delivery contact snapshot
    cod_dlv_cco_ref: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_ref", String(50), nullable=True)
    cod_dlv_cco_adresse_title: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_adresse_title", String(200), nullable=True)
    cod_dlv_cco_firstname: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_firstname", String(200), nullable=True)
    cod_dlv_cco_lastname: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_lastname", String(200), nullable=True)
    cod_dlv_cco_address1: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_address1", String(200), nullable=True)
    cod_dlv_cco_address2: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_address2", String(200), nullable=True)
    cod_dlv_cco_postcode: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_postcode", String(50), nullable=True)
    cod_dlv_cco_city: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_city", String(200), nullable=True)
    cod_dlv_cco_country: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_country", String(200), nullable=True)
    cod_dlv_cco_tel1: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_tel1", String(100), nullable=True)
    cod_dlv_cco_tel2: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_tel2", String(100), nullable=True)
    cod_dlv_cco_fax: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_fax", String(100), nullable=True)
    cod_dlv_cco_cellphone: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_cellphone", String(100), nullable=True)
    cod_dlv_cco_email: Mapped[Optional[str]] = mapped_column("cod_dlv_cco_email", String(100), nullable=True)

    # Comments
    cod_client_comment: Mapped[Optional[str]] = mapped_column("cod_client_comment", String(4000), nullable=True)
    cod_inter_comment: Mapped[Optional[str]] = mapped_column("cod_inter_comment", String(4000), nullable=True)

    # Creator
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # Link to cost plan (quote)
    cpl_id: Mapped[Optional[int]] = mapped_column("cpl_id", Integer, ForeignKey("TM_CPL_Cost_Plan.cpl_id"), nullable=True)

    # VAT, Project, Society
    vat_id: Mapped[int] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)
    prj_id: Mapped[int] = mapped_column("prj_id", Integer, ForeignKey("TM_PRJ_Project.prj_id"), nullable=False)
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)

    # Name and discounts
    cod_name: Mapped[Optional[str]] = mapped_column("cod_name", String(1000), nullable=True)
    cod_discount_percentage: Mapped[Optional[Decimal]] = mapped_column("cod_discount_percentage", Numeric(18, 2), nullable=True)
    cod_discount_amount: Mapped[Optional[Decimal]] = mapped_column("cod_discount_amount", Numeric(18, 2), nullable=True)

    # File attachment
    cod_file: Mapped[Optional[str]] = mapped_column("cod_file", String(2000), nullable=True)

    # Commercial users
    usr_com_1: Mapped[Optional[int]] = mapped_column("usr_com_1", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    usr_com_2: Mapped[Optional[int]] = mapped_column("usr_com_2", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    usr_com_3: Mapped[Optional[int]] = mapped_column("usr_com_3", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)

    # Key project flag
    cod_key_project: Mapped[Optional[bool]] = mapped_column("cod_key_project", Boolean, nullable=True)

    # Relationships (without back_populates to avoid circular reference issues)
    lines: Mapped[List["ClientOrderLine"]] = relationship(
        "ClientOrderLine",
        back_populates="order",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ClientOrder(cod_id={self.cod_id}, code='{self.cod_code}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.cod_id

    @property
    def code(self) -> str:
        return self.cod_code

    @property
    def reference(self) -> str:
        return self.cod_code


# =============================================================================
# ClientOrderLine Model (TM_COL_ClientOrder_Lines)
# =============================================================================


class ClientOrderLine(Base):
    """
    Client Order Line model.
    Maps to TM_COL_ClientOrder_Lines table.

    Actual DB schema:
      col_id: int NOT NULL [PK]
      cod_id: int NOT NULL -> TM_COD_Client_Order.cod_id
      cln_id: int NULL -> TM_CLN_CostPlan_Lines.cln_id
      col_level1: int NULL
      col_description: nvarchar(4000) NULL
      prd_id: int NULL -> TM_PRD_Product.prd_id
      col_ref: nvarchar(100) NULL
      col_unit_price: decimal NULL
      col_quantity: decimal NULL
      col_total_price: decimal NULL
      vat_id: int NULL -> TR_VAT_Vat.vat_id
      col_level2: int NULL
      col_purchase_price: decimal NULL
      col_total_crude_price: decimal NULL
      col_prd_name: nvarchar(100) NULL
      col_discount_percentage: decimal NULL
      col_discount_amount: decimal NULL
      col_price_with_discount_ht: decimal NULL
      col_margin: decimal NULL
      pit_id: int NULL -> TM_PIT_Product_Instance.pit_id
      ltp_id: int NOT NULL -> TR_LTP_Line_Type.ltp_id
      col_prd_des: nvarchar(1000) NULL
      col_image_url: nvarchar(2000) NULL
    """
    __tablename__ = "TM_COL_ClientOrder_Lines"

    # Primary Key
    col_id: Mapped[int] = mapped_column("col_id", Integer, primary_key=True, autoincrement=True)

    # Foreign key to ClientOrder
    cod_id: Mapped[int] = mapped_column("cod_id", Integer, ForeignKey("TM_COD_Client_Order.cod_id"), nullable=False)

    # Link to cost plan line (quote line)
    cln_id: Mapped[Optional[int]] = mapped_column("cln_id", Integer, ForeignKey("TM_CLN_CostPlan_Lines.cln_id"), nullable=True)

    # Levels (for grouping/hierarchy)
    col_level1: Mapped[Optional[int]] = mapped_column("col_level1", Integer, nullable=True)
    col_level2: Mapped[Optional[int]] = mapped_column("col_level2", Integer, nullable=True)

    # Description
    col_description: Mapped[Optional[str]] = mapped_column("col_description", String(4000), nullable=True)

    # Product reference
    prd_id: Mapped[Optional[int]] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=True)
    col_ref: Mapped[Optional[str]] = mapped_column("col_ref", String(100), nullable=True)
    col_prd_name: Mapped[Optional[str]] = mapped_column("col_prd_name", String(100), nullable=True)
    col_prd_des: Mapped[Optional[str]] = mapped_column("col_prd_des", String(1000), nullable=True)
    col_image_url: Mapped[Optional[str]] = mapped_column("col_image_url", String(2000), nullable=True)

    # Pricing
    col_unit_price: Mapped[Optional[Decimal]] = mapped_column("col_unit_price", Numeric(18, 4), nullable=True)
    col_quantity: Mapped[Optional[Decimal]] = mapped_column("col_quantity", Numeric(10, 2), nullable=True)
    col_total_price: Mapped[Optional[Decimal]] = mapped_column("col_total_price", Numeric(18, 2), nullable=True)
    col_purchase_price: Mapped[Optional[Decimal]] = mapped_column("col_purchase_price", Numeric(18, 4), nullable=True)
    col_total_crude_price: Mapped[Optional[Decimal]] = mapped_column("col_total_crude_price", Numeric(18, 2), nullable=True)

    # Discounts
    col_discount_percentage: Mapped[Optional[Decimal]] = mapped_column("col_discount_percentage", Numeric(5, 2), nullable=True)
    col_discount_amount: Mapped[Optional[Decimal]] = mapped_column("col_discount_amount", Numeric(18, 2), nullable=True)
    col_price_with_discount_ht: Mapped[Optional[Decimal]] = mapped_column("col_price_with_discount_ht", Numeric(18, 2), nullable=True)

    # Margin
    col_margin: Mapped[Optional[Decimal]] = mapped_column("col_margin", Numeric(18, 2), nullable=True)

    # VAT
    vat_id: Mapped[Optional[int]] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=True)

    # Product instance
    pit_id: Mapped[Optional[int]] = mapped_column("pit_id", Integer, ForeignKey("TM_PIT_Product_Instance.pit_id"), nullable=True)

    # Line type
    ltp_id: Mapped[int] = mapped_column("ltp_id", Integer, ForeignKey("TR_LTP_Line_Type.ltp_id"), nullable=False)

    # Relationship to order
    order: Mapped["ClientOrder"] = relationship("ClientOrder", back_populates="lines")

    def __repr__(self) -> str:
        desc = self.col_description[:30] if self.col_description else 'N/A'
        return f"<ClientOrderLine(col_id={self.col_id}, description='{desc}...')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.col_id

    @property
    def description(self) -> Optional[str]:
        return self.col_description

    @property
    def quantity(self) -> Optional[Decimal]:
        return self.col_quantity

    @property
    def unit_price(self) -> Optional[Decimal]:
        return self.col_unit_price

    @property
    def total_price(self) -> Optional[Decimal]:
        return self.col_total_price


# Backward compatibility alias
Order = ClientOrder

"""
CostPlan (Quote) and CostPlanLine models.
Maps to TM_CPL_Cost_Plan and TM_CLN_CostPlan_Lines tables.

The CostPlan represents a quote/proposal sent to clients before an order is placed.

Actual DB tables:
- TM_CPL_Cost_Plan: Cost plans (quotes)
- TM_CLN_CostPlan_Lines: Cost plan line items
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import (
    Column, Integer, String, DateTime, Numeric, Text, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.vat_rate import VatRate
    from app.models.user import User


class CostPlan(Base):
    """
    CostPlan (Quote) model.
    Maps to TM_CPL_Cost_Plan table.

    Actual DB schema:
      cpl_id: int NOT NULL [PK]
      cpl_code: nvarchar(50) NOT NULL
      cpl_d_creation: datetime NOT NULL
      cpl_d_update: datetime NOT NULL
      cst_id: int NOT NULL -> TM_CST_Cost_Status.cst_id
      cli_id: int NOT NULL -> TM_CLI_CLient.cli_id
      pco_id: int NOT NULL -> TR_PCO_Payment_Condition.pco_id
      pmo_id: int NOT NULL -> TR_PMO_Payment_Mode.pmo_id
      cpl_d_validity: datetime NOT NULL
      cpl_d_pre_delivery: datetime NULL
      cpl_header_text: ntext NULL
      cpl_footer_text: ntext NULL
      cco_id_invoicing: int NULL -> TM_CCO_Client_Contact.cco_id
      cpl_client_comment: nvarchar(4000) NULL
      cpl_inter_comment: nvarchar(4000) NULL
      usr_creator_id: int NOT NULL -> TM_USR_User.usr_id
      vat_id: int NOT NULL -> TR_VAT_Vat.vat_id
      prj_id: int NOT NULL -> TM_PRJ_Project.prj_id
      soc_id: int NOT NULL -> TR_SOC_Society.soc_id
      cpl_discount_percentage: decimal NULL
      cpl_discount_amount: decimal NULL
      cpl_d_end_work: datetime NULL
      cpl_file: nvarchar(2000) NULL
      cpl_name: nvarchar(1000) NULL
      usr_com_1: int NULL -> TM_USR_User.usr_id
      usr_com_2: int NULL -> TM_USR_User.usr_id
      usr_com_3: int NULL -> TM_USR_User.usr_id
      cpl_key_project: bit NULL
    """
    __tablename__ = "TM_CPL_Cost_Plan"

    # Primary Key
    cpl_id: Mapped[int] = mapped_column("cpl_id", Integer, primary_key=True, autoincrement=True)

    # Reference code
    cpl_code: Mapped[str] = mapped_column("cpl_code", String(50), nullable=False)

    # Dates
    cpl_d_creation: Mapped[datetime] = mapped_column("cpl_d_creation", DateTime, nullable=False)
    cpl_d_update: Mapped[datetime] = mapped_column("cpl_d_update", DateTime, nullable=False)
    cpl_d_validity: Mapped[datetime] = mapped_column("cpl_d_validity", DateTime, nullable=False)
    cpl_d_pre_delivery: Mapped[Optional[datetime]] = mapped_column("cpl_d_pre_delivery", DateTime, nullable=True)
    cpl_d_end_work: Mapped[Optional[datetime]] = mapped_column("cpl_d_end_work", DateTime, nullable=True)

    # Status
    cst_id: Mapped[int] = mapped_column("cst_id", Integer, ForeignKey("TM_CST_Cost_Status.cst_id"), nullable=False)

    # Client relationship
    cli_id: Mapped[int] = mapped_column("cli_id", Integer, ForeignKey("TM_CLI_CLient.cli_id"), nullable=False)

    # Payment terms and mode
    pco_id: Mapped[int] = mapped_column("pco_id", Integer, ForeignKey("TR_PCO_Payment_Condition.pco_id"), nullable=False)
    pmo_id: Mapped[int] = mapped_column("pmo_id", Integer, ForeignKey("TR_PMO_Payment_Mode.pmo_id"), nullable=False)

    # Header and footer text
    cpl_header_text: Mapped[Optional[str]] = mapped_column("cpl_header_text", Text, nullable=True)
    cpl_footer_text: Mapped[Optional[str]] = mapped_column("cpl_footer_text", Text, nullable=True)

    # Invoicing contact
    cco_id_invoicing: Mapped[Optional[int]] = mapped_column("cco_id_invoicing", Integer, ForeignKey("TM_CCO_Client_Contact.cco_id"), nullable=True)

    # Comments
    cpl_client_comment: Mapped[Optional[str]] = mapped_column("cpl_client_comment", String(4000), nullable=True)
    cpl_inter_comment: Mapped[Optional[str]] = mapped_column("cpl_inter_comment", String(4000), nullable=True)

    # Creator
    usr_creator_id: Mapped[int] = mapped_column("usr_creator_id", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # VAT, Project, Society
    vat_id: Mapped[int] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)
    prj_id: Mapped[int] = mapped_column("prj_id", Integer, ForeignKey("TM_PRJ_Project.prj_id"), nullable=False)
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)

    # Discounts
    cpl_discount_percentage: Mapped[Optional[Decimal]] = mapped_column("cpl_discount_percentage", Numeric(18, 2), nullable=True)
    cpl_discount_amount: Mapped[Optional[Decimal]] = mapped_column("cpl_discount_amount", Numeric(18, 2), nullable=True)

    # File attachment
    cpl_file: Mapped[Optional[str]] = mapped_column("cpl_file", String(2000), nullable=True)

    # Name
    cpl_name: Mapped[Optional[str]] = mapped_column("cpl_name", String(1000), nullable=True)

    # Commercial users
    usr_com_1: Mapped[Optional[int]] = mapped_column("usr_com_1", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    usr_com_2: Mapped[Optional[int]] = mapped_column("usr_com_2", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    usr_com_3: Mapped[Optional[int]] = mapped_column("usr_com_3", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)

    # Key project flag
    cpl_key_project: Mapped[Optional[bool]] = mapped_column("cpl_key_project", Boolean, nullable=True)

    # Relationships
    lines: Mapped[List["CostPlanLine"]] = relationship(
        "CostPlanLine",
        back_populates="cost_plan",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<CostPlan(cpl_id={self.cpl_id}, code='{self.cpl_code}')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.cpl_id

    @property
    def code(self) -> str:
        return self.cpl_code

    @property
    def reference(self) -> str:
        return self.cpl_code

    @property
    def is_expired(self) -> bool:
        """Check if cost plan is expired based on validity date."""
        if self.cpl_d_validity is None:
            return False
        return datetime.now() > self.cpl_d_validity

    @property
    def line_count(self) -> int:
        """Get number of lines in the cost plan."""
        return len(self.lines) if self.lines else 0


class CostPlanLine(Base):
    """
    CostPlanLine model.
    Maps to TM_CLN_CostPlan_Lines table.

    Actual DB schema:
      cln_id: int NOT NULL [PK]
      cpl_id: int NOT NULL -> TM_CPL_Cost_Plan.cpl_id
      cln_level1: int NULL
      cln_level2: int NULL
      cln_description: nvarchar(4000) NULL
      prd_id: int NULL -> TM_PRD_Product.prd_id
      pit_id: int NULL -> TM_PIT_Product_Instance.pit_id
      cln_purchase_price: decimal NULL
      cln_unit_price: decimal NULL
      cln_quantity: decimal NULL
      cln_total_price: decimal NULL
      cln_total_crude_price: decimal NULL
      vat_id: int NULL -> TR_VAT_Vat.vat_id
      ltp_id: int NOT NULL -> TR_LTP_Line_Type.ltp_id
      cln_prd_name: nvarchar(100) NULL
      cln_ref: nvarchar(100) NULL
      cln_discount_percentage: decimal NULL
      cln_discount_amount: decimal NULL
      cln_price_with_discount_ht: decimal NULL
      cln_margin: decimal NULL
    """
    __tablename__ = "TM_CLN_CostPlan_Lines"

    # Primary Key
    cln_id: Mapped[int] = mapped_column("cln_id", Integer, primary_key=True, autoincrement=True)

    # Foreign key to CostPlan
    cpl_id: Mapped[int] = mapped_column("cpl_id", Integer, ForeignKey("TM_CPL_Cost_Plan.cpl_id"), nullable=False)

    # Levels (for grouping/hierarchy)
    cln_level1: Mapped[Optional[int]] = mapped_column("cln_level1", Integer, nullable=True)
    cln_level2: Mapped[Optional[int]] = mapped_column("cln_level2", Integer, nullable=True)

    # Description
    cln_description: Mapped[Optional[str]] = mapped_column("cln_description", String(4000), nullable=True)

    # Product reference
    prd_id: Mapped[Optional[int]] = mapped_column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=True)
    pit_id: Mapped[Optional[int]] = mapped_column("pit_id", Integer, ForeignKey("TM_PIT_Product_Instance.pit_id"), nullable=True)
    cln_prd_name: Mapped[Optional[str]] = mapped_column("cln_prd_name", String(100), nullable=True)
    cln_ref: Mapped[Optional[str]] = mapped_column("cln_ref", String(100), nullable=True)

    # Pricing
    cln_purchase_price: Mapped[Optional[Decimal]] = mapped_column("cln_purchase_price", Numeric(18, 4), nullable=True)
    cln_unit_price: Mapped[Optional[Decimal]] = mapped_column("cln_unit_price", Numeric(18, 4), nullable=True)
    cln_quantity: Mapped[Optional[Decimal]] = mapped_column("cln_quantity", Numeric(10, 2), nullable=True)
    cln_total_price: Mapped[Optional[Decimal]] = mapped_column("cln_total_price", Numeric(18, 2), nullable=True)
    cln_total_crude_price: Mapped[Optional[Decimal]] = mapped_column("cln_total_crude_price", Numeric(18, 2), nullable=True)

    # Discounts
    cln_discount_percentage: Mapped[Optional[Decimal]] = mapped_column("cln_discount_percentage", Numeric(5, 2), nullable=True)
    cln_discount_amount: Mapped[Optional[Decimal]] = mapped_column("cln_discount_amount", Numeric(18, 2), nullable=True)
    cln_price_with_discount_ht: Mapped[Optional[Decimal]] = mapped_column("cln_price_with_discount_ht", Numeric(18, 2), nullable=True)

    # Margin
    cln_margin: Mapped[Optional[Decimal]] = mapped_column("cln_margin", Numeric(18, 2), nullable=True)

    # VAT
    vat_id: Mapped[Optional[int]] = mapped_column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=True)

    # Line type
    ltp_id: Mapped[int] = mapped_column("ltp_id", Integer, ForeignKey("TR_LTP_Line_Type.ltp_id"), nullable=False)

    # Relationship to cost plan
    cost_plan: Mapped["CostPlan"] = relationship("CostPlan", back_populates="lines")

    def __repr__(self) -> str:
        desc = self.cln_description[:30] if self.cln_description else 'N/A'
        return f"<CostPlanLine(cln_id={self.cln_id}, description='{desc}...')>"

    # Property aliases for backward compatibility
    @property
    def id(self) -> int:
        return self.cln_id

    @property
    def description(self) -> Optional[str]:
        return self.cln_description

    @property
    def quantity(self) -> Optional[Decimal]:
        return self.cln_quantity

    @property
    def unit_price(self) -> Optional[Decimal]:
        return self.cln_unit_price

    @property
    def total_price(self) -> Optional[Decimal]:
        return self.cln_total_price

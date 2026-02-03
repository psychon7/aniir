"""
Supplier SQLAlchemy Model
Maps to existing TM_SUP_Supplier table.

Actual DB schema:
  sup_id: int NOT NULL [PK]
  sup_ref: nvarchar(50) NULL
  soc_id: int NOT NULL
  sup_company_name: nvarchar(250) NOT NULL
  vat_id: int NOT NULL
  pco_id: int NOT NULL
  pmo_id: int NOT NULL
  sup_siren: nvarchar(50) NULL
  sup_siret: nvarchar(50) NULL
  sup_vat_intra: nvarchar(50) NULL
  usr_created_by: int NOT NULL
  cur_id: int NOT NULL
  sup_isactive: bit NOT NULL
  sup_isblocked: bit NOT NULL
  sup_d_creation: datetime NOT NULL
  sup_d_update: datetime NOT NULL
  sup_address1: nvarchar(200) NULL
  sup_address2: nvarchar(200) NULL
  sup_postcode: nvarchar(50) NULL
  sup_city: nvarchar(200) NULL
  sup_country: nvarchar(200) NULL
  sup_free_of_harbor: int NULL
  sup_tel1: nvarchar(100) NULL
  sup_tel2: nvarchar(100) NULL
  sup_fax: nvarchar(100) NULL
  sup_cellphone: nvarchar(100) NULL
  sup_email: nvarchar(100) NULL
  sup_recieve_newsletter: bit NOT NULL
  sup_newsletter_email: nvarchar(100) NULL
  sup_comment_for_supplier: ntext NULL
  sup_comment_for_interne: ntext NULL
  sty_id: int NOT NULL
  sup_abbreviation: nvarchar(100) NULL
  sup_login: nvarchar(500) NULL
  sup_password: nvarchar(2000) NULL
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Numeric
from sqlalchemy.orm import relationship
from app.models.base import Base


class Supplier(Base):
    """Maps to TM_SUP_Supplier table with actual DB column names."""
    __tablename__ = "TM_SUP_Supplier"

    # Primary key
    sup_id = Column("sup_id", Integer, primary_key=True, autoincrement=True)

    # Reference and name
    sup_ref = Column("sup_ref", String(50), nullable=True)
    sup_company_name = Column("sup_company_name", String(250), nullable=False)
    sup_abbreviation = Column("sup_abbreviation", String(100), nullable=True)

    # Foreign keys
    soc_id = Column("soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    sty_id = Column("sty_id", Integer, ForeignKey("TR_STY_Supplier_Type.sty_id"), nullable=False)
    cur_id = Column("cur_id", Integer, ForeignKey("TR_CUR_Currency.cur_id"), nullable=False)
    vat_id = Column("vat_id", Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)
    pco_id = Column("pco_id", Integer, ForeignKey("TR_PCO_Payment_Condition.pco_id"), nullable=False)
    pmo_id = Column("pmo_id", Integer, ForeignKey("TR_PMO_Payment_Mode.pmo_id"), nullable=False)
    usr_created_by = Column("usr_created_by", Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # VAT and registration
    sup_siren = Column("sup_siren", String(50), nullable=True)
    sup_siret = Column("sup_siret", String(50), nullable=True)
    sup_vat_intra = Column("sup_vat_intra", String(50), nullable=True)

    # Status
    sup_isactive = Column("sup_isactive", Boolean, nullable=False, default=True)
    sup_isblocked = Column("sup_isblocked", Boolean, nullable=False, default=False)

    # Timestamps
    sup_d_creation = Column("sup_d_creation", DateTime, nullable=False)
    sup_d_update = Column("sup_d_update", DateTime, nullable=False)

    # Address
    sup_address1 = Column("sup_address1", String(200), nullable=True)
    sup_address2 = Column("sup_address2", String(200), nullable=True)
    sup_postcode = Column("sup_postcode", String(50), nullable=True)
    sup_city = Column("sup_city", String(200), nullable=True)
    sup_country = Column("sup_country", String(200), nullable=True)
    sup_free_of_harbor = Column("sup_free_of_harbor", Integer, nullable=True)

    # Contact
    sup_tel1 = Column("sup_tel1", String(100), nullable=True)
    sup_tel2 = Column("sup_tel2", String(100), nullable=True)
    sup_fax = Column("sup_fax", String(100), nullable=True)
    sup_cellphone = Column("sup_cellphone", String(100), nullable=True)
    sup_email = Column("sup_email", String(100), nullable=True)
    sup_newsletter_email = Column("sup_newsletter_email", String(100), nullable=True)
    sup_recieve_newsletter = Column("sup_recieve_newsletter", Boolean, nullable=False, default=False)

    # Comments
    sup_comment_for_supplier = Column("sup_comment_for_supplier", Text, nullable=True)
    sup_comment_for_interne = Column("sup_comment_for_interne", Text, nullable=True)

    # Login (for supplier portal)
    sup_login = Column("sup_login", String(500), nullable=True)
    sup_password = Column("sup_password", String(2000), nullable=True)

    # Pricing relationships
    product_prices = relationship("SupplierProductPrice", back_populates="supplier", lazy="selectin")

    # Property aliases for API compatibility
    @property
    def id(self):
        return self.sup_id

    @property
    def reference(self):
        return self.sup_ref

    @property
    def name(self):
        return self.sup_company_name

    @property
    def email(self):
        return self.sup_email

    @property
    def phone(self):
        return self.sup_tel1

    @property
    def is_active(self):
        return self.sup_isactive


class SupplierProduct(Base):
    """Maps to TR_SPR_Supplier_Product - Link table between suppliers and products."""
    __tablename__ = "TR_SPR_Supplier_Product"

    spr_id = Column("spr_id", Integer, primary_key=True, autoincrement=True)
    sup_id = Column("sup_id", Integer, ForeignKey("TM_SUP_Supplier.sup_id"), nullable=False)
    prd_id = Column("prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=False)

    # Relationships
    supplier = relationship("Supplier")

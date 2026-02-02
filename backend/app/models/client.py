"""
Client model for SQLAlchemy.

Maps to TM_CLI_CLient table (note the casing: CLient).

Actual DB schema:
  cli_id: int NOT NULL [PK]
  cli_ref: nvarchar(50) NULL
  soc_id: int NOT NULL
  cli_company_name: nvarchar(250) NOT NULL
  vat_id: int NOT NULL
  pco_id: int NOT NULL
  pmo_id: int NOT NULL
  act_id: int NULL
  cli_siren: nvarchar(50) NULL
  cli_siret: nvarchar(50) NULL
  cli_vat_intra: nvarchar(50) NULL
  usr_created_by: int NOT NULL
  cty_id: int NOT NULL
  cur_id: int NOT NULL
  cli_isactive: bit NOT NULL
  cli_isblocked: bit NOT NULL
  cli_d_creation: datetime NOT NULL
  cli_d_update: datetime NOT NULL
  cli_address1: nvarchar(200) NULL
  cli_address2: nvarchar(200) NULL
  cli_postcode: nvarchar(50) NULL
  cli_city: nvarchar(200) NULL
  cli_country: nvarchar(200) NULL
  cli_free_of_harbor: int NULL
  cli_tel1: nvarchar(100) NULL
  cli_tel2: nvarchar(100) NULL
  cli_fax: nvarchar(100) NULL
  cli_cellphone: nvarchar(100) NULL
  cli_email: nvarchar(100) NULL
  cli_usr_com1: int NULL
  cli_usr_com2: int NULL
  cli_usr_com3: int NULL
  cli_recieve_newsletter: bit NOT NULL
  cli_newsletter_email: nvarchar(100) NULL
  cmu_id: int NULL
  cli_comment_for_client: ntext NULL
  cli_comment_for_interne: ntext NULL
  cli_invoice_day: int NULL
  cli_invoice_day_is_last_day: bit NULL
  cli_accounting_email: nvarchar(200) NULL
  cli_showdetail: bit NULL
  cli_abbreviation: nvarchar(300) NULL
  cli_pdf_version: nvarchar(20) NULL
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class Client(Base):
    """Maps to TM_CLI_CLient table (note the casing)."""
    __tablename__ = "TM_CLI_CLient"  # Exact casing from DB

    # Primary key
    cli_id = Column(Integer, primary_key=True, autoincrement=True)

    # Reference and name
    cli_ref = Column(String(50), nullable=True)
    cli_company_name = Column(String(250), nullable=False)
    cli_abbreviation = Column(String(300), nullable=True)

    # Society and type IDs - correct FK references
    soc_id = Column(Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False)
    cty_id = Column(Integer, ForeignKey("TR_CTY_Client_Type.cty_id"), nullable=False)
    act_id = Column(Integer, ForeignKey("TR_ACT_Activity.act_id"), nullable=True)

    # Financial IDs - correct FK references
    cur_id = Column(Integer, ForeignKey("TR_CUR_Currency.cur_id"), nullable=False)
    pco_id = Column(Integer, ForeignKey("TR_PCO_Payment_Condition.pco_id"), nullable=False)
    pmo_id = Column(Integer, ForeignKey("TR_PMO_Payment_Mode.pmo_id"), nullable=False)
    vat_id = Column(Integer, ForeignKey("TR_VAT_Vat.vat_id"), nullable=False)
    cmu_id = Column(Integer, ForeignKey("TR_CMU_Commune.cmu_id"), nullable=True)

    # VAT and registration
    cli_siren = Column(String(50), nullable=True)
    cli_siret = Column(String(50), nullable=True)
    cli_vat_intra = Column(String(50), nullable=True)

    # Status
    cli_isactive = Column(Boolean, nullable=False, default=True)
    cli_isblocked = Column(Boolean, nullable=False, default=False)

    # Timestamps
    cli_d_creation = Column(DateTime, nullable=False)
    cli_d_update = Column(DateTime, nullable=False)
    usr_created_by = Column(Integer, ForeignKey("TM_USR_User.usr_id"), nullable=False)

    # Address
    cli_address1 = Column(String(200), nullable=True)
    cli_address2 = Column(String(200), nullable=True)
    cli_postcode = Column(String(50), nullable=True)
    cli_city = Column(String(200), nullable=True)
    cli_country = Column(String(200), nullable=True)
    cli_free_of_harbor = Column(Integer, nullable=True)  # int, not boolean

    # Contact
    cli_tel1 = Column(String(100), nullable=True)
    cli_tel2 = Column(String(100), nullable=True)
    cli_fax = Column(String(100), nullable=True)
    cli_cellphone = Column(String(100), nullable=True)
    cli_email = Column(String(100), nullable=True)
    cli_accounting_email = Column(String(200), nullable=True)
    cli_newsletter_email = Column(String(100), nullable=True)
    cli_recieve_newsletter = Column(Boolean, nullable=False, default=False)

    # Commercial contacts - FK to users
    cli_usr_com1 = Column(Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    cli_usr_com2 = Column(Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)
    cli_usr_com3 = Column(Integer, ForeignKey("TM_USR_User.usr_id"), nullable=True)

    # Comments and notes
    cli_comment_for_client = Column(Text, nullable=True)
    cli_comment_for_interne = Column(Text, nullable=True)

    # Invoice settings
    cli_invoice_day = Column(Integer, nullable=True)
    cli_invoice_day_is_last_day = Column(Boolean, nullable=True)
    cli_showdetail = Column(Boolean, nullable=True)
    cli_pdf_version = Column(String(20), nullable=True)  # nvarchar, not int

    # Aliases for schema compatibility (Pydantic uses these)
    @property
    def cli_reference(self):
        return self.cli_ref
    
    @property
    def cli_is_active(self):
        return self.cli_isactive
    
    @property
    def cli_name(self):
        return self.cli_company_name
    
    @property
    def cli_phone(self):
        return self.cli_tel1
    
    @property
    def cli_address(self):
        return self.cli_address1
    
    @property
    def cli_postal_code(self):
        return self.cli_postcode
    
    @property
    def cli_created_at(self):
        return self.cli_d_creation
    
    @property
    def cli_updated_at(self):
        return self.cli_d_update
    
    @property
    def cli_type_id(self):
        return self.cty_id
    
    @property
    def cli_sta_id(self):
        return self.act_id  # or a default status

    # Relationships (commented out until FK tables verified)
    # invoices = relationship("ClientInvoice", back_populates="client")
    # orders = relationship("Order", back_populates="client")
    # client_orders = relationship("ClientOrder", back_populates="client")
    # cost_plans = relationship("CostPlan", back_populates="client")

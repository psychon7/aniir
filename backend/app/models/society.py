"""
Society model mapping to TR_SOC_Society table.

Actual DB schema:
  soc_id: int NOT NULL [PK]
  soc_society_name: nvarchar(500) NOT NULL
  soc_is_actived: bit NOT NULL
  cur_id: int NOT NULL
  lng_id: int NOT NULL
  soc_datebegin: datetime NULL
  soc_dateend: datetime NULL
  soc_short_label: nvarchar(50) NULL
  soc_address1: nvarchar(400) NULL
  soc_address2: nvarchar(400) NULL
  soc_postcode: nvarchar(400) NULL
  soc_city: nvarchar(400) NULL
  soc_tel: nvarchar(200) NULL
  soc_email: nvarchar(1000) NULL
  soc_siret: nvarchar(100) NULL
  ... (many more)
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import Integer, String, DateTime, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import relationship, Mapped, mapped_column

from app.models.base import Base


class Society(Base):
    """
    Society model for company/legal entity management.
    Maps to TR_SOC_Society table.
    """
    __tablename__ = "TR_SOC_Society"

    # Primary Key
    soc_id: Mapped[int] = mapped_column("soc_id", Integer, primary_key=True, autoincrement=True)

    # Basic Info
    soc_society_name: Mapped[str] = mapped_column("soc_society_name", String(500), nullable=False)
    soc_short_label: Mapped[Optional[str]] = mapped_column("soc_short_label", String(50), nullable=True)

    # Foreign Keys
    cur_id: Mapped[int] = mapped_column("cur_id", Integer, ForeignKey("TR_CUR_Currency.cur_id"), nullable=False)
    lng_id: Mapped[int] = mapped_column("lng_id", Integer, ForeignKey("TR_LNG_Language.lng_id"), nullable=False)

    # Status
    soc_is_actived: Mapped[bool] = mapped_column("soc_is_actived", Boolean, nullable=False, default=True)

    # Dates
    soc_datebegin: Mapped[Optional[datetime]] = mapped_column("soc_datebegin", DateTime, nullable=True)
    soc_dateend: Mapped[Optional[datetime]] = mapped_column("soc_dateend", DateTime, nullable=True)
    soc_client_datebegin: Mapped[Optional[datetime]] = mapped_column("soc_client_datebegin", DateTime, nullable=True)
    soc_client_dateend: Mapped[Optional[datetime]] = mapped_column("soc_client_dateend", DateTime, nullable=True)

    # Address
    soc_address1: Mapped[Optional[str]] = mapped_column("soc_address1", String(400), nullable=True)
    soc_address2: Mapped[Optional[str]] = mapped_column("soc_address2", String(400), nullable=True)
    soc_postcode: Mapped[Optional[str]] = mapped_column("soc_postcode", String(400), nullable=True)
    soc_city: Mapped[Optional[str]] = mapped_column("soc_city", String(400), nullable=True)
    soc_county: Mapped[Optional[str]] = mapped_column("soc_county", String(400), nullable=True)

    # Contact
    soc_tel: Mapped[Optional[str]] = mapped_column("soc_tel", String(200), nullable=True)
    soc_fax: Mapped[Optional[str]] = mapped_column("soc_fax", String(100), nullable=True)
    soc_cellphone: Mapped[Optional[str]] = mapped_column("soc_cellphone", String(200), nullable=True)
    soc_email: Mapped[Optional[str]] = mapped_column("soc_email", String(1000), nullable=True)
    soc_site: Mapped[Optional[str]] = mapped_column("soc_site", String(200), nullable=True)

    # Tax/Legal Info
    soc_siret: Mapped[Optional[str]] = mapped_column("soc_siret", String(100), nullable=True)
    soc_rcs: Mapped[Optional[str]] = mapped_column("soc_rcs", String(100), nullable=True)
    soc_tva_intra: Mapped[Optional[str]] = mapped_column("soc_tva_intra", String(100), nullable=True)
    soc_capital: Mapped[Optional[str]] = mapped_column("soc_capital", String(1000), nullable=True)

    # Primary bank/RIB
    soc_rib_name: Mapped[Optional[str]] = mapped_column("soc_rib_name", String(500), nullable=True)
    soc_rib_address: Mapped[Optional[str]] = mapped_column("soc_rib_address", String(1000), nullable=True)
    soc_rib_code_iban: Mapped[Optional[str]] = mapped_column("soc_rib_code_iban", String(1000), nullable=True)
    soc_rib_code_bic: Mapped[Optional[str]] = mapped_column("soc_rib_code_bic", String(1000), nullable=True)
    soc_rib_bank_code: Mapped[Optional[str]] = mapped_column("soc_rib_bank_code", String(50), nullable=True)
    soc_rib_agence_code: Mapped[Optional[str]] = mapped_column("soc_rib_agence_code", String(50), nullable=True)
    soc_rib_account_number: Mapped[Optional[str]] = mapped_column("soc_rib_account_number", String(50), nullable=True)
    soc_rib_key: Mapped[Optional[str]] = mapped_column("soc_rib_key", String(50), nullable=True)
    soc_rib_domiciliation_agency: Mapped[Optional[str]] = mapped_column("soc_rib_domiciliation_agency", String(200), nullable=True)
    soc_rib_abbre: Mapped[Optional[str]] = mapped_column("soc_rib_abbre", String(50), nullable=True)

    # Secondary bank/RIB
    soc_rib_name_2: Mapped[Optional[str]] = mapped_column("soc_rib_name_2", String(500), nullable=True)
    soc_rib_address_2: Mapped[Optional[str]] = mapped_column("soc_rib_address_2", String(1000), nullable=True)
    soc_rib_code_iban_2: Mapped[Optional[str]] = mapped_column("soc_rib_code_iban_2", String(1000), nullable=True)
    soc_rib_code_bic_2: Mapped[Optional[str]] = mapped_column("soc_rib_code_bic_2", String(1000), nullable=True)
    soc_rib_bank_code_2: Mapped[Optional[str]] = mapped_column("soc_rib_bank_code_2", String(50), nullable=True)
    soc_rib_agence_code_2: Mapped[Optional[str]] = mapped_column("soc_rib_agence_code_2", String(50), nullable=True)
    soc_rib_account_number_2: Mapped[Optional[str]] = mapped_column("soc_rib_account_number_2", String(50), nullable=True)
    soc_rib_key_2: Mapped[Optional[str]] = mapped_column("soc_rib_key_2", String(50), nullable=True)
    soc_rib_domiciliation_agency_2: Mapped[Optional[str]] = mapped_column("soc_rib_domiciliation_agency_2", String(200), nullable=True)
    soc_rib_abbre_2: Mapped[Optional[str]] = mapped_column("soc_rib_abbre_2", String(50), nullable=True)

    # Document template settings
    soc_quote_header_text: Mapped[Optional[str]] = mapped_column("soc_quote_header_text", String(4000), nullable=True)
    soc_quote_footer_text: Mapped[Optional[str]] = mapped_column("soc_quote_footer_text", String(4000), nullable=True)
    soc_delivery_conditions_text: Mapped[Optional[str]] = mapped_column("soc_delivery_conditions_text", String(4000), nullable=True)
    soc_invoice_penalty_text: Mapped[Optional[str]] = mapped_column("soc_invoice_penalty_text", String(4000), nullable=True)
    soc_invoice_early_payment_discount_text: Mapped[Optional[str]] = mapped_column("soc_invoice_early_payment_discount_text", String(4000), nullable=True)
    soc_invoice_email_body: Mapped[Optional[str]] = mapped_column("soc_invoice_email_body", String(4000), nullable=True)

    # Pricing settings
    soc_pricing_coefficient_sod_cin: Mapped[Optional[float]] = mapped_column(
        "soc_pricing_coefficient_sod_cin", Numeric(18, 4), nullable=True
    )

    # Flags
    soc_email_auto: Mapped[Optional[bool]] = mapped_column("soc_email_auto", Boolean, nullable=True)
    soc_mask_commission: Mapped[Optional[bool]] = mapped_column("soc_mask_commission", Boolean, nullable=True)
    soc_dp_upd: Mapped[bool] = mapped_column("soc_dp_upd", Boolean, nullable=False, default=False)

    # Relationships
    users = relationship("User", back_populates="society", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Society(soc_id={self.soc_id}, name='{self.soc_society_name}')>"

    # Property aliases for API compatibility
    @property
    def id(self) -> int:
        return self.soc_id

    @property
    def name(self) -> str:
        return self.soc_society_name

    @property
    def is_active(self) -> bool:
        return self.soc_is_actived

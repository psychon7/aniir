"""
Pydantic schemas for Society API requests and responses.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Bank Info Schema
# ==========================================================================

class BankInfoSchema(BaseModel):
    """Schema for bank account information."""
    name: Optional[str] = Field(None, description="Account holder name")
    address: Optional[str] = Field(None, description="Bank address")
    iban: Optional[str] = Field(None, description="IBAN code")
    bic: Optional[str] = Field(None, description="BIC/SWIFT code")
    bank_code: Optional[str] = Field(None, description="Bank code")
    agency_code: Optional[str] = Field(None, description="Agency code")
    account_number: Optional[str] = Field(None, description="Account number")
    key: Optional[str] = Field(None, description="RIB key")
    domiciliation: Optional[str] = Field(None, description="Domiciliation agency")
    abbreviation: Optional[str] = Field(None, description="Bank abbreviation")


# ==========================================================================
# Society Base Schemas
# ==========================================================================

class SocietyBase(BaseModel):
    """Base schema for Society."""
    soc_society_name: str = Field(..., max_length=500, description="Society/Company name")
    soc_is_actived: bool = Field(default=True, description="Is society active")
    soc_short_label: Optional[str] = Field(None, max_length=50, description="Short label")
    soc_capital: Optional[str] = Field(None, max_length=1000, description="Capital")
    cur_id: int = Field(..., description="Currency ID")
    lng_id: int = Field(..., description="Language ID")


class SocietyCreate(SocietyBase):
    """Schema for creating a Society."""
    # Contact Info
    soc_address1: Optional[str] = Field(None, max_length=400)
    soc_address2: Optional[str] = Field(None, max_length=400)
    soc_postcode: Optional[str] = Field(None, max_length=400)
    soc_city: Optional[str] = Field(None, max_length=400)
    soc_county: Optional[str] = Field(None, max_length=400)
    soc_tel: Optional[str] = Field(None, max_length=200)
    soc_fax: Optional[str] = Field(None, max_length=100)
    soc_cellphone: Optional[str] = Field(None, max_length=200)
    soc_email: Optional[str] = Field(None, max_length=1000)
    soc_site: Optional[str] = Field(None, max_length=200)

    # Legal/Tax Info
    soc_siret: Optional[str] = Field(None, max_length=100)
    soc_rcs: Optional[str] = Field(None, max_length=100)
    soc_tva_intra: Optional[str] = Field(None, max_length=100)
    soc_cnss: Optional[str] = Field(None, max_length=200)
    soc_taxe_pro: Optional[str] = Field(None, max_length=200)

    # Settings
    soc_email_auto: Optional[bool] = Field(None)
    soc_mask_commission: Optional[bool] = Field(None)
    soc_dp_upd: bool = Field(default=True)
    soc_is_prd_mandatory: Optional[bool] = Field(None)
    soc_show_language_bar: Optional[bool] = Field(default=False)
    soc_cin_lgs: Optional[bool] = Field(None)


class SocietyUpdate(BaseModel):
    """Schema for updating a Society."""
    soc_society_name: Optional[str] = Field(None, max_length=500)
    soc_is_actived: Optional[bool] = None
    soc_short_label: Optional[str] = Field(None, max_length=50)
    soc_capital: Optional[str] = Field(None, max_length=1000)
    cur_id: Optional[int] = None
    lng_id: Optional[int] = None

    # Contact Info
    soc_address1: Optional[str] = Field(None, max_length=400)
    soc_address2: Optional[str] = Field(None, max_length=400)
    soc_postcode: Optional[str] = Field(None, max_length=400)
    soc_city: Optional[str] = Field(None, max_length=400)
    soc_county: Optional[str] = Field(None, max_length=400)
    soc_tel: Optional[str] = Field(None, max_length=200)
    soc_fax: Optional[str] = Field(None, max_length=100)
    soc_cellphone: Optional[str] = Field(None, max_length=200)
    soc_email: Optional[str] = Field(None, max_length=1000)
    soc_site: Optional[str] = Field(None, max_length=200)

    # Legal/Tax Info
    soc_siret: Optional[str] = Field(None, max_length=100)
    soc_rcs: Optional[str] = Field(None, max_length=100)
    soc_tva_intra: Optional[str] = Field(None, max_length=100)
    soc_cnss: Optional[str] = Field(None, max_length=200)
    soc_taxe_pro: Optional[str] = Field(None, max_length=200)

    # Settings
    soc_email_auto: Optional[bool] = None
    soc_mask_commission: Optional[bool] = None
    soc_dp_upd: Optional[bool] = None
    soc_is_prd_mandatory: Optional[bool] = None
    soc_show_language_bar: Optional[bool] = None
    soc_cin_lgs: Optional[bool] = None


class SocietyResponse(SocietyBase):
    """Schema for Society response."""
    model_config = ConfigDict(from_attributes=True)

    soc_id: int = Field(..., description="Society ID")

    # Date filters
    soc_datebegin: Optional[datetime] = Field(None, description="Supplier invoice date begin")
    soc_dateend: Optional[datetime] = Field(None, description="Supplier invoice date end")
    soc_client_datebegin: Optional[datetime] = Field(None, description="Client invoice date begin")
    soc_client_dateend: Optional[datetime] = Field(None, description="Client invoice date end")

    # Contact Info
    soc_address1: Optional[str] = None
    soc_address2: Optional[str] = None
    soc_postcode: Optional[str] = None
    soc_city: Optional[str] = None
    soc_county: Optional[str] = None
    soc_tel: Optional[str] = None
    soc_fax: Optional[str] = None
    soc_cellphone: Optional[str] = None
    soc_email: Optional[str] = None
    soc_site: Optional[str] = None

    # Legal/Tax Info
    soc_siret: Optional[str] = None
    soc_rcs: Optional[str] = None
    soc_tva_intra: Optional[str] = None
    soc_cnss: Optional[str] = None
    soc_taxe_pro: Optional[str] = None

    # Bank Account Info (Primary)
    soc_rib_name: Optional[str] = None
    soc_rib_address: Optional[str] = None
    soc_rib_code_iban: Optional[str] = None
    soc_rib_code_bic: Optional[str] = None
    soc_rib_bank_code: Optional[str] = None
    soc_rib_agence_code: Optional[str] = None
    soc_rib_account_number: Optional[str] = None
    soc_rib_key: Optional[str] = None
    soc_rib_domiciliation_agency: Optional[str] = None
    soc_rib_abbre: Optional[str] = None

    # Bank Account Info (Secondary)
    soc_rib_name_2: Optional[str] = None
    soc_rib_address_2: Optional[str] = None
    soc_rib_code_iban_2: Optional[str] = None
    soc_rib_code_bic_2: Optional[str] = None
    soc_rib_bank_code_2: Optional[str] = None
    soc_rib_agence_code_2: Optional[str] = None
    soc_rib_account_number_2: Optional[str] = None
    soc_rib_key_2: Optional[str] = None
    soc_rib_domiciliation_agency_2: Optional[str] = None
    soc_rib_abbre_2: Optional[str] = None

    # Settings/Flags
    soc_email_auto: Optional[bool] = None
    soc_mask_commission: Optional[bool] = None
    soc_dp_upd: bool = True
    soc_is_prd_mandatory: Optional[bool] = None
    soc_show_language_bar: Optional[bool] = None
    soc_cin_lgs: Optional[bool] = None


class SocietyDetailResponse(SocietyResponse):
    """Detailed Society response with computed fields."""

    @computed_field
    @property
    def display_name(self) -> str:
        """Get society's display name."""
        return self.soc_short_label or self.soc_society_name

    @computed_field
    @property
    def full_address(self) -> str:
        """Get society's full address."""
        parts = [
            self.soc_address1,
            self.soc_address2,
            self.soc_postcode,
            self.soc_city,
            self.soc_county
        ]
        return ", ".join(p for p in parts if p)

    @computed_field
    @property
    def primary_bank_info(self) -> BankInfoSchema:
        """Get primary bank account information."""
        return BankInfoSchema(
            name=self.soc_rib_name,
            address=self.soc_rib_address,
            iban=self.soc_rib_code_iban,
            bic=self.soc_rib_code_bic,
            bank_code=self.soc_rib_bank_code,
            agency_code=self.soc_rib_agence_code,
            account_number=self.soc_rib_account_number,
            key=self.soc_rib_key,
            domiciliation=self.soc_rib_domiciliation_agency,
            abbreviation=self.soc_rib_abbre,
        )

    @computed_field
    @property
    def secondary_bank_info(self) -> BankInfoSchema:
        """Get secondary bank account information."""
        return BankInfoSchema(
            name=self.soc_rib_name_2,
            address=self.soc_rib_address_2,
            iban=self.soc_rib_code_iban_2,
            bic=self.soc_rib_code_bic_2,
            bank_code=self.soc_rib_bank_code_2,
            agency_code=self.soc_rib_agence_code_2,
            account_number=self.soc_rib_account_number_2,
            key=self.soc_rib_key_2,
            domiciliation=self.soc_rib_domiciliation_agency_2,
            abbreviation=self.soc_rib_abbre_2,
        )


class SocietyListResponse(BaseModel):
    """Schema for listing societies (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    soc_id: int = Field(..., description="Society ID")
    soc_society_name: str = Field(..., description="Society name")
    soc_short_label: Optional[str] = Field(None, description="Short label")
    soc_is_actived: bool = Field(..., description="Is active")
    soc_city: Optional[str] = Field(None, description="City")
    soc_email: Optional[str] = Field(None, description="Email")
    cur_id: int = Field(..., description="Currency ID")
    lng_id: int = Field(..., description="Language ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get society's display name."""
        return self.soc_short_label or self.soc_society_name


# ==========================================================================
# Society Bank Account Update Schemas
# ==========================================================================

class SocietyBankAccountUpdate(BaseModel):
    """Schema for updating primary bank account."""
    soc_rib_name: Optional[str] = Field(None, max_length=500)
    soc_rib_address: Optional[str] = Field(None, max_length=1000)
    soc_rib_code_iban: Optional[str] = Field(None, max_length=1000)
    soc_rib_code_bic: Optional[str] = Field(None, max_length=1000)
    soc_rib_bank_code: Optional[str] = Field(None, max_length=50)
    soc_rib_agence_code: Optional[str] = Field(None, max_length=50)
    soc_rib_account_number: Optional[str] = Field(None, max_length=50)
    soc_rib_key: Optional[str] = Field(None, max_length=50)
    soc_rib_domiciliation_agency: Optional[str] = Field(None, max_length=200)
    soc_rib_abbre: Optional[str] = Field(None, max_length=50)


class SocietySecondaryBankAccountUpdate(BaseModel):
    """Schema for updating secondary bank account."""
    soc_rib_name_2: Optional[str] = Field(None, max_length=50)
    soc_rib_address_2: Optional[str] = Field(None, max_length=200)
    soc_rib_code_iban_2: Optional[str] = Field(None, max_length=50)
    soc_rib_code_bic_2: Optional[str] = Field(None, max_length=50)
    soc_rib_bank_code_2: Optional[str] = Field(None, max_length=50)
    soc_rib_agence_code_2: Optional[str] = Field(None, max_length=50)
    soc_rib_account_number_2: Optional[str] = Field(None, max_length=50)
    soc_rib_key_2: Optional[str] = Field(None, max_length=50)
    soc_rib_domiciliation_agency_2: Optional[str] = Field(None, max_length=200)
    soc_rib_abbre_2: Optional[str] = Field(None, max_length=50)


# ==========================================================================
# Settings Response Schema (camelCase for frontend)
# ==========================================================================

class SocietySettingsResponse(BaseModel):
    """
    Schema for enterprise settings response - camelCase output for frontend.
    Used for GET /settings/enterprise endpoint.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="soc_id", description="Society ID")
    companyName: str = Field(..., validation_alias="soc_society_name", description="Company name")
    shortLabel: Optional[str] = Field(None, validation_alias="soc_short_label", description="Short label")
    currencyId: int = Field(..., validation_alias="cur_id", description="Currency ID")
    languageId: int = Field(..., validation_alias="lng_id", description="Language ID")
    isActive: bool = Field(..., validation_alias="soc_is_actived", description="Is active")

    # Address
    address1: Optional[str] = Field(None, validation_alias="soc_address1", description="Address line 1")
    address2: Optional[str] = Field(None, validation_alias="soc_address2", description="Address line 2")
    postcode: Optional[str] = Field(None, validation_alias="soc_postcode", description="Postal code")
    city: Optional[str] = Field(None, validation_alias="soc_city", description="City")
    county: Optional[str] = Field(None, validation_alias="soc_county", description="County/Region")

    # Contact
    phone: Optional[str] = Field(None, validation_alias="soc_tel", description="Phone")
    fax: Optional[str] = Field(None, validation_alias="soc_fax", description="Fax")
    cellphone: Optional[str] = Field(None, validation_alias="soc_cellphone", description="Mobile")
    email: Optional[str] = Field(None, validation_alias="soc_email", description="Email")
    website: Optional[str] = Field(None, validation_alias="soc_site", description="Website")

    # Legal/Tax
    siret: Optional[str] = Field(None, validation_alias="soc_siret", description="SIRET")
    rcs: Optional[str] = Field(None, validation_alias="soc_rcs", description="RCS")
    vatIntra: Optional[str] = Field(None, validation_alias="soc_tva_intra", description="Intra-community VAT")
    capital: Optional[str] = Field(None, validation_alias="soc_capital", description="Share capital")

    # Flags
    emailAuto: Optional[bool] = Field(None, validation_alias="soc_email_auto", description="Auto email")
    maskCommission: Optional[bool] = Field(None, validation_alias="soc_mask_commission", description="Mask commission")

    # Primary bank/RIB
    ribName: Optional[str] = Field(None, validation_alias="soc_rib_name", description="Primary bank account name")
    ribAddress: Optional[str] = Field(None, validation_alias="soc_rib_address", description="Primary bank address")
    ribIban: Optional[str] = Field(None, validation_alias="soc_rib_code_iban", description="Primary IBAN")
    ribBic: Optional[str] = Field(None, validation_alias="soc_rib_code_bic", description="Primary BIC/SWIFT")
    ribBankCode: Optional[str] = Field(None, validation_alias="soc_rib_bank_code", description="Primary bank code")
    ribAgencyCode: Optional[str] = Field(None, validation_alias="soc_rib_agence_code", description="Primary agency code")
    ribAccountNumber: Optional[str] = Field(None, validation_alias="soc_rib_account_number", description="Primary account number")
    ribKey: Optional[str] = Field(None, validation_alias="soc_rib_key", description="Primary RIB key")
    ribDomiciliationAgency: Optional[str] = Field(None, validation_alias="soc_rib_domiciliation_agency", description="Primary domiciliation agency")
    ribAbbreviation: Optional[str] = Field(None, validation_alias="soc_rib_abbre", description="Primary bank abbreviation")

    # Secondary bank/RIB
    ribName2: Optional[str] = Field(None, validation_alias="soc_rib_name_2", description="Secondary bank account name")
    ribAddress2: Optional[str] = Field(None, validation_alias="soc_rib_address_2", description="Secondary bank address")
    ribIban2: Optional[str] = Field(None, validation_alias="soc_rib_code_iban_2", description="Secondary IBAN")
    ribBic2: Optional[str] = Field(None, validation_alias="soc_rib_code_bic_2", description="Secondary BIC/SWIFT")
    ribBankCode2: Optional[str] = Field(None, validation_alias="soc_rib_bank_code_2", description="Secondary bank code")
    ribAgencyCode2: Optional[str] = Field(None, validation_alias="soc_rib_agence_code_2", description="Secondary agency code")
    ribAccountNumber2: Optional[str] = Field(None, validation_alias="soc_rib_account_number_2", description="Secondary account number")
    ribKey2: Optional[str] = Field(None, validation_alias="soc_rib_key_2", description="Secondary RIB key")
    ribDomiciliationAgency2: Optional[str] = Field(None, validation_alias="soc_rib_domiciliation_agency_2", description="Secondary domiciliation agency")
    ribAbbreviation2: Optional[str] = Field(None, validation_alias="soc_rib_abbre_2", description="Secondary bank abbreviation")

    @computed_field
    @property
    def fullAddress(self) -> Optional[str]:
        """Get formatted full address."""
        parts = []
        if self.address1:
            parts.append(self.address1)
        if self.address2:
            parts.append(self.address2)
        if self.postcode or self.city:
            city_line = " ".join(filter(None, [self.postcode, self.city]))
            if city_line:
                parts.append(city_line)
        if self.county:
            parts.append(self.county)
        return ", ".join(parts) if parts else None

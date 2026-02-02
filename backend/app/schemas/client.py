"""
Pydantic schemas for Client API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field, EmailStr


# ==========================================================================
# Client Base Schemas
# ==========================================================================

class ClientBase(BaseModel):
    """Base schema for Client."""
    cli_company_name: Optional[str] = Field(
        None,
        max_length=200,
        description="Company name"
    )
    cli_first_name: Optional[str] = Field(
        None,
        max_length=50,
        description="Contact first name"
    )
    cli_last_name: Optional[str] = Field(
        None,
        max_length=50,
        description="Contact last name"
    )
    cli_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )
    cli_phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Phone number"
    )
    cli_mobile: Optional[str] = Field(
        None,
        max_length=30,
        description="Mobile phone number"
    )
    cli_address: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 1"
    )
    cli_address2: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 2"
    )
    cli_postal_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Postal code"
    )
    cli_city: Optional[str] = Field(
        None,
        max_length=100,
        description="City"
    )
    cli_country_id: Optional[int] = Field(
        None,
        description="Country ID (FK to TR_COU_Country)"
    )
    cli_vat_number: Optional[str] = Field(
        None,
        max_length=50,
        description="VAT number"
    )
    cli_siret: Optional[str] = Field(
        None,
        max_length=50,
        description="SIRET number (French company ID)"
    )
    cli_website: Optional[str] = Field(
        None,
        max_length=200,
        description="Website URL"
    )
    cli_type_id: Optional[int] = Field(
        None,
        description="Client type ID (FK to TR_CT_ClientType)"
    )
    cli_sta_id: Optional[int] = Field(
        None,
        description="Status ID (FK to TR_STA_Status)"
    )
    cli_cur_id: Optional[int] = Field(
        None,
        description="Currency ID (FK to TR_CUR_Currency)"
    )
    cli_pay_mode_id: Optional[int] = Field(
        None,
        description="Payment mode ID (FK to TR_PAY_PaymentMode)"
    )
    cli_pay_term_id: Optional[int] = Field(
        None,
        description="Payment term ID (FK to TR_PAY_PaymentTerm)"
    )
    cli_credit_limit: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Credit limit"
    )
    cli_discount: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Default discount percentage"
    )
    cli_bu_id: Optional[int] = Field(
        None,
        description="Business unit ID (FK to TR_BU_BusinessUnit)"
    )
    cli_soc_id: Optional[int] = Field(
        None,
        description="Society ID (FK to TR_SOC_Society)"
    )
    cli_lang_id: Optional[int] = Field(
        None,
        description="Language ID (FK to TR_LAN_Language)"
    )
    cli_notes: Optional[str] = Field(
        None,
        description="Notes"
    )
    cli_is_active: bool = Field(
        True,
        description="Whether the client is active"
    )


class ClientCreate(ClientBase):
    """Schema for creating a Client."""
    pass


class ClientUpdate(BaseModel):
    """Schema for updating a Client (all fields optional)."""
    cli_company_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=200,
        description="Company name"
    )
    cli_first_name: Optional[str] = Field(
        None,
        max_length=50,
        description="Contact first name"
    )
    cli_last_name: Optional[str] = Field(
        None,
        max_length=50,
        description="Contact last name"
    )
    cli_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )
    cli_phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Phone number"
    )
    cli_mobile: Optional[str] = Field(
        None,
        max_length=30,
        description="Mobile phone number"
    )
    cli_address: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 1"
    )
    cli_address2: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 2"
    )
    cli_postal_code: Optional[str] = Field(
        None,
        max_length=20,
        description="Postal code"
    )
    cli_city: Optional[str] = Field(
        None,
        max_length=100,
        description="City"
    )
    cli_country_id: Optional[int] = Field(
        None,
        description="Country ID (FK to TR_COU_Country)"
    )
    cli_vat_number: Optional[str] = Field(
        None,
        max_length=50,
        description="VAT number"
    )
    cli_siret: Optional[str] = Field(
        None,
        max_length=50,
        description="SIRET number (French company ID)"
    )
    cli_website: Optional[str] = Field(
        None,
        max_length=200,
        description="Website URL"
    )
    cli_type_id: Optional[int] = Field(
        None,
        description="Client type ID (FK to TR_CT_ClientType)"
    )
    cli_sta_id: Optional[int] = Field(
        None,
        description="Status ID (FK to TR_STA_Status)"
    )
    cli_cur_id: Optional[int] = Field(
        None,
        description="Currency ID (FK to TR_CUR_Currency)"
    )
    cli_pay_mode_id: Optional[int] = Field(
        None,
        description="Payment mode ID (FK to TR_PAY_PaymentMode)"
    )
    cli_pay_term_id: Optional[int] = Field(
        None,
        description="Payment term ID (FK to TR_PAY_PaymentTerm)"
    )
    cli_credit_limit: Optional[Decimal] = Field(
        None,
        ge=0,
        description="Credit limit"
    )
    cli_discount: Optional[Decimal] = Field(
        None,
        ge=0,
        le=100,
        description="Default discount percentage"
    )
    cli_bu_id: Optional[int] = Field(
        None,
        description="Business unit ID (FK to TR_BU_BusinessUnit)"
    )
    cli_soc_id: Optional[int] = Field(
        None,
        description="Society ID (FK to TR_SOC_Society)"
    )
    cli_lang_id: Optional[int] = Field(
        None,
        description="Language ID (FK to TR_LAN_Language)"
    )
    cli_notes: Optional[str] = Field(
        None,
        description="Notes"
    )
    cli_is_active: Optional[bool] = Field(
        None,
        description="Whether the client is active"
    )


class ClientResponse(ClientBase):
    """Schema for Client response."""
    model_config = ConfigDict(from_attributes=True)

    cli_id: int = Field(..., description="Client ID")
    cli_reference: Optional[str] = Field(None, description="Client reference")
    cli_created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    cli_updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    cli_created_by: Optional[int] = Field(None, description="Created by user ID")
    cli_updated_by: Optional[int] = Field(None, description="Updated by user ID")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get client's display name."""
        return self.cli_company_name

    @computed_field
    @property
    def full_contact_name(self) -> Optional[str]:
        """Get full contact name."""
        if self.cli_first_name and self.cli_last_name:
            return f"{self.cli_first_name} {self.cli_last_name}"
        return self.cli_first_name or self.cli_last_name

    @computed_field
    @property
    def full_address(self) -> Optional[str]:
        """Get formatted full address."""
        parts = []
        if self.cli_address:
            parts.append(self.cli_address)
        if self.cli_address2:
            parts.append(self.cli_address2)
        if self.cli_postal_code or self.cli_city:
            city_line = " ".join(filter(None, [self.cli_postal_code, self.cli_city]))
            if city_line:
                parts.append(city_line)
        return ", ".join(parts) if parts else None


class ClientListResponse(BaseModel):
    """Schema for listing clients (lightweight) - camelCase output for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Map DB columns (cli_*) to frontend camelCase fields using validation_alias
    # validation_alias is used for INPUT (ORM parsing), field name is used for OUTPUT (JSON)
    id: int = Field(..., validation_alias="cli_id", description="Client ID")
    reference: Optional[str] = Field(None, validation_alias="cli_reference", description="Client reference")
    companyName: Optional[str] = Field(None, validation_alias="cli_company_name", description="Company name")
    email: Optional[str] = Field(None, validation_alias="cli_email", description="Email address")
    phone: Optional[str] = Field(None, validation_alias="cli_phone", description="Phone number")
    city: Optional[str] = Field(None, validation_alias="cli_city", description="City")
    statusId: Optional[int] = Field(None, validation_alias="cli_sta_id", description="Status ID")
    clientTypeId: Optional[int] = Field(None, validation_alias="cli_type_id", description="Client type ID")
    isActive: Optional[bool] = Field(None, validation_alias="cli_is_active", description="Whether the client is active")
    createdAt: Optional[datetime] = Field(None, validation_alias="cli_created_at", description="Creation timestamp")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get client's display name."""
        return self.companyName or ""


class ClientDetailResponse(BaseModel):
    """
    Schema for client detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /clients/{client_id} endpoint.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="cli_id", description="Client ID")
    reference: Optional[str] = Field(None, validation_alias="cli_ref", description="Client reference")
    companyName: str = Field(..., validation_alias="cli_company_name", description="Company name")
    abbreviation: Optional[str] = Field(None, validation_alias="cli_abbreviation", description="Company abbreviation")

    # Status and type IDs
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    clientTypeId: int = Field(..., validation_alias="cty_id", description="Client type ID")
    activityId: Optional[int] = Field(None, validation_alias="act_id", description="Activity ID")

    # Financial IDs
    currencyId: int = Field(..., validation_alias="cur_id", description="Currency ID")
    paymentConditionId: int = Field(..., validation_alias="pco_id", description="Payment condition ID")
    paymentModeId: int = Field(..., validation_alias="pmo_id", description="Payment mode ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT ID")
    communeId: Optional[int] = Field(None, validation_alias="cmu_id", description="Commune ID")

    # VAT and registration
    siren: Optional[str] = Field(None, validation_alias="cli_siren", description="SIREN number")
    siret: Optional[str] = Field(None, validation_alias="cli_siret", description="SIRET number")
    vatIntra: Optional[str] = Field(None, validation_alias="cli_vat_intra", description="Intra-community VAT number")

    # Status flags
    isActive: bool = Field(..., validation_alias="cli_isactive", description="Whether the client is active")
    isBlocked: bool = Field(..., validation_alias="cli_isblocked", description="Whether the client is blocked")

    # Timestamps
    createdAt: Optional[datetime] = Field(None, validation_alias="cli_d_creation", description="Creation timestamp")
    updatedAt: Optional[datetime] = Field(None, validation_alias="cli_d_update", description="Last update timestamp")
    createdBy: int = Field(..., validation_alias="usr_created_by", description="Created by user ID")

    # Address
    address1: Optional[str] = Field(None, validation_alias="cli_address1", description="Address line 1")
    address2: Optional[str] = Field(None, validation_alias="cli_address2", description="Address line 2")
    postcode: Optional[str] = Field(None, validation_alias="cli_postcode", description="Postal code")
    city: Optional[str] = Field(None, validation_alias="cli_city", description="City")
    country: Optional[str] = Field(None, validation_alias="cli_country", description="Country")
    freeOfHarbor: Optional[int] = Field(None, validation_alias="cli_free_of_harbor", description="Free of harbor flag")

    # Contact information
    phone: Optional[str] = Field(None, validation_alias="cli_tel1", description="Primary phone")
    phone2: Optional[str] = Field(None, validation_alias="cli_tel2", description="Secondary phone")
    fax: Optional[str] = Field(None, validation_alias="cli_fax", description="Fax number")
    mobile: Optional[str] = Field(None, validation_alias="cli_cellphone", description="Mobile phone")
    email: Optional[str] = Field(None, validation_alias="cli_email", description="Email address")
    accountingEmail: Optional[str] = Field(None, validation_alias="cli_accounting_email", description="Accounting email")
    newsletterEmail: Optional[str] = Field(None, validation_alias="cli_newsletter_email", description="Newsletter email")
    receiveNewsletter: bool = Field(False, validation_alias="cli_recieve_newsletter", description="Receive newsletter flag")

    # Commercial contacts (user IDs)
    commercialUser1Id: Optional[int] = Field(None, validation_alias="cli_usr_com1", description="Commercial user 1 ID")
    commercialUser2Id: Optional[int] = Field(None, validation_alias="cli_usr_com2", description="Commercial user 2 ID")
    commercialUser3Id: Optional[int] = Field(None, validation_alias="cli_usr_com3", description="Commercial user 3 ID")

    # Comments and notes
    commentForClient: Optional[str] = Field(None, validation_alias="cli_comment_for_client", description="Comment visible to client")
    commentInternal: Optional[str] = Field(None, validation_alias="cli_comment_for_interne", description="Internal comment")

    # Invoice settings
    invoiceDay: Optional[int] = Field(None, validation_alias="cli_invoice_day", description="Invoice day of month")
    invoiceDayIsLastDay: Optional[bool] = Field(None, validation_alias="cli_invoice_day_is_last_day", description="Invoice on last day of month")
    showDetail: Optional[bool] = Field(None, validation_alias="cli_showdetail", description="Show detail on invoices")
    pdfVersion: Optional[str] = Field(None, validation_alias="cli_pdf_version", description="PDF version")

    # =====================================================
    # Resolved lookup names (populated by service layer)
    # These are not from the ORM directly but enriched data
    # =====================================================
    societyName: Optional[str] = Field(None, description="Resolved society name")
    clientTypeName: Optional[str] = Field(None, description="Resolved client type name")
    currencyCode: Optional[str] = Field(None, description="Resolved currency code/designation")
    currencySymbol: Optional[str] = Field(None, description="Resolved currency symbol")
    paymentModeName: Optional[str] = Field(None, description="Resolved payment mode name")
    paymentConditionName: Optional[str] = Field(None, description="Resolved payment condition name")
    paymentTermDays: Optional[int] = Field(None, description="Payment term total days")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get client's display name."""
        return self.companyName or ""

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
        if self.country:
            parts.append(self.country)
        return ", ".join(parts) if parts else None


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class ClientSearchParams(BaseModel):
    """Search/filter parameters for client list."""
    search: Optional[str] = Field(
        None,
        max_length=100,
        description="Search in company name, reference, email"
    )
    status_id: Optional[int] = Field(
        None,
        description="Filter by status ID"
    )
    client_type_id: Optional[int] = Field(
        None,
        description="Filter by client type ID"
    )
    country_id: Optional[int] = Field(
        None,
        description="Filter by country ID"
    )
    business_unit_id: Optional[int] = Field(
        None,
        description="Filter by business unit ID"
    )
    society_id: Optional[int] = Field(
        None,
        description="Filter by society ID"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Filter by active status"
    )


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class ClientListPaginatedResponse(BaseModel):
    """Paginated response for client list - matches frontend PagedResponse<T> format."""
    success: bool = Field(
        default=True,
        description="Whether the request was successful"
    )
    data: List[ClientListResponse] = Field(
        ...,
        description="List of clients"
    )
    page: int = Field(
        ...,
        description="Current page number (1-indexed)"
    )
    pageSize: int = Field(
        ...,
        description="Number of items per page"
    )
    totalCount: int = Field(
        ...,
        description="Total count of clients matching criteria"
    )
    totalPages: int = Field(
        ...,
        description="Total number of pages"
    )
    hasNextPage: bool = Field(
        ...,
        description="Whether there is a next page"
    )
    hasPreviousPage: bool = Field(
        ...,
        description="Whether there is a previous page"
    )


# ==========================================================================
# API Response Schemas
# ==========================================================================

class ClientAPIResponse(BaseModel):
    """Standard API response wrapper for client operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[ClientResponse] = Field(
        None,
        description="Client data"
    )


class ClientErrorResponse(BaseModel):
    """Error response for client operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )

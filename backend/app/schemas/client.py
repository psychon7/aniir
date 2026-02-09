"""
Pydantic schemas for Client API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field, AliasChoices


# ==========================================================================
# Client Base Schemas
# ==========================================================================

class ClientBase(BaseModel):
    """Base schema aligned with TM_CLI_CLient columns, with camelCase aliases."""
    model_config = ConfigDict(populate_by_name=True)

    cli_company_name: Optional[str] = Field(
        default=None,
        max_length=250,
        validation_alias=AliasChoices("cli_company_name", "companyName"),
        description="Company name",
    )
    cli_abbreviation: Optional[str] = Field(
        default=None,
        max_length=300,
        validation_alias=AliasChoices("cli_abbreviation", "abbreviation"),
        description="Company abbreviation",
    )

    # Core FKs
    soc_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("soc_id", "cli_soc_id", "societyId"),
        description="Society ID",
    )
    cty_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cty_id", "cli_type_id", "clientTypeId"),
        description="Client type ID",
    )
    act_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("act_id", "cli_sta_id", "activityId", "statusId"),
        description="Activity/status ID",
    )
    cur_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cur_id", "cli_cur_id", "currencyId"),
        description="Currency ID",
    )
    pco_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("pco_id", "cli_pay_term_id", "paymentConditionId", "paymentTermId"),
        description="Payment condition ID",
    )
    pmo_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("pmo_id", "cli_pay_mode_id", "paymentModeId"),
        description="Payment mode ID",
    )
    vat_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("vat_id", "vatId"),
        description="VAT ID",
    )
    cmu_id: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cmu_id", "communeId", "countryId"),
        description="Commune ID",
    )

    # Legal identifiers
    cli_siren: Optional[str] = Field(
        default=None,
        max_length=50,
        validation_alias=AliasChoices("cli_siren", "siren"),
        description="SIREN",
    )
    cli_siret: Optional[str] = Field(
        default=None,
        max_length=50,
        validation_alias=AliasChoices("cli_siret", "siret"),
        description="SIRET",
    )
    cli_vat_intra: Optional[str] = Field(
        default=None,
        max_length=50,
        validation_alias=AliasChoices("cli_vat_intra", "vatIntra", "vatNumber"),
        description="Intra-community VAT",
    )

    # Address
    cli_address1: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cli_address1", "cli_address", "address"),
        description="Address line 1",
    )
    cli_address2: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cli_address2", "address2"),
        description="Address line 2",
    )
    cli_postcode: Optional[str] = Field(
        default=None,
        max_length=50,
        validation_alias=AliasChoices("cli_postcode", "cli_postal_code", "postcode", "postalCode"),
        description="Postcode",
    )
    cli_city: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cli_city", "city"),
        description="City",
    )
    cli_country: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cli_country", "country"),
        description="Country",
    )
    cli_free_of_harbor: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cli_free_of_harbor", "freeOfHarbor"),
        description="Free of harbor mode",
    )

    # Contact
    cli_tel1: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cli_tel1", "cli_phone", "phone"),
        description="Primary phone",
    )
    cli_tel2: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cli_tel2", "phone2"),
        description="Secondary phone",
    )
    cli_fax: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cli_fax", "fax"),
        description="Fax",
    )
    cli_cellphone: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cli_cellphone", "cli_mobile", "mobile"),
        description="Mobile",
    )
    cli_email: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cli_email", "email"),
        description="Email",
    )
    cli_accounting_email: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cli_accounting_email", "accountingEmail"),
        description="Accounting email",
    )
    cli_recieve_newsletter: Optional[bool] = Field(
        default=None,
        validation_alias=AliasChoices("cli_recieve_newsletter", "receiveNewsletter"),
        description="Newsletter opt-in",
    )
    cli_newsletter_email: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cli_newsletter_email", "newsletterEmail"),
        description="Newsletter email",
    )

    # Commercial assignment
    cli_usr_com1: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cli_usr_com1", "commercialUser1Id"),
        description="Commercial 1 user ID",
    )
    cli_usr_com2: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cli_usr_com2", "commercialUser2Id"),
        description="Commercial 2 user ID",
    )
    cli_usr_com3: Optional[int] = Field(
        default=None,
        validation_alias=AliasChoices("cli_usr_com3", "commercialUser3Id"),
        description="Commercial 3 user ID",
    )

    # Comments and invoice prefs
    cli_comment_for_client: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("cli_comment_for_client", "commentForClient"),
        description="Comment visible to client",
    )
    cli_comment_for_interne: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("cli_comment_for_interne", "commentInternal", "notes"),
        description="Internal comment",
    )
    cli_invoice_day: Optional[int] = Field(
        default=None,
        ge=1,
        le=31,
        validation_alias=AliasChoices("cli_invoice_day", "invoiceDay"),
        description="Invoice day in month",
    )
    cli_invoice_day_is_last_day: Optional[bool] = Field(
        default=None,
        validation_alias=AliasChoices("cli_invoice_day_is_last_day", "invoiceDayIsLastDay"),
        description="Invoice on last day flag",
    )
    cli_showdetail: Optional[bool] = Field(
        default=None,
        validation_alias=AliasChoices("cli_showdetail", "showDetail"),
        description="Show detail flag",
    )
    cli_pdf_version: Optional[str] = Field(
        default=None,
        max_length=20,
        validation_alias=AliasChoices("cli_pdf_version", "pdfVersion"),
        description="PDF version",
    )

    # Status flags
    cli_isactive: Optional[bool] = Field(
        default=None,
        validation_alias=AliasChoices("cli_isactive", "cli_is_active", "isActive"),
        description="Active flag",
    )
    cli_isblocked: Optional[bool] = Field(
        default=None,
        validation_alias=AliasChoices("cli_isblocked", "isBlocked"),
        description="Blocked flag",
    )


class ClientCreate(ClientBase):
    """Schema for creating a Client."""
    cli_company_name: str = Field(
        ...,
        min_length=1,
        max_length=250,
        validation_alias=AliasChoices("cli_company_name", "companyName"),
        description="Company name",
    )

    soc_id: int = Field(default=1, validation_alias=AliasChoices("soc_id", "cli_soc_id", "societyId"))
    cty_id: int = Field(default=1, validation_alias=AliasChoices("cty_id", "cli_type_id", "clientTypeId"))
    cur_id: int = Field(default=1, validation_alias=AliasChoices("cur_id", "cli_cur_id", "currencyId"))
    pco_id: int = Field(default=1, validation_alias=AliasChoices("pco_id", "cli_pay_term_id", "paymentConditionId", "paymentTermId"))
    pmo_id: int = Field(default=1, validation_alias=AliasChoices("pmo_id", "cli_pay_mode_id", "paymentModeId"))
    vat_id: int = Field(default=1, validation_alias=AliasChoices("vat_id", "vatId"))


class ClientUpdate(BaseModel):
    """Schema for updating a Client (all fields optional)."""
    model_config = ConfigDict(populate_by_name=True)

    cli_company_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=250,
        validation_alias=AliasChoices("cli_company_name", "companyName"),
        description="Company name",
    )
    cli_abbreviation: Optional[str] = Field(
        default=None,
        max_length=300,
        validation_alias=AliasChoices("cli_abbreviation", "abbreviation"),
    )

    soc_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("soc_id", "cli_soc_id", "societyId"))
    cty_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("cty_id", "cli_type_id", "clientTypeId"))
    act_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("act_id", "cli_sta_id", "activityId", "statusId"))
    cur_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("cur_id", "cli_cur_id", "currencyId"))
    pco_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("pco_id", "cli_pay_term_id", "paymentConditionId", "paymentTermId"))
    pmo_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("pmo_id", "cli_pay_mode_id", "paymentModeId"))
    vat_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("vat_id", "vatId"))
    cmu_id: Optional[int] = Field(default=None, validation_alias=AliasChoices("cmu_id", "communeId", "countryId"))

    cli_siren: Optional[str] = Field(default=None, max_length=50, validation_alias=AliasChoices("cli_siren", "siren"))
    cli_siret: Optional[str] = Field(default=None, max_length=50, validation_alias=AliasChoices("cli_siret", "siret"))
    cli_vat_intra: Optional[str] = Field(default=None, max_length=50, validation_alias=AliasChoices("cli_vat_intra", "vatIntra", "vatNumber"))

    cli_address1: Optional[str] = Field(default=None, max_length=200, validation_alias=AliasChoices("cli_address1", "cli_address", "address"))
    cli_address2: Optional[str] = Field(default=None, max_length=200, validation_alias=AliasChoices("cli_address2", "address2"))
    cli_postcode: Optional[str] = Field(default=None, max_length=50, validation_alias=AliasChoices("cli_postcode", "cli_postal_code", "postcode", "postalCode"))
    cli_city: Optional[str] = Field(default=None, max_length=200, validation_alias=AliasChoices("cli_city", "city"))
    cli_country: Optional[str] = Field(default=None, max_length=200, validation_alias=AliasChoices("cli_country", "country"))
    cli_free_of_harbor: Optional[int] = Field(default=None, validation_alias=AliasChoices("cli_free_of_harbor", "freeOfHarbor"))

    cli_tel1: Optional[str] = Field(default=None, max_length=100, validation_alias=AliasChoices("cli_tel1", "cli_phone", "phone"))
    cli_tel2: Optional[str] = Field(default=None, max_length=100, validation_alias=AliasChoices("cli_tel2", "phone2"))
    cli_fax: Optional[str] = Field(default=None, max_length=100, validation_alias=AliasChoices("cli_fax", "fax"))
    cli_cellphone: Optional[str] = Field(default=None, max_length=100, validation_alias=AliasChoices("cli_cellphone", "cli_mobile", "mobile"))
    cli_email: Optional[str] = Field(default=None, max_length=100, validation_alias=AliasChoices("cli_email", "email"))
    cli_accounting_email: Optional[str] = Field(default=None, max_length=200, validation_alias=AliasChoices("cli_accounting_email", "accountingEmail"))
    cli_recieve_newsletter: Optional[bool] = Field(default=None, validation_alias=AliasChoices("cli_recieve_newsletter", "receiveNewsletter"))
    cli_newsletter_email: Optional[str] = Field(default=None, max_length=100, validation_alias=AliasChoices("cli_newsletter_email", "newsletterEmail"))

    cli_usr_com1: Optional[int] = Field(default=None, validation_alias=AliasChoices("cli_usr_com1", "commercialUser1Id"))
    cli_usr_com2: Optional[int] = Field(default=None, validation_alias=AliasChoices("cli_usr_com2", "commercialUser2Id"))
    cli_usr_com3: Optional[int] = Field(default=None, validation_alias=AliasChoices("cli_usr_com3", "commercialUser3Id"))

    cli_comment_for_client: Optional[str] = Field(default=None, validation_alias=AliasChoices("cli_comment_for_client", "commentForClient"))
    cli_comment_for_interne: Optional[str] = Field(default=None, validation_alias=AliasChoices("cli_comment_for_interne", "commentInternal", "notes"))
    cli_invoice_day: Optional[int] = Field(default=None, ge=1, le=31, validation_alias=AliasChoices("cli_invoice_day", "invoiceDay"))
    cli_invoice_day_is_last_day: Optional[bool] = Field(default=None, validation_alias=AliasChoices("cli_invoice_day_is_last_day", "invoiceDayIsLastDay"))
    cli_showdetail: Optional[bool] = Field(default=None, validation_alias=AliasChoices("cli_showdetail", "showDetail"))
    cli_pdf_version: Optional[str] = Field(default=None, max_length=20, validation_alias=AliasChoices("cli_pdf_version", "pdfVersion"))

    cli_isactive: Optional[bool] = Field(default=None, validation_alias=AliasChoices("cli_isactive", "cli_is_active", "isActive"))
    cli_isblocked: Optional[bool] = Field(default=None, validation_alias=AliasChoices("cli_isblocked", "isBlocked"))


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
        return self.cli_company_name or ""

    @computed_field
    @property
    def full_contact_name(self) -> Optional[str]:
        """Get full contact name."""
        return None

    @computed_field
    @property
    def full_address(self) -> Optional[str]:
        """Get formatted full address."""
        parts = []
        if self.cli_address1:
            parts.append(self.cli_address1)
        if self.cli_address2:
            parts.append(self.cli_address2)
        if self.cli_postcode or self.cli_city:
            city_line = " ".join(filter(None, [self.cli_postcode, self.cli_city]))
            if city_line:
                parts.append(city_line)
        return ", ".join(parts) if parts else None


class ClientListResponse(BaseModel):
    """Schema for listing clients (lightweight) - camelCase output for frontend."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Map DB columns (cli_*) to frontend camelCase fields using validation_alias
    # validation_alias is used for INPUT (ORM parsing), field name is used for OUTPUT (JSON)
    id: int = Field(..., validation_alias="cli_id", description="Client ID")
    reference: Optional[str] = Field(None, validation_alias="cli_ref", description="Client reference")
    companyName: Optional[str] = Field(None, validation_alias="cli_company_name", description="Company name")
    email: Optional[str] = Field(None, validation_alias="cli_email", description="Email address")
    phone: Optional[str] = Field(None, validation_alias="cli_tel1", description="Phone number")
    city: Optional[str] = Field(None, validation_alias="cli_city", description="City")
    statusId: Optional[int] = Field(None, validation_alias="act_id", description="Status/Activity ID")
    clientTypeId: Optional[int] = Field(None, validation_alias="cty_id", description="Client type ID")
    isActive: Optional[bool] = Field(None, validation_alias="cli_isactive", description="Whether the client is active")
    createdAt: Optional[datetime] = Field(None, validation_alias="cli_d_creation", description="Creation timestamp")

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

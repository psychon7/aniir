"""
Pydantic schemas for Supplier API requests and responses.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Supplier Base Schemas
# ==========================================================================

class SupplierBase(BaseModel):
    """Base schema for Supplier."""
    sup_company_name: str = Field(
        ...,
        min_length=1,
        max_length=250,
        description="Company name"
    )

    # Foreign Keys
    soc_id: int = Field(
        ...,
        description="Society ID (FK to TR_SOC_Society)"
    )
    vat_id: int = Field(
        ...,
        description="VAT rate ID (FK to TR_VAT_VAT)"
    )
    pco_id: int = Field(
        ...,
        description="Payment condition ID (FK to TR_PCO_Payment_Condition)"
    )
    pmo_id: int = Field(
        ...,
        description="Payment mode ID (FK to TR_PMO_Payment_Mode)"
    )
    cur_id: int = Field(
        ...,
        description="Currency ID (FK to TR_CUR_Currency)"
    )
    sty_id: Optional[int] = Field(
        None,
        description="Supplier type ID (FK to TR_STY_Supplier_Type)"
    )

    # Tax Information
    sup_siren: Optional[str] = Field(
        None,
        max_length=50,
        description="SIREN number (French company ID)"
    )
    sup_siret: Optional[str] = Field(
        None,
        max_length=50,
        description="SIRET number (French establishment ID)"
    )
    sup_vat_intra: Optional[str] = Field(
        None,
        max_length=50,
        description="Intra-community VAT number"
    )

    # Address Information
    sup_address1: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 1"
    )
    sup_address2: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 2"
    )
    sup_postcode: Optional[str] = Field(
        None,
        max_length=50,
        description="Postal code"
    )
    sup_city: Optional[str] = Field(
        None,
        max_length=200,
        description="City"
    )
    sup_country: Optional[str] = Field(
        None,
        max_length=200,
        description="Country"
    )

    # Shipping
    sup_free_of_harbor: Optional[int] = Field(
        None,
        description="Free of harbor amount"
    )

    # Contact Information
    sup_tel1: Optional[str] = Field(
        None,
        max_length=100,
        description="Primary phone number"
    )
    sup_tel2: Optional[str] = Field(
        None,
        max_length=100,
        description="Secondary phone number"
    )
    sup_fax: Optional[str] = Field(
        None,
        max_length=100,
        description="Fax number"
    )
    sup_cellphone: Optional[str] = Field(
        None,
        max_length=100,
        description="Mobile phone number"
    )
    sup_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )

    # Newsletter
    sup_recieve_newsletter: bool = Field(
        False,
        description="Whether to receive newsletter"
    )
    sup_newsletter_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address for newsletter"
    )

    # Comments
    sup_comment_for_supplier: Optional[str] = Field(
        None,
        description="Comment visible to supplier"
    )
    sup_comment_for_interne: Optional[str] = Field(
        None,
        description="Internal comment"
    )

    # Status Flags
    sup_isactive: bool = Field(
        True,
        description="Whether the supplier is active"
    )
    sup_isblocked: bool = Field(
        False,
        description="Whether the supplier is blocked"
    )


class SupplierCreate(SupplierBase):
    """Schema for creating a Supplier."""
    usr_created_by: int = Field(
        ...,
        description="User ID who created the supplier"
    )


class SupplierUpdate(BaseModel):
    """Schema for updating a Supplier (all fields optional)."""
    sup_company_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=250,
        description="Company name"
    )

    # Foreign Keys
    soc_id: Optional[int] = Field(
        None,
        description="Society ID (FK to TR_SOC_Society)"
    )
    vat_id: Optional[int] = Field(
        None,
        description="VAT rate ID (FK to TR_VAT_VAT)"
    )
    pco_id: Optional[int] = Field(
        None,
        description="Payment condition ID (FK to TR_PCO_Payment_Condition)"
    )
    pmo_id: Optional[int] = Field(
        None,
        description="Payment mode ID (FK to TR_PMO_Payment_Mode)"
    )
    cur_id: Optional[int] = Field(
        None,
        description="Currency ID (FK to TR_CUR_Currency)"
    )
    sty_id: Optional[int] = Field(
        None,
        description="Supplier type ID (FK to TR_STY_Supplier_Type)"
    )

    # Tax Information
    sup_siren: Optional[str] = Field(
        None,
        max_length=50,
        description="SIREN number (French company ID)"
    )
    sup_siret: Optional[str] = Field(
        None,
        max_length=50,
        description="SIRET number (French establishment ID)"
    )
    sup_vat_intra: Optional[str] = Field(
        None,
        max_length=50,
        description="Intra-community VAT number"
    )

    # Address Information
    sup_address1: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 1"
    )
    sup_address2: Optional[str] = Field(
        None,
        max_length=200,
        description="Address line 2"
    )
    sup_postcode: Optional[str] = Field(
        None,
        max_length=50,
        description="Postal code"
    )
    sup_city: Optional[str] = Field(
        None,
        max_length=200,
        description="City"
    )
    sup_country: Optional[str] = Field(
        None,
        max_length=200,
        description="Country"
    )

    # Shipping
    sup_free_of_harbor: Optional[int] = Field(
        None,
        description="Free of harbor amount"
    )

    # Contact Information
    sup_tel1: Optional[str] = Field(
        None,
        max_length=100,
        description="Primary phone number"
    )
    sup_tel2: Optional[str] = Field(
        None,
        max_length=100,
        description="Secondary phone number"
    )
    sup_fax: Optional[str] = Field(
        None,
        max_length=100,
        description="Fax number"
    )
    sup_cellphone: Optional[str] = Field(
        None,
        max_length=100,
        description="Mobile phone number"
    )
    sup_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )

    # Newsletter
    sup_recieve_newsletter: Optional[bool] = Field(
        None,
        description="Whether to receive newsletter"
    )
    sup_newsletter_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address for newsletter"
    )

    # Comments
    sup_comment_for_supplier: Optional[str] = Field(
        None,
        description="Comment visible to supplier"
    )
    sup_comment_for_interne: Optional[str] = Field(
        None,
        description="Internal comment"
    )

    # Status Flags
    sup_isactive: Optional[bool] = Field(
        None,
        description="Whether the supplier is active"
    )
    sup_isblocked: Optional[bool] = Field(
        None,
        description="Whether the supplier is blocked"
    )


class SupplierResponse(SupplierBase):
    """Schema for Supplier response."""
    model_config = ConfigDict(from_attributes=True)

    sup_id: int = Field(..., description="Supplier ID")
    sup_ref: Optional[str] = Field(None, description="Supplier reference")
    usr_created_by: int = Field(..., description="Created by user ID")
    sup_d_creation: datetime = Field(..., description="Creation timestamp")
    sup_d_update: datetime = Field(..., description="Last update timestamp")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get supplier's display name."""
        if self.sup_ref:
            return f"{self.sup_ref} - {self.sup_company_name}"
        return self.sup_company_name

    @computed_field
    @property
    def full_address(self) -> Optional[str]:
        """Get formatted full address."""
        parts = []
        if self.sup_address1:
            parts.append(self.sup_address1)
        if self.sup_address2:
            parts.append(self.sup_address2)
        if self.sup_postcode or self.sup_city:
            city_line = " ".join(filter(None, [self.sup_postcode, self.sup_city]))
            if city_line:
                parts.append(city_line)
        if self.sup_country:
            parts.append(self.sup_country)
        return ", ".join(parts) if parts else None


class SupplierListResponse(BaseModel):
    """Schema for listing suppliers (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    sup_id: int = Field(..., description="Supplier ID")
    sup_ref: Optional[str] = Field(None, description="Supplier reference")
    sup_company_name: str = Field(..., description="Company name")
    sup_email: Optional[str] = Field(None, description="Email address")
    sup_tel1: Optional[str] = Field(None, description="Phone number")
    sup_city: Optional[str] = Field(None, description="City")
    sup_country: Optional[str] = Field(None, description="Country")
    soc_id: int = Field(..., description="Society ID")
    sty_id: Optional[int] = Field(None, description="Supplier type ID")
    sup_isactive: bool = Field(..., description="Whether the supplier is active")
    sup_isblocked: bool = Field(..., description="Whether the supplier is blocked")
    sup_d_creation: datetime = Field(..., description="Creation timestamp")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get supplier's display name."""
        if self.sup_ref:
            return f"{self.sup_ref} - {self.sup_company_name}"
        return self.sup_company_name


# ==========================================================================
# SupplierContact Schemas
# ==========================================================================

class SupplierContactBase(BaseModel):
    """Base schema for SupplierContact."""
    sco_first_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Contact first name"
    )
    sco_last_name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Contact last name"
    )
    sco_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )
    sco_phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Phone number"
    )
    sco_mobile: Optional[str] = Field(
        None,
        max_length=30,
        description="Mobile phone number"
    )
    sco_job_title: Optional[str] = Field(
        None,
        max_length=100,
        description="Job title"
    )
    sco_department: Optional[str] = Field(
        None,
        max_length=100,
        description="Department"
    )
    sco_is_primary: bool = Field(
        False,
        description="Whether this is the primary contact"
    )
    sco_notes: Optional[str] = Field(
        None,
        description="Notes about the contact"
    )


class SupplierContactCreate(SupplierContactBase):
    """Schema for creating a SupplierContact."""
    sco_sup_id: int = Field(
        ...,
        description="Supplier ID (FK to TM_SUP_Supplier)"
    )


class SupplierContactUpdate(BaseModel):
    """Schema for updating a SupplierContact (all fields optional)."""
    sco_first_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Contact first name"
    )
    sco_last_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="Contact last name"
    )
    sco_email: Optional[str] = Field(
        None,
        max_length=100,
        description="Email address"
    )
    sco_phone: Optional[str] = Field(
        None,
        max_length=30,
        description="Phone number"
    )
    sco_mobile: Optional[str] = Field(
        None,
        max_length=30,
        description="Mobile phone number"
    )
    sco_job_title: Optional[str] = Field(
        None,
        max_length=100,
        description="Job title"
    )
    sco_department: Optional[str] = Field(
        None,
        max_length=100,
        description="Department"
    )
    sco_is_primary: Optional[bool] = Field(
        None,
        description="Whether this is the primary contact"
    )
    sco_notes: Optional[str] = Field(
        None,
        description="Notes about the contact"
    )


class SupplierContactResponse(SupplierContactBase):
    """Schema for SupplierContact response."""
    model_config = ConfigDict(from_attributes=True)

    sco_id: int = Field(..., description="Contact ID")
    sco_sup_id: int = Field(..., description="Supplier ID")

    @computed_field
    @property
    def full_name(self) -> str:
        """Get contact's full name."""
        return f"{self.sco_first_name} {self.sco_last_name}"


class SupplierContactListResponse(BaseModel):
    """Schema for listing contacts (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    sco_id: int = Field(..., description="Contact ID")
    sco_sup_id: int = Field(..., description="Supplier ID")
    sco_first_name: str = Field(..., description="First name")
    sco_last_name: str = Field(..., description="Last name")
    sco_email: Optional[str] = Field(None, description="Email address")
    sco_phone: Optional[str] = Field(None, description="Phone number")
    sco_job_title: Optional[str] = Field(None, description="Job title")
    sco_is_primary: bool = Field(..., description="Whether primary contact")

    @computed_field
    @property
    def full_name(self) -> str:
        """Get contact's full name."""
        return f"{self.sco_first_name} {self.sco_last_name}"


# ==========================================================================
# Search/Filter Schemas
# ==========================================================================

class SupplierSearchParams(BaseModel):
    """Search/filter parameters for supplier list."""
    search: Optional[str] = Field(
        None,
        max_length=100,
        description="Search in company name, reference, email"
    )
    society_id: Optional[int] = Field(
        None,
        description="Filter by society ID"
    )
    supplier_type_id: Optional[int] = Field(
        None,
        description="Filter by supplier type ID"
    )
    payment_condition_id: Optional[int] = Field(
        None,
        description="Filter by payment condition ID"
    )
    payment_mode_id: Optional[int] = Field(
        None,
        description="Filter by payment mode ID"
    )
    currency_id: Optional[int] = Field(
        None,
        description="Filter by currency ID"
    )
    is_active: Optional[bool] = Field(
        None,
        description="Filter by active status"
    )
    is_blocked: Optional[bool] = Field(
        None,
        description="Filter by blocked status"
    )
    country: Optional[str] = Field(
        None,
        max_length=200,
        description="Filter by country"
    )
    city: Optional[str] = Field(
        None,
        max_length=200,
        description="Filter by city"
    )


# ==========================================================================
# List/Pagination Schemas
# ==========================================================================

class SupplierListPaginatedResponse(BaseModel):
    """Paginated response for supplier list - matches frontend PagedResponse<T> format."""
    success: bool = Field(
        default=True,
        description="Whether the request was successful"
    )
    data: List[SupplierListResponse] = Field(
        ...,
        description="List of suppliers"
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
        description="Total count of suppliers matching criteria"
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


class SupplierContactListPaginatedResponse(BaseModel):
    """Paginated response for supplier contact list."""
    success: bool = Field(default=True)
    data: List[SupplierContactListResponse] = Field(
        ...,
        description="List of contacts"
    )
    totalCount: int = Field(
        ...,
        description="Total count of contacts matching criteria"
    )
    skip: int = Field(
        ...,
        description="Number of items skipped"
    )
    limit: int = Field(
        ...,
        description="Maximum items returned"
    )


# ==========================================================================
# API Response Schemas
# ==========================================================================

class SupplierAPIResponse(BaseModel):
    """Standard API response wrapper for supplier operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[SupplierResponse] = Field(
        None,
        description="Supplier data"
    )


class SupplierErrorResponse(BaseModel):
    """Error response for supplier operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )


class SupplierContactAPIResponse(BaseModel):
    """Standard API response wrapper for supplier contact operations."""
    success: bool = Field(
        True,
        description="Whether the operation was successful"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message"
    )
    data: Optional[SupplierContactResponse] = Field(
        None,
        description="Contact data"
    )


class SupplierContactErrorResponse(BaseModel):
    """Error response for supplier contact operations."""
    success: bool = Field(
        False,
        description="Always false for errors"
    )
    error: dict = Field(
        ...,
        description="Error details with code and message"
    )


# ==========================================================================
# Extended Response Schemas
# ==========================================================================

class SupplierWithContactsResponse(SupplierResponse):
    """Supplier response with contacts included."""
    contacts: List[SupplierContactListResponse] = Field(
        default_factory=list,
        description="List of supplier contacts"
    )


class SupplierDetailResponse(BaseModel):
    """
    Schema for supplier detail response - camelCase output for frontend with resolved lookup names.
    Used for GET /suppliers/{supplier_id} endpoint.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Core identification
    id: int = Field(..., validation_alias="sup_id", description="Supplier ID")
    reference: Optional[str] = Field(None, validation_alias="sup_ref", description="Supplier reference")
    companyName: str = Field(..., validation_alias="sup_company_name", description="Company name")
    abbreviation: Optional[str] = Field(None, validation_alias="sup_abbreviation", description="Company abbreviation")

    # Status IDs
    societyId: int = Field(..., validation_alias="soc_id", description="Society ID")
    supplierTypeId: int = Field(..., validation_alias="sty_id", description="Supplier type ID")
    currencyId: int = Field(..., validation_alias="cur_id", description="Currency ID")
    paymentConditionId: int = Field(..., validation_alias="pco_id", description="Payment condition ID")
    paymentModeId: int = Field(..., validation_alias="pmo_id", description="Payment mode ID")
    vatId: int = Field(..., validation_alias="vat_id", description="VAT ID")

    # VAT and registration
    siren: Optional[str] = Field(None, validation_alias="sup_siren", description="SIREN number")
    siret: Optional[str] = Field(None, validation_alias="sup_siret", description="SIRET number")
    vatIntra: Optional[str] = Field(None, validation_alias="sup_vat_intra", description="Intra-community VAT number")

    # Status flags
    isActive: bool = Field(..., validation_alias="sup_isactive", description="Whether the supplier is active")
    isBlocked: bool = Field(..., validation_alias="sup_isblocked", description="Whether the supplier is blocked")

    # Timestamps
    createdAt: Optional[datetime] = Field(None, validation_alias="sup_d_creation", description="Creation timestamp")
    updatedAt: Optional[datetime] = Field(None, validation_alias="sup_d_update", description="Last update timestamp")
    createdBy: int = Field(..., validation_alias="usr_created_by", description="Created by user ID")

    # Address
    address1: Optional[str] = Field(None, validation_alias="sup_address1", description="Address line 1")
    address2: Optional[str] = Field(None, validation_alias="sup_address2", description="Address line 2")
    postcode: Optional[str] = Field(None, validation_alias="sup_postcode", description="Postal code")
    city: Optional[str] = Field(None, validation_alias="sup_city", description="City")
    country: Optional[str] = Field(None, validation_alias="sup_country", description="Country")
    freeOfHarbor: Optional[int] = Field(None, validation_alias="sup_free_of_harbor", description="Free of harbor flag")

    # Contact information
    phone: Optional[str] = Field(None, validation_alias="sup_tel1", description="Primary phone")
    phone2: Optional[str] = Field(None, validation_alias="sup_tel2", description="Secondary phone")
    fax: Optional[str] = Field(None, validation_alias="sup_fax", description="Fax number")
    mobile: Optional[str] = Field(None, validation_alias="sup_cellphone", description="Mobile phone")
    email: Optional[str] = Field(None, validation_alias="sup_email", description="Email address")
    newsletterEmail: Optional[str] = Field(None, validation_alias="sup_newsletter_email", description="Newsletter email")
    receiveNewsletter: bool = Field(False, validation_alias="sup_recieve_newsletter", description="Receive newsletter flag")

    # Comments and notes
    commentForSupplier: Optional[str] = Field(None, validation_alias="sup_comment_for_supplier", description="Comment visible to supplier")
    commentInternal: Optional[str] = Field(None, validation_alias="sup_comment_for_interne", description="Internal comment")

    # =====================================================
    # Resolved lookup names (populated by service layer)
    # These are not from the ORM directly but enriched data
    # =====================================================
    societyName: Optional[str] = Field(None, description="Resolved society name")
    supplierTypeName: Optional[str] = Field(None, description="Resolved supplier type name")
    currencyCode: Optional[str] = Field(None, description="Resolved currency code/designation")
    currencySymbol: Optional[str] = Field(None, description="Resolved currency symbol")
    paymentModeName: Optional[str] = Field(None, description="Resolved payment mode name")
    paymentConditionName: Optional[str] = Field(None, description="Resolved payment condition name")
    paymentTermDays: Optional[int] = Field(None, description="Payment term total days")

    @computed_field
    @property
    def displayName(self) -> str:
        """Get supplier's display name."""
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

"""
Pydantic schemas for Client Delegate API.

Client delegates are entities that receive invoices on behalf of a client,
typically parent companies, billing agents, or group headquarters.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class ClientDelegateBase(BaseModel):
    """Base schema for client delegate."""
    cdl_delegate_cli_id: Optional[int] = Field(None, description="Existing client ID to use as delegate")
    cdl_company_name: Optional[str] = Field(None, max_length=250, description="Delegate company name (if not existing client)")
    cdl_contact_name: Optional[str] = Field(None, max_length=200, description="Contact person name")
    cdl_email: Optional[str] = Field(None, max_length=100, description="Email address")
    cdl_phone: Optional[str] = Field(None, max_length=100, description="Phone number")
    cdl_address1: Optional[str] = Field(None, max_length=200, description="Address line 1")
    cdl_address2: Optional[str] = Field(None, max_length=200, description="Address line 2")
    cdl_postcode: Optional[str] = Field(None, max_length=50, description="Postal code")
    cdl_city: Optional[str] = Field(None, max_length=200, description="City")
    cdl_country: Optional[str] = Field(None, max_length=200, description="Country")
    cdl_vat_number: Optional[str] = Field(None, max_length=50, description="VAT number")


class ClientDelegateCreate(ClientDelegateBase):
    """Schema for creating a client delegate."""
    cdl_cli_id: Optional[int] = Field(None, description="Client ID (set automatically from URL)")


class ClientDelegateUpdate(BaseModel):
    """Schema for updating a client delegate."""
    cdl_delegate_cli_id: Optional[int] = None
    cdl_company_name: Optional[str] = Field(None, max_length=250)
    cdl_contact_name: Optional[str] = Field(None, max_length=200)
    cdl_email: Optional[str] = Field(None, max_length=100)
    cdl_phone: Optional[str] = Field(None, max_length=100)
    cdl_address1: Optional[str] = Field(None, max_length=200)
    cdl_address2: Optional[str] = Field(None, max_length=200)
    cdl_postcode: Optional[str] = Field(None, max_length=50)
    cdl_city: Optional[str] = Field(None, max_length=200)
    cdl_country: Optional[str] = Field(None, max_length=200)
    cdl_vat_number: Optional[str] = Field(None, max_length=50)


class ClientDelegateResponse(BaseModel):
    """Response schema for client delegate."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int = Field(..., validation_alias="cdl_id")
    clientId: int = Field(..., validation_alias="cdl_cli_id")
    delegateClientId: Optional[int] = Field(None, validation_alias="cdl_delegate_cli_id")
    companyName: Optional[str] = Field(None, validation_alias="cdl_company_name")
    contactName: Optional[str] = Field(None, validation_alias="cdl_contact_name")
    email: Optional[str] = Field(None, validation_alias="cdl_email")
    phone: Optional[str] = Field(None, validation_alias="cdl_phone")
    address1: Optional[str] = Field(None, validation_alias="cdl_address1")
    address2: Optional[str] = Field(None, validation_alias="cdl_address2")
    postcode: Optional[str] = Field(None, validation_alias="cdl_postcode")
    city: Optional[str] = Field(None, validation_alias="cdl_city")
    country: Optional[str] = Field(None, validation_alias="cdl_country")
    vatNumber: Optional[str] = Field(None, validation_alias="cdl_vat_number")

    # Resolved lookup name (if delegate is an existing client)
    delegateClientName: Optional[str] = Field(None, description="Name of delegate client if linked")


class ClientDelegateListResponse(BaseModel):
    """Response schema for paginated delegate list."""
    data: List[ClientDelegateResponse]
    total: int
    page: int
    pageSize: int
    hasNextPage: bool
    hasPreviousPage: bool

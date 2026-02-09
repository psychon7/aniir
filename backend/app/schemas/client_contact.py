"""
Pydantic schemas for ClientContact API requests and responses.

Aligned to TM_CCO_Client_Contact actual column names while accepting
legacy/camelCase aliases from frontend payloads.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class ClientContactBase(BaseModel):
    """Base schema for client contact create payloads."""

    model_config = ConfigDict(populate_by_name=True)

    cco_firstname: str = Field(
        ...,
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("cco_firstname", "cco_first_name", "firstName"),
    )
    cco_lastname: str = Field(
        ...,
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("cco_lastname", "cco_last_name", "lastName"),
    )
    civ_id: int = Field(default=1)
    cco_ref: Optional[str] = Field(default=None, max_length=50)
    cco_adresse_title: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cco_adresse_title", "addressTitle", "title"),
    )

    cco_address1: Optional[str] = Field(default=None, max_length=200)
    cco_address2: Optional[str] = Field(default=None, max_length=200)
    cco_postcode: Optional[str] = Field(default=None, max_length=50)
    cco_city: Optional[str] = Field(default=None, max_length=200)
    cco_country: Optional[str] = Field(default=None, max_length=200)
    cmu_id: Optional[int] = Field(default=None)

    cco_tel1: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cco_tel1", "phone", "cco_phone"),
    )
    cco_tel2: Optional[str] = Field(default=None, max_length=100)
    cco_fax: Optional[str] = Field(default=None, max_length=100)
    cco_cellphone: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cco_cellphone", "mobile", "cco_mobile"),
    )
    cco_email: Optional[str] = Field(default=None, max_length=100)

    cco_recieve_newsletter: bool = Field(default=False)
    cco_newsletter_email: Optional[str] = Field(default=None, max_length=100)

    cco_is_delivery_adr: bool = Field(
        default=False,
        validation_alias=AliasChoices("cco_is_delivery_adr", "isDeliveryAddress", "isDeliveryAdr"),
    )
    cco_is_invoicing_adr: bool = Field(
        default=False,
        validation_alias=AliasChoices("cco_is_invoicing_adr", "isInvoicingAddress", "isInvoicingAdr", "isPrimary"),
    )

    cco_comment: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("cco_comment", "notes"),
    )


class ClientContactCreate(ClientContactBase):
    """Schema for creating a client contact."""

    cli_id: Optional[int] = Field(default=None)


class ClientContactUpdate(BaseModel):
    """Schema for updating a client contact."""

    model_config = ConfigDict(populate_by_name=True)

    cco_firstname: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("cco_firstname", "cco_first_name", "firstName"),
    )
    cco_lastname: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        validation_alias=AliasChoices("cco_lastname", "cco_last_name", "lastName"),
    )
    civ_id: Optional[int] = None
    cco_ref: Optional[str] = Field(default=None, max_length=50)
    cco_adresse_title: Optional[str] = Field(
        default=None,
        max_length=200,
        validation_alias=AliasChoices("cco_adresse_title", "addressTitle", "title"),
    )

    cco_address1: Optional[str] = Field(default=None, max_length=200)
    cco_address2: Optional[str] = Field(default=None, max_length=200)
    cco_postcode: Optional[str] = Field(default=None, max_length=50)
    cco_city: Optional[str] = Field(default=None, max_length=200)
    cco_country: Optional[str] = Field(default=None, max_length=200)
    cmu_id: Optional[int] = None

    cco_tel1: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cco_tel1", "phone", "cco_phone"),
    )
    cco_tel2: Optional[str] = Field(default=None, max_length=100)
    cco_fax: Optional[str] = Field(default=None, max_length=100)
    cco_cellphone: Optional[str] = Field(
        default=None,
        max_length=100,
        validation_alias=AliasChoices("cco_cellphone", "mobile", "cco_mobile"),
    )
    cco_email: Optional[str] = Field(default=None, max_length=100)

    cco_recieve_newsletter: Optional[bool] = None
    cco_newsletter_email: Optional[str] = Field(default=None, max_length=100)

    cco_is_delivery_adr: Optional[bool] = Field(
        default=None,
        validation_alias=AliasChoices("cco_is_delivery_adr", "isDeliveryAddress", "isDeliveryAdr"),
    )
    cco_is_invoicing_adr: Optional[bool] = Field(
        default=None,
        validation_alias=AliasChoices("cco_is_invoicing_adr", "isInvoicingAddress", "isInvoicingAdr", "isPrimary"),
    )

    cco_comment: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("cco_comment", "notes"),
    )


class ClientContactResponse(BaseModel):
    """Client contact response schema (camelCase output)."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int = Field(..., validation_alias="cco_id")
    clientId: int = Field(..., validation_alias="cli_id")

    firstName: str = Field(..., validation_alias="cco_firstname")
    lastName: str = Field(..., validation_alias="cco_lastname")
    civilityId: int = Field(..., validation_alias="civ_id")
    reference: Optional[str] = Field(None, validation_alias="cco_ref")
    addressTitle: Optional[str] = Field(None, validation_alias="cco_adresse_title")

    address1: Optional[str] = Field(None, validation_alias="cco_address1")
    address2: Optional[str] = Field(None, validation_alias="cco_address2")
    postcode: Optional[str] = Field(None, validation_alias="cco_postcode")
    city: Optional[str] = Field(None, validation_alias="cco_city")
    country: Optional[str] = Field(None, validation_alias="cco_country")

    phone: Optional[str] = Field(None, validation_alias="cco_tel1")
    phone2: Optional[str] = Field(None, validation_alias="cco_tel2")
    fax: Optional[str] = Field(None, validation_alias="cco_fax")
    mobile: Optional[str] = Field(None, validation_alias="cco_cellphone")
    email: Optional[str] = Field(None, validation_alias="cco_email")

    receiveNewsletter: bool = Field(False, validation_alias="cco_recieve_newsletter")
    newsletterEmail: Optional[str] = Field(None, validation_alias="cco_newsletter_email")

    isDeliveryAddress: bool = Field(False, validation_alias="cco_is_delivery_adr")
    isInvoicingAddress: bool = Field(False, validation_alias="cco_is_invoicing_adr")

    comment: Optional[str] = Field(None, validation_alias="cco_comment")
    communeId: Optional[int] = Field(None, validation_alias="cmu_id")

    createdAt: Optional[datetime] = Field(None, validation_alias="cco_d_creation")
    updatedAt: Optional[datetime] = Field(None, validation_alias="cco_d_update")


class ClientContactListResponse(ClientContactResponse):
    """Lightweight list item schema (same shape as detail)."""


class ClientContactListPaginatedResponse(BaseModel):
    """Paginated response for client contacts."""

    items: List[ClientContactListResponse] = Field(default_factory=list)
    total: int = 0
    skip: int = 0
    limit: int = 100


class ClientContactAPIResponse(BaseModel):
    """Standard API wrapper for single contact operations."""

    success: bool = True
    message: Optional[str] = None
    data: Optional[ClientContactResponse] = None


class ClientContactErrorResponse(BaseModel):
    """Error response for contact operations."""

    success: bool = False
    error: dict

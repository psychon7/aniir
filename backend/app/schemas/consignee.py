"""
Pydantic schemas for Consignee API requests and responses.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Consignee Base Schemas
# =============================================================================

class ConsigneeBase(BaseModel):
    """Base schema for Consignee."""
    con_firstname: Optional[str] = Field(None, max_length=200, description="First name")
    con_lastname: Optional[str] = Field(None, max_length=200, description="Last name")
    civ_id: Optional[int] = Field(None, description="Civility ID")
    con_code: Optional[str] = Field(None, max_length=200, description="Consignee code")
    con_adresse_title: Optional[str] = Field(None, max_length=200, description="Address title")

    con_address1: Optional[str] = Field(None, max_length=200, description="Address line 1")
    con_address2: Optional[str] = Field(None, max_length=200, description="Address line 2")
    con_address3: Optional[str] = Field(None, max_length=200, description="Address line 3")
    con_postcode: Optional[str] = Field(None, max_length=50, description="Postal code")
    con_city: Optional[str] = Field(None, max_length=200, description="City")
    con_province: Optional[str] = Field(None, max_length=200, description="Province")
    con_country: Optional[str] = Field(None, max_length=200, description="Country")

    con_tel1: Optional[str] = Field(None, max_length=100, description="Phone")
    con_tel2: Optional[str] = Field(None, max_length=100, description="Secondary phone")
    con_fax: Optional[str] = Field(None, max_length=100, description="Fax")
    con_cellphone: Optional[str] = Field(None, max_length=100, description="Cellphone")
    con_email: Optional[str] = Field(None, max_length=200, description="Email")

    con_recieve_newsletter: bool = Field(False, description="Receive newsletter")
    con_newsletter_email: Optional[str] = Field(None, max_length=200, description="Newsletter email")
    con_is_delivery_adr: bool = Field(False, description="Is delivery address")
    con_is_invoicing_adr: bool = Field(False, description="Is invoicing address")

    usr_created_by: Optional[int] = Field(None, description="User ID who created")
    soc_id: Optional[int] = Field(None, description="Society ID")

    con_comment: Optional[str] = Field(None, description="Comment")
    con_company_name: Optional[str] = Field(None, max_length=200, description="Company name")


class ConsigneeCreate(ConsigneeBase):
    """Schema for creating a Consignee."""
    pass


class ConsigneeUpdate(BaseModel):
    """Schema for updating a Consignee (all fields optional)."""
    con_firstname: Optional[str] = Field(None, max_length=200)
    con_lastname: Optional[str] = Field(None, max_length=200)
    civ_id: Optional[int] = None
    con_code: Optional[str] = Field(None, max_length=200)
    con_adresse_title: Optional[str] = Field(None, max_length=200)

    con_address1: Optional[str] = Field(None, max_length=200)
    con_address2: Optional[str] = Field(None, max_length=200)
    con_address3: Optional[str] = Field(None, max_length=200)
    con_postcode: Optional[str] = Field(None, max_length=50)
    con_city: Optional[str] = Field(None, max_length=200)
    con_province: Optional[str] = Field(None, max_length=200)
    con_country: Optional[str] = Field(None, max_length=200)

    con_tel1: Optional[str] = Field(None, max_length=100)
    con_tel2: Optional[str] = Field(None, max_length=100)
    con_fax: Optional[str] = Field(None, max_length=100)
    con_cellphone: Optional[str] = Field(None, max_length=100)
    con_email: Optional[str] = Field(None, max_length=200)

    con_recieve_newsletter: Optional[bool] = None
    con_newsletter_email: Optional[str] = Field(None, max_length=200)
    con_is_delivery_adr: Optional[bool] = None
    con_is_invoicing_adr: Optional[bool] = None

    usr_created_by: Optional[int] = None
    soc_id: Optional[int] = None

    con_comment: Optional[str] = None
    con_company_name: Optional[str] = Field(None, max_length=200)


class ConsigneeResponse(ConsigneeBase):
    """Schema for Consignee response."""
    model_config = ConfigDict(from_attributes=True)

    con_id: int = Field(..., description="Consignee ID")
    con_d_creation: datetime = Field(..., description="Creation date")
    con_d_update: datetime = Field(..., description="Update date")


class ConsigneeListResponse(BaseModel):
    """Schema for listing consignees (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    con_id: int = Field(..., description="Consignee ID")
    con_code: Optional[str] = Field(None, description="Consignee code")
    con_company_name: Optional[str] = Field(None, description="Company name")
    con_firstname: Optional[str] = Field(None, description="First name")
    con_lastname: Optional[str] = Field(None, description="Last name")
    con_city: Optional[str] = Field(None, description="City")
    con_postcode: Optional[str] = Field(None, description="Postal code")
    con_email: Optional[str] = Field(None, description="Email")
    con_tel1: Optional[str] = Field(None, description="Phone")
    con_is_delivery_adr: bool = Field(False, description="Is delivery address")
    con_is_invoicing_adr: bool = Field(False, description="Is invoicing address")


class ConsigneeListPaginatedResponse(BaseModel):
    """Paginated response for consignee list - matches frontend PagedResponse<T> format."""
    success: bool = Field(default=True, description="Whether the request was successful")
    data: List[ConsigneeListResponse] = Field(..., description="List of consignees")
    page: int = Field(..., description="Current page number (1-indexed)")
    pageSize: int = Field(..., description="Number of items per page")
    totalCount: int = Field(..., description="Total count of consignees matching criteria")
    totalPages: int = Field(..., description="Total number of pages")
    hasNextPage: bool = Field(..., description="Whether there is a next page")
    hasPreviousPage: bool = Field(..., description="Whether there is a previous page")


class ConsigneeSearchParams(BaseModel):
    """Search parameters for consignee list."""
    search: Optional[str] = Field(None, description="Search term")
    soc_id: Optional[int] = Field(None, description="Society ID")
    con_firstname: Optional[str] = Field(None, description="Name filter")
    con_comment: Optional[str] = Field(None, description="Comment filter")
    con_email: Optional[str] = Field(None, description="Email filter")
    con_postcode: Optional[str] = Field(None, description="Postal code filter")
    con_city: Optional[str] = Field(None, description="City filter")
    con_address: Optional[str] = Field(None, description="Address filter")
    con_company_name: Optional[str] = Field(None, description="Company name filter")
    con_tel: Optional[str] = Field(None, description="Phone filter")
    con_is_delivery_adr: Optional[bool] = Field(None, description="Delivery address filter")
    con_is_invoicing_adr: Optional[bool] = Field(None, description="Invoicing address filter")
    skip: int = Field(default=0, ge=0, description="Items to skip")
    limit: int = Field(default=50, ge=1, le=500, description="Max items")
    sort_by: Optional[str] = Field(default="con_firstname", description="Sort field")
    sort_order: Optional[str] = Field(default="asc", description="Sort order")

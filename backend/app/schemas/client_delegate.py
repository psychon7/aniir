"""
Pydantic schemas for Client Delegate API.

Client delegates are entities that receive invoices on behalf of a client.
The TR_CDL_Client_Delegate table is a junction table linking a client to
another client (the delegate). All delegate info comes from the linked client.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


class ClientDelegateCreate(BaseModel):
    """Schema for creating a client delegate (link to another client)."""
    cdl_delegate_cli_id: int = Field(..., description="Client ID of the delegate")


class ClientDelegateUpdate(BaseModel):
    """Schema for updating a client delegate."""
    cdl_delegate_cli_id: Optional[int] = Field(None, description="Client ID of the delegate")


class ClientDelegateResponse(BaseModel):
    """Response schema for client delegate — all info resolved from linked client."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int = Field(..., validation_alias="cdl_id")
    clientId: int = Field(..., validation_alias="cdl_cli_id")
    delegateClientId: Optional[int] = Field(None, validation_alias="cdl_delegate_cli_id")

    # All fields below are resolved from the delegate Client record
    companyName: Optional[str] = None
    contactName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address1: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    vatNumber: Optional[str] = None
    isActive: bool = True
    isPrimary: bool = False


class ClientDelegateListResponse(BaseModel):
    """Response schema for paginated delegate list."""
    data: List[ClientDelegateResponse]
    total: int
    page: int
    pageSize: int
    hasNextPage: bool
    hasPreviousPage: bool

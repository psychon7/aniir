"""Pydantic schemas for product component relations."""

from datetime import datetime
from typing import Optional, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


ComponentType = Literal["DRIVER", "ACCESSORY", "OPTION"]


class ProductComponentBase(BaseModel):
    """Base payload for product component relations."""

    model_config = ConfigDict(populate_by_name=True)

    component_prd_id: int = Field(
        ...,
        validation_alias=AliasChoices("component_prd_id", "componentProductId"),
        description="Linked component product ID",
    )
    prc_component_type: ComponentType = Field(
        ...,
        validation_alias=AliasChoices("prc_component_type", "componentType", "type"),
        description="Relation type (DRIVER, ACCESSORY, OPTION)",
    )
    prc_quantity: Optional[float] = Field(
        default=None,
        ge=0,
        validation_alias=AliasChoices("prc_quantity", "quantity"),
        description="Component quantity",
    )
    prc_is_required: Optional[bool] = Field(
        default=True,
        validation_alias=AliasChoices("prc_is_required", "isRequired"),
        description="Whether component is required",
    )
    prc_order: Optional[int] = Field(
        default=0,
        validation_alias=AliasChoices("prc_order", "order"),
        description="Sort order",
    )


class ProductComponentCreate(ProductComponentBase):
    """Payload for creating a product component relation."""


class ProductComponentUpdate(BaseModel):
    """Payload for updating a product component relation."""

    model_config = ConfigDict(populate_by_name=True)

    component_prd_id: Optional[int] = Field(None, validation_alias=AliasChoices("component_prd_id", "componentProductId"))
    prc_component_type: Optional[ComponentType] = Field(None, validation_alias=AliasChoices("prc_component_type", "componentType", "type"))
    prc_quantity: Optional[float] = Field(None, ge=0, validation_alias=AliasChoices("prc_quantity", "quantity"))
    prc_is_required: Optional[bool] = Field(None, validation_alias=AliasChoices("prc_is_required", "isRequired"))
    prc_order: Optional[int] = Field(None, validation_alias=AliasChoices("prc_order", "order"))


class ProductComponentResponse(BaseModel):
    """Response for product component relation."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int = Field(..., validation_alias="prc_id")
    productId: int = Field(..., validation_alias="prd_id")
    componentProductId: int = Field(..., validation_alias="component_prd_id")
    componentType: str = Field(..., validation_alias="prc_component_type")
    quantity: Optional[float] = Field(None, validation_alias="prc_quantity")
    isRequired: bool = Field(True, validation_alias="prc_is_required")
    order: int = Field(0, validation_alias="prc_order")
    createdAt: Optional[datetime] = Field(None, validation_alias="prc_d_creation")
    updatedAt: Optional[datetime] = Field(None, validation_alias="prc_d_update")

    componentReference: Optional[str] = None
    componentName: Optional[str] = None


class ProductComponentListResponse(BaseModel):
    """List wrapper for component relations."""

    items: list[ProductComponentResponse] = Field(default_factory=list)
    total: int = 0

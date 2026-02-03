"""
Pydantic schemas for Product Attributes API.

Provides validation and serialization for product attribute endpoints.
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any, Union
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator
import json


# =============================================================================
# Enums
# =============================================================================


class AttributeDataType(str, Enum):
    """Data type for product attributes."""
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    SELECT = "select"


# =============================================================================
# Product Attribute Schemas
# =============================================================================


class ProductAttributeBase(BaseModel):
    """Base schema for product attributes."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductAttributeCreate(ProductAttributeBase):
    """Schema for creating a product attribute."""
    pat_code: str = Field(..., min_length=1, max_length=50, alias="code")
    pat_name: str = Field(..., min_length=1, max_length=200, alias="name")
    pat_description: Optional[str] = Field(None, max_length=1000, alias="description")
    pat_data_type: AttributeDataType = Field(AttributeDataType.TEXT, alias="dataType")
    pat_options: Optional[List[str]] = Field(None, alias="options")  # For select type
    pat_unit: Optional[str] = Field(None, max_length=50, alias="unit")
    pat_is_required: bool = Field(False, alias="isRequired")
    pat_is_filterable: bool = Field(False, alias="isFilterable")
    pat_is_visible: bool = Field(True, alias="isVisible")
    pat_sort_order: int = Field(0, alias="sortOrder")
    soc_id: int = Field(..., alias="societyId")

    @field_validator('pat_options', mode='before')
    @classmethod
    def options_to_json(cls, v):
        """Convert options list to JSON string for storage."""
        if v is None:
            return None
        if isinstance(v, str):
            return v
        return json.dumps(v)


class ProductAttributeUpdate(ProductAttributeBase):
    """Schema for updating a product attribute."""
    pat_code: Optional[str] = Field(None, min_length=1, max_length=50, alias="code")
    pat_name: Optional[str] = Field(None, min_length=1, max_length=200, alias="name")
    pat_description: Optional[str] = Field(None, max_length=1000, alias="description")
    pat_data_type: Optional[AttributeDataType] = Field(None, alias="dataType")
    pat_options: Optional[List[str]] = Field(None, alias="options")
    pat_unit: Optional[str] = Field(None, max_length=50, alias="unit")
    pat_is_required: Optional[bool] = Field(None, alias="isRequired")
    pat_is_filterable: Optional[bool] = Field(None, alias="isFilterable")
    pat_is_visible: Optional[bool] = Field(None, alias="isVisible")
    pat_sort_order: Optional[int] = Field(None, alias="sortOrder")
    pat_isactive: Optional[bool] = Field(None, alias="isActive")

    @field_validator('pat_options', mode='before')
    @classmethod
    def options_to_json(cls, v):
        """Convert options list to JSON string for storage."""
        if v is None:
            return None
        if isinstance(v, str):
            return v
        return json.dumps(v)


class ProductAttributeResponse(ProductAttributeBase):
    """Schema for product attribute response."""
    pat_id: int = Field(..., alias="id")
    pat_code: str = Field(..., alias="code")
    pat_name: str = Field(..., alias="name")
    pat_description: Optional[str] = Field(None, alias="description")
    pat_data_type: str = Field(..., alias="dataType")
    pat_options: Optional[List[str]] = Field(None, alias="options")
    pat_unit: Optional[str] = Field(None, alias="unit")
    pat_is_required: bool = Field(..., alias="isRequired")
    pat_is_filterable: bool = Field(..., alias="isFilterable")
    pat_is_visible: bool = Field(..., alias="isVisible")
    pat_sort_order: int = Field(..., alias="sortOrder")
    soc_id: int = Field(..., alias="societyId")
    pat_d_creation: datetime = Field(..., alias="createdAt")
    pat_d_update: datetime = Field(..., alias="updatedAt")
    pat_isactive: bool = Field(..., alias="isActive")

    @field_validator('pat_options', mode='before')
    @classmethod
    def parse_options(cls, v):
        """Parse JSON options string to list."""
        if v is None:
            return None
        if isinstance(v, list):
            return v
        try:
            return json.loads(v)
        except (json.JSONDecodeError, TypeError):
            return None


class ProductAttributeListResponse(BaseModel):
    """Schema for paginated product attribute list response."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    data: List[ProductAttributeResponse] = Field(..., alias="data")
    total: int = Field(..., alias="total")
    page: int = Field(..., alias="page")
    page_size: int = Field(..., alias="pageSize")
    pages: int = Field(..., alias="pages")


# =============================================================================
# Product Attribute Value Schemas
# =============================================================================


class ProductAttributeValueBase(BaseModel):
    """Base schema for product attribute values."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ProductAttributeValueCreate(ProductAttributeValueBase):
    """Schema for creating/updating a product attribute value."""
    pat_id: int = Field(..., alias="attributeId")
    value: Union[str, int, float, bool, datetime, None] = Field(..., alias="value")


class ProductAttributeValueUpdate(ProductAttributeValueBase):
    """Schema for updating a product attribute value."""
    value: Union[str, int, float, bool, datetime, None] = Field(..., alias="value")


class ProductAttributeValueResponse(ProductAttributeValueBase):
    """Schema for product attribute value response."""
    pav_id: int = Field(..., alias="id")
    prd_id: int = Field(..., alias="productId")
    pat_id: int = Field(..., alias="attributeId")
    value: Any = Field(None, alias="value")
    display_value: str = Field("", alias="displayValue")
    pav_d_creation: datetime = Field(..., alias="createdAt")
    pav_d_update: datetime = Field(..., alias="updatedAt")

    # Attribute details (nested)
    attribute_code: Optional[str] = Field(None, alias="attributeCode")
    attribute_name: Optional[str] = Field(None, alias="attributeName")
    attribute_data_type: Optional[str] = Field(None, alias="attributeDataType")
    attribute_unit: Optional[str] = Field(None, alias="attributeUnit")


class ProductAttributeValuesResponse(BaseModel):
    """Schema for list of attribute values for a product."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    product_id: int = Field(..., alias="productId")
    product_name: Optional[str] = Field(None, alias="productName")
    attributes: List[ProductAttributeValueResponse] = Field(..., alias="attributes")


# =============================================================================
# Batch Update Schema
# =============================================================================


class ProductAttributeValuesBatchUpdate(BaseModel):
    """Schema for batch updating attribute values for a product."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    values: List[ProductAttributeValueCreate] = Field(..., alias="values")


# =============================================================================
# Filter/Search Schemas
# =============================================================================


class ProductAttributeFilter(BaseModel):
    """Schema for filtering products by attribute values."""
    attribute_id: int = Field(..., alias="attributeId")
    value: Any = Field(..., alias="value")
    operator: str = Field("eq", alias="operator")  # eq, ne, gt, gte, lt, lte, contains

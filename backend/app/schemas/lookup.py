"""
Pydantic schemas for unified Lookup API responses.

These schemas provide lightweight, consistent response formats for
dropdown/lookup data across various reference tables.
"""
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, computed_field


# ==========================================================================
# Generic Lookup Item Schemas
# ==========================================================================

class LookupItem(BaseModel):
    """
    Generic lookup item for dropdowns and selections.

    This is the standard format for all lookup responses, providing
    a consistent interface for frontend components.
    """
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Unique identifier")
    code: Optional[str] = Field(None, description="Short code (if applicable)")
    name: str = Field(..., description="Display name")
    display_name: str = Field(..., description="Formatted display name")
    is_active: bool = Field(default=True, description="Whether the item is active")
    extra: Optional[dict] = Field(None, description="Additional entity-specific data")


class LookupItemWithParent(LookupItem):
    """Lookup item with parent reference for hierarchical data."""
    parent_id: Optional[int] = Field(None, description="Parent item ID (for hierarchical lookups)")


# ==========================================================================
# Currency Lookup Schemas
# ==========================================================================

class CurrencyLookup(BaseModel):
    """Currency lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., alias="cur_id", description="Currency ID")
    designation: str = Field(..., alias="cur_designation", description="Currency code (e.g., USD, EUR)")
    symbol: str = Field(..., alias="cur_symbol", description="Currency symbol (e.g., $, €)")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get currency display name with symbol."""
        return f"{self.designation} ({self.symbol})"


# ==========================================================================
# Status Lookup Schemas
# ==========================================================================

class StatusLookup(BaseModel):
    """Status lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., alias="sta_id", description="Status ID")
    code: str = Field(..., alias="sta_code", description="Status code")
    name: str = Field(..., alias="sta_name", description="Status name")
    entity_type: Optional[str] = Field(None, alias="sta_entity_type", description="Entity type filter")
    color_hex: Optional[str] = Field(None, alias="sta_color_hex", description="Badge color")
    sort_order: int = Field(0, alias="sta_sort_order", description="Sort order")
    is_active: bool = Field(True, alias="sta_is_active", description="Is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get status display name."""
        return self.name


# ==========================================================================
# Category Lookup Schemas
# ==========================================================================

class CategoryLookup(BaseModel):
    """Category lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., alias="cat_id", description="Category ID")
    # cat_code doesn't exist in DB, use cat_id as code
    name: str = Field(..., alias="cat_name", description="Category name")
    parent_id: Optional[int] = Field(None, alias="cat_parent_cat_id", description="Parent category ID")
    is_active: bool = Field(True, alias="cat_is_actived", description="Is active")

    @computed_field
    @property
    def code(self) -> str:
        """Generate code from ID."""
        return str(self.id)

    @computed_field
    @property
    def display_name(self) -> str:
        """Get category display name."""
        return self.name

    @computed_field
    @property
    def is_root(self) -> bool:
        """Check if this is a root category."""
        return self.parent_id is None


class CategoryTreeLookup(CategoryLookup):
    """Category lookup with children for tree display."""
    children: List["CategoryTreeLookup"] = Field(default_factory=list, description="Child categories")


# Self-reference for recursive model
CategoryTreeLookup.model_rebuild()


# ==========================================================================
# Client Type Lookup Schemas
# ==========================================================================

class ClientTypeLookup(BaseModel):
    """Client type lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    # Actual DB columns use cty_ prefix
    id: int = Field(..., alias="cty_id", description="Client type ID")
    description: str = Field(..., alias="cty_description", description="Client type description")
    # ClientType has no is_active column, default to True
    is_active: bool = Field(default=True, description="Is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get client type display name."""
        return self.description


# ==========================================================================
# Unit of Measure Lookup Schemas
# ==========================================================================

class UnitOfMeasureLookup(BaseModel):
    """Unit of measure lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., alias="uom_id", description="UOM ID")
    code: str = Field(..., alias="uom_code", description="UOM code (e.g., KG, PC)")
    designation: str = Field(..., alias="uom_designation", description="UOM name")
    is_active: bool = Field(True, alias="uom_isactive", description="Is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get UOM display name with code."""
        return f"{self.designation} ({self.code})"


# ==========================================================================
# VAT Rate Lookup Schemas
# ==========================================================================

class VatRateLookup(BaseModel):
    """VAT rate lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., alias="vat_id", description="VAT rate ID")
    designation: str = Field(..., alias="vat_designation", description="VAT rate name")
    rate: Decimal = Field(..., alias="vat_vat_rate", description="VAT rate percentage")
    description: str = Field(..., alias="vat_description", description="VAT rate code")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get VAT rate display name with percentage."""
        return f"{self.designation} ({self.rate}%)"


# ==========================================================================
# Payment Mode Lookup Schemas
# ==========================================================================

class PaymentModeLookup(BaseModel):
    """Payment mode lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., alias="pmo_id", description="Payment mode ID")
    designation: str = Field(..., alias="pmo_designation", description="Payment mode name")
    is_active: bool = Field(True, alias="pmo_isactive", description="Is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get payment mode display name."""
        return self.designation


# ==========================================================================
# Payment Term Lookup Schemas
# ==========================================================================

class PaymentTermLookup(BaseModel):
    """Payment term lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    # Actual DB columns use pco_ prefix (Payment COndition)
    id: int = Field(..., alias="pco_id", description="Payment term ID")
    designation: str = Field(..., alias="pco_designation", description="Payment term name")
    num_days: int = Field(0, alias="pco_numday", description="Number of days")
    end_month: bool = Field(False, alias="pco_end_month", description="Due at end of month")
    is_active: bool = Field(True, alias="pco_active", description="Is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get payment term display name."""
        return self.designation


# ==========================================================================
# Warehouse Lookup Schemas
# ==========================================================================

class WarehouseLookup(BaseModel):
    """Warehouse lookup item for dropdowns."""
    model_config = ConfigDict(from_attributes=True)

    # Actual DB columns use whs_ prefix
    id: int = Field(..., alias="whs_id", description="Warehouse ID")
    code: Optional[str] = Field(None, alias="whs_code", description="Warehouse code")
    name: str = Field(..., alias="whs_name", description="Warehouse name")
    city: Optional[str] = Field(None, alias="whs_city", description="Warehouse city")
    # Warehouse has no is_default or is_active columns
    is_default: bool = Field(default=False, description="Is default warehouse")
    is_active: bool = Field(default=True, description="Is active")

    @computed_field
    @property
    def display_name(self) -> str:
        """Get warehouse display name."""
        code_str = f" ({self.code})" if self.code else ""
        return f"{self.name}{code_str}"


# ==========================================================================
# Response Wrapper Schemas
# ==========================================================================

class LookupListResponse(BaseModel):
    """Standard response wrapper for lookup lists."""
    success: bool = Field(True, description="Whether the request was successful")
    data: List[Any] = Field(..., description="List of lookup items")
    total: int = Field(..., description="Total count of items")


class AllLookupsResponse(BaseModel):
    """Response containing all lookup data for initialization."""
    success: bool = Field(True, description="Whether the request was successful")
    currencies: List[CurrencyLookup] = Field(default_factory=list, description="Currency lookups")
    statuses: List[StatusLookup] = Field(default_factory=list, description="Status lookups")
    categories: List[CategoryLookup] = Field(default_factory=list, description="Category lookups")
    client_types: List[ClientTypeLookup] = Field(default_factory=list, description="Client type lookups")
    units_of_measure: List[UnitOfMeasureLookup] = Field(default_factory=list, description="UOM lookups")
    vat_rates: List[VatRateLookup] = Field(default_factory=list, description="VAT rate lookups")
    payment_modes: List[PaymentModeLookup] = Field(default_factory=list, description="Payment mode lookups")
    payment_terms: List[PaymentTermLookup] = Field(default_factory=list, description="Payment term lookups")
    warehouses: List[WarehouseLookup] = Field(default_factory=list, description="Warehouse lookups")

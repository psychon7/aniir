"""
Product Attribute models for dynamic product attributes.

Implements an Entity-Attribute-Value (EAV) pattern allowing flexible
product attributes without schema changes.

Tables:
- TM_PAT_ProductAttribute: Attribute definitions (e.g., Color, Size, Material)
- TM_PAV_ProductAttributeValue: Attribute values assigned to products

Proposed DB schema for TM_PAT_ProductAttribute:
  pat_id: int NOT NULL [PK]
  pat_code: nvarchar(50) NOT NULL UNIQUE
  pat_name: nvarchar(200) NOT NULL
  pat_description: nvarchar(1000) NULL
  pat_data_type: nvarchar(20) NOT NULL (text, number, boolean, date, select)
  pat_options: ntext NULL (JSON array for select type)
  pat_unit: nvarchar(50) NULL (measurement unit)
  pat_is_required: bit NOT NULL DEFAULT 0
  pat_is_filterable: bit NOT NULL DEFAULT 0
  pat_is_visible: bit NOT NULL DEFAULT 1
  pat_sort_order: int NOT NULL DEFAULT 0
  pat_d_creation: datetime NOT NULL
  pat_d_update: datetime NOT NULL
  pat_isactive: bit NOT NULL DEFAULT 1
  soc_id: int NOT NULL -> TR_SOC_Society.soc_id

Proposed DB schema for TM_PAV_ProductAttributeValue:
  pav_id: int NOT NULL [PK]
  prd_id: int NOT NULL -> TM_PRD_Product.prd_id
  pat_id: int NOT NULL -> TM_PAT_ProductAttribute.pat_id
  pav_value_text: nvarchar(4000) NULL
  pav_value_number: decimal(18,4) NULL
  pav_value_boolean: bit NULL
  pav_value_date: datetime NULL
  pav_d_creation: datetime NOT NULL
  pav_d_update: datetime NOT NULL
  UNIQUE (prd_id, pat_id)
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from enum import Enum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base

if TYPE_CHECKING:
    from app.models.product import Product


class AttributeDataType(str, Enum):
    """Data type for product attributes."""
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "boolean"
    DATE = "date"
    SELECT = "select"


# =============================================================================
# ProductAttribute Model (TM_PAT_ProductAttribute)
# =============================================================================


class ProductAttribute(Base):
    """
    Product Attribute definition model.
    Maps to TM_PAT_ProductAttribute table.

    Defines attribute types that can be assigned to products.
    Example: Color, Size, Material, Wattage, Voltage, etc.
    """
    __tablename__ = "TM_PAT_ProductAttribute"
    __table_args__ = {'extend_existing': True}

    # Primary Key
    pat_id: Mapped[int] = mapped_column(
        "pat_id", Integer, primary_key=True, autoincrement=True
    )

    # Attribute identification
    pat_code: Mapped[str] = mapped_column(
        "pat_code", String(50), nullable=False, unique=True
    )
    pat_name: Mapped[str] = mapped_column(
        "pat_name", String(200), nullable=False
    )
    pat_description: Mapped[Optional[str]] = mapped_column(
        "pat_description", String(1000), nullable=True
    )

    # Data type and options
    pat_data_type: Mapped[str] = mapped_column(
        "pat_data_type", String(20), nullable=False, default=AttributeDataType.TEXT.value
    )
    pat_options: Mapped[Optional[str]] = mapped_column(
        "pat_options", Text, nullable=True
    )  # JSON array for select type options
    pat_unit: Mapped[Optional[str]] = mapped_column(
        "pat_unit", String(50), nullable=True
    )  # Measurement unit (e.g., mm, kg, W)

    # Display settings
    pat_is_required: Mapped[bool] = mapped_column(
        "pat_is_required", Boolean, nullable=False, default=False
    )
    pat_is_filterable: Mapped[bool] = mapped_column(
        "pat_is_filterable", Boolean, nullable=False, default=False
    )
    pat_is_visible: Mapped[bool] = mapped_column(
        "pat_is_visible", Boolean, nullable=False, default=True
    )
    pat_sort_order: Mapped[int] = mapped_column(
        "pat_sort_order", Integer, nullable=False, default=0
    )

    # Society
    soc_id: Mapped[int] = mapped_column(
        "soc_id", Integer, ForeignKey("TR_SOC_Society.soc_id"), nullable=False
    )

    # Timestamps
    pat_d_creation: Mapped[datetime] = mapped_column(
        "pat_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    pat_d_update: Mapped[datetime] = mapped_column(
        "pat_d_update", DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Status
    pat_isactive: Mapped[bool] = mapped_column(
        "pat_isactive", Boolean, nullable=False, default=True
    )

    # Relationships
    values: Mapped[List["ProductAttributeValue"]] = relationship(
        "ProductAttributeValue",
        back_populates="attribute",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<ProductAttribute(pat_id={self.pat_id}, code='{self.pat_code}', name='{self.pat_name}')>"

    # Property aliases
    @property
    def id(self) -> int:
        return self.pat_id

    @property
    def code(self) -> str:
        return self.pat_code

    @property
    def name(self) -> str:
        return self.pat_name

    @property
    def data_type(self) -> str:
        return self.pat_data_type

    @property
    def is_required(self) -> bool:
        return self.pat_is_required

    @property
    def is_filterable(self) -> bool:
        return self.pat_is_filterable

    @property
    def is_visible(self) -> bool:
        return self.pat_is_visible

    @property
    def is_active(self) -> bool:
        return self.pat_isactive


# =============================================================================
# ProductAttributeValue Model (TM_PAV_ProductAttributeValue)
# =============================================================================


class ProductAttributeValue(Base):
    """
    Product Attribute Value model.
    Maps to TM_PAV_ProductAttributeValue table.

    Stores the actual attribute values for specific products.
    Supports multiple data types through separate value columns.
    """
    __tablename__ = "TM_PAV_ProductAttributeValue"
    __table_args__ = (
        UniqueConstraint('prd_id', 'pat_id', name='uq_product_attribute'),
        {'extend_existing': True}
    )

    # Primary Key
    pav_id: Mapped[int] = mapped_column(
        "pav_id", Integer, primary_key=True, autoincrement=True
    )

    # Foreign keys
    prd_id: Mapped[int] = mapped_column(
        "prd_id", Integer, ForeignKey("TM_PRD_Product.prd_id"), nullable=False
    )
    pat_id: Mapped[int] = mapped_column(
        "pat_id", Integer, ForeignKey("TM_PAT_ProductAttribute.pat_id"), nullable=False
    )

    # Value columns (only one should be populated based on attribute data type)
    pav_value_text: Mapped[Optional[str]] = mapped_column(
        "pav_value_text", String(4000), nullable=True
    )
    pav_value_number: Mapped[Optional[Decimal]] = mapped_column(
        "pav_value_number", Numeric(18, 4), nullable=True
    )
    pav_value_boolean: Mapped[Optional[bool]] = mapped_column(
        "pav_value_boolean", Boolean, nullable=True
    )
    pav_value_date: Mapped[Optional[datetime]] = mapped_column(
        "pav_value_date", DateTime, nullable=True
    )

    # Timestamps
    pav_d_creation: Mapped[datetime] = mapped_column(
        "pav_d_creation", DateTime, nullable=False, default=datetime.utcnow
    )
    pav_d_update: Mapped[datetime] = mapped_column(
        "pav_d_update", DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    attribute: Mapped["ProductAttribute"] = relationship(
        "ProductAttribute",
        back_populates="values",
        lazy="joined"
    )

    product: Mapped["Product"] = relationship(
        "Product",
        foreign_keys=[prd_id],
        lazy="joined"
    )

    def __repr__(self) -> str:
        return f"<ProductAttributeValue(pav_id={self.pav_id}, product={self.prd_id}, attribute={self.pat_id})>"

    # Property aliases
    @property
    def id(self) -> int:
        return self.pav_id

    @property
    def product_id(self) -> int:
        return self.prd_id

    @property
    def attribute_id(self) -> int:
        return self.pat_id

    @property
    def value(self):
        """Get the value based on the attribute's data type."""
        if not self.attribute:
            return self.pav_value_text

        data_type = self.attribute.pat_data_type

        if data_type == AttributeDataType.TEXT.value or data_type == AttributeDataType.SELECT.value:
            return self.pav_value_text
        elif data_type == AttributeDataType.NUMBER.value:
            return self.pav_value_number
        elif data_type == AttributeDataType.BOOLEAN.value:
            return self.pav_value_boolean
        elif data_type == AttributeDataType.DATE.value:
            return self.pav_value_date
        else:
            return self.pav_value_text

    @property
    def display_value(self) -> str:
        """Get a formatted display value."""
        val = self.value
        if val is None:
            return ""

        if isinstance(val, bool):
            return "Yes" if val else "No"
        elif isinstance(val, datetime):
            return val.strftime("%Y-%m-%d")
        elif isinstance(val, Decimal):
            formatted = str(val)
            if self.attribute and self.attribute.pat_unit:
                formatted += f" {self.attribute.pat_unit}"
            return formatted
        else:
            return str(val)

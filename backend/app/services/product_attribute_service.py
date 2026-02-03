"""
Product Attribute service for managing dynamic product attributes.

Provides CRUD operations for attributes and attribute values.
"""
import asyncio
import json
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Tuple, Any
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from app.models.product_attribute import (
    ProductAttribute, ProductAttributeValue, AttributeDataType
)
from app.models.product import Product
from app.schemas.product_attribute import (
    ProductAttributeCreate, ProductAttributeUpdate,
    ProductAttributeValueCreate, ProductAttributeValueUpdate
)


# =============================================================================
# Custom Exceptions
# =============================================================================


class ProductAttributeServiceError(Exception):
    """Base exception for product attribute service errors."""
    pass


class ProductAttributeNotFoundError(ProductAttributeServiceError):
    """Raised when a product attribute is not found."""
    pass


class ProductAttributeValueNotFoundError(ProductAttributeServiceError):
    """Raised when a product attribute value is not found."""
    pass


class ProductAttributeValidationError(ProductAttributeServiceError):
    """Raised when attribute validation fails."""
    pass


# =============================================================================
# Product Attribute Service
# =============================================================================


class ProductAttributeService:
    """Service class for product attribute operations."""

    def __init__(self, db: Session):
        self.db = db

    # -------------------------------------------------------------------------
    # Attribute CRUD Operations
    # -------------------------------------------------------------------------

    def get_attribute_by_id(self, attribute_id: int) -> Optional[ProductAttribute]:
        """Get an attribute by ID."""
        stmt = select(ProductAttribute).where(ProductAttribute.pat_id == attribute_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_attribute_by_code(self, code: str) -> Optional[ProductAttribute]:
        """Get an attribute by code."""
        stmt = select(ProductAttribute).where(ProductAttribute.pat_code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_attributes(
        self,
        page: int = 1,
        page_size: int = 20,
        society_id: Optional[int] = None,
        active_only: bool = True,
        filterable_only: bool = False,
        search: Optional[str] = None
    ) -> Tuple[List[ProductAttribute], int]:
        """Get paginated list of attributes."""
        stmt = select(ProductAttribute)
        count_stmt = select(func.count(ProductAttribute.pat_id))

        filters = []

        if active_only:
            filters.append(ProductAttribute.pat_isactive == True)

        if society_id:
            filters.append(ProductAttribute.soc_id == society_id)

        if filterable_only:
            filters.append(ProductAttribute.pat_is_filterable == True)

        if search:
            search_filter = or_(
                ProductAttribute.pat_code.ilike(f"%{search}%"),
                ProductAttribute.pat_name.ilike(f"%{search}%"),
                ProductAttribute.pat_description.ilike(f"%{search}%")
            )
            filters.append(search_filter)

        if filters:
            stmt = stmt.where(and_(*filters))
            count_stmt = count_stmt.where(and_(*filters))

        total = self.db.execute(count_stmt).scalar() or 0

        stmt = stmt.order_by(ProductAttribute.pat_sort_order, ProductAttribute.pat_name)

        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        attributes = list(self.db.execute(stmt).scalars().all())

        return attributes, total

    def create_attribute(self, data: ProductAttributeCreate) -> ProductAttribute:
        """Create a new product attribute."""
        # Check for duplicate code
        existing = self.get_attribute_by_code(data.pat_code)
        if existing:
            raise ProductAttributeValidationError(f"Attribute with code '{data.pat_code}' already exists")

        attribute = ProductAttribute(
            pat_code=data.pat_code,
            pat_name=data.pat_name,
            pat_description=data.pat_description,
            pat_data_type=data.pat_data_type.value if data.pat_data_type else AttributeDataType.TEXT.value,
            pat_options=data.pat_options if isinstance(data.pat_options, str) else (
                json.dumps(data.pat_options) if data.pat_options else None
            ),
            pat_unit=data.pat_unit,
            pat_is_required=data.pat_is_required,
            pat_is_filterable=data.pat_is_filterable,
            pat_is_visible=data.pat_is_visible,
            pat_sort_order=data.pat_sort_order,
            soc_id=data.soc_id,
            pat_d_creation=datetime.utcnow(),
            pat_d_update=datetime.utcnow(),
            pat_isactive=True
        )

        self.db.add(attribute)
        self.db.commit()
        self.db.refresh(attribute)

        return attribute

    def update_attribute(self, attribute_id: int, data: ProductAttributeUpdate) -> ProductAttribute:
        """Update an existing attribute."""
        attribute = self.get_attribute_by_id(attribute_id)
        if not attribute:
            raise ProductAttributeNotFoundError(f"Attribute with ID {attribute_id} not found")

        update_data = data.model_dump(exclude_unset=True, by_alias=False)

        for field, value in update_data.items():
            if hasattr(attribute, field):
                if field == 'pat_data_type' and value is not None:
                    value = value.value if hasattr(value, 'value') else value
                elif field == 'pat_options' and value is not None:
                    value = json.dumps(value) if isinstance(value, list) else value
                setattr(attribute, field, value)

        attribute.pat_d_update = datetime.utcnow()

        self.db.commit()
        self.db.refresh(attribute)

        return attribute

    def delete_attribute(self, attribute_id: int, hard_delete: bool = False) -> bool:
        """Delete an attribute (soft delete by default)."""
        attribute = self.get_attribute_by_id(attribute_id)
        if not attribute:
            raise ProductAttributeNotFoundError(f"Attribute with ID {attribute_id} not found")

        if hard_delete:
            self.db.delete(attribute)
        else:
            attribute.pat_isactive = False
            attribute.pat_d_update = datetime.utcnow()

        self.db.commit()
        return True

    # -------------------------------------------------------------------------
    # Attribute Value CRUD Operations
    # -------------------------------------------------------------------------

    def get_value_by_id(self, value_id: int) -> Optional[ProductAttributeValue]:
        """Get an attribute value by ID."""
        stmt = select(ProductAttributeValue).where(ProductAttributeValue.pav_id == value_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_product_attribute_value(
        self,
        product_id: int,
        attribute_id: int
    ) -> Optional[ProductAttributeValue]:
        """Get a specific attribute value for a product."""
        stmt = select(ProductAttributeValue).where(
            and_(
                ProductAttributeValue.prd_id == product_id,
                ProductAttributeValue.pat_id == attribute_id
            )
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_product_attributes(self, product_id: int) -> List[ProductAttributeValue]:
        """Get all attribute values for a product."""
        stmt = (
            select(ProductAttributeValue)
            .where(ProductAttributeValue.prd_id == product_id)
            .join(ProductAttribute)
            .order_by(ProductAttribute.pat_sort_order, ProductAttribute.pat_name)
        )
        return list(self.db.execute(stmt).scalars().all())

    def set_product_attribute(
        self,
        product_id: int,
        attribute_id: int,
        value: Any
    ) -> ProductAttributeValue:
        """Set an attribute value for a product (create or update)."""
        # Verify attribute exists
        attribute = self.get_attribute_by_id(attribute_id)
        if not attribute:
            raise ProductAttributeNotFoundError(f"Attribute with ID {attribute_id} not found")

        # Verify product exists
        product_stmt = select(Product).where(Product.prd_id == product_id)
        product = self.db.execute(product_stmt).scalar_one_or_none()
        if not product:
            raise ProductAttributeValidationError(f"Product with ID {product_id} not found")

        # Check if value already exists
        existing = self.get_product_attribute_value(product_id, attribute_id)

        if existing:
            # Update existing value
            self._set_value_by_type(existing, attribute.pat_data_type, value)
            existing.pav_d_update = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing
        else:
            # Create new value
            attr_value = ProductAttributeValue(
                prd_id=product_id,
                pat_id=attribute_id,
                pav_d_creation=datetime.utcnow(),
                pav_d_update=datetime.utcnow()
            )
            self._set_value_by_type(attr_value, attribute.pat_data_type, value)

            self.db.add(attr_value)
            self.db.commit()
            self.db.refresh(attr_value)
            return attr_value

    def delete_product_attribute(self, product_id: int, attribute_id: int) -> bool:
        """Delete an attribute value from a product."""
        existing = self.get_product_attribute_value(product_id, attribute_id)
        if not existing:
            raise ProductAttributeValueNotFoundError(
                f"Attribute value not found for product {product_id} and attribute {attribute_id}"
            )

        self.db.delete(existing)
        self.db.commit()
        return True

    def batch_update_product_attributes(
        self,
        product_id: int,
        values: List[ProductAttributeValueCreate]
    ) -> List[ProductAttributeValue]:
        """Batch update multiple attribute values for a product."""
        results = []
        for value_data in values:
            result = self.set_product_attribute(
                product_id=product_id,
                attribute_id=value_data.pat_id,
                value=value_data.value
            )
            results.append(result)
        return results

    # -------------------------------------------------------------------------
    # Helper Methods
    # -------------------------------------------------------------------------

    def _set_value_by_type(
        self,
        attr_value: ProductAttributeValue,
        data_type: str,
        value: Any
    ):
        """Set the appropriate value field based on data type."""
        # Clear all value fields first
        attr_value.pav_value_text = None
        attr_value.pav_value_number = None
        attr_value.pav_value_boolean = None
        attr_value.pav_value_date = None

        if value is None:
            return

        if data_type == AttributeDataType.TEXT.value or data_type == AttributeDataType.SELECT.value:
            attr_value.pav_value_text = str(value)
        elif data_type == AttributeDataType.NUMBER.value:
            attr_value.pav_value_number = Decimal(str(value))
        elif data_type == AttributeDataType.BOOLEAN.value:
            attr_value.pav_value_boolean = bool(value)
        elif data_type == AttributeDataType.DATE.value:
            if isinstance(value, datetime):
                attr_value.pav_value_date = value
            elif isinstance(value, str):
                attr_value.pav_value_date = datetime.fromisoformat(value.replace('Z', '+00:00'))
            else:
                attr_value.pav_value_date = value
        else:
            attr_value.pav_value_text = str(value)

    def to_response(self, attr: ProductAttribute) -> dict:
        """Convert attribute model to response dict."""
        options = None
        if attr.pat_options:
            try:
                options = json.loads(attr.pat_options)
            except (json.JSONDecodeError, TypeError):
                options = None

        return {
            "pat_id": attr.pat_id,
            "pat_code": attr.pat_code,
            "pat_name": attr.pat_name,
            "pat_description": attr.pat_description,
            "pat_data_type": attr.pat_data_type,
            "pat_options": options,
            "pat_unit": attr.pat_unit,
            "pat_is_required": attr.pat_is_required,
            "pat_is_filterable": attr.pat_is_filterable,
            "pat_is_visible": attr.pat_is_visible,
            "pat_sort_order": attr.pat_sort_order,
            "soc_id": attr.soc_id,
            "pat_d_creation": attr.pat_d_creation,
            "pat_d_update": attr.pat_d_update,
            "pat_isactive": attr.pat_isactive,
        }

    def value_to_response(self, attr_value: ProductAttributeValue) -> dict:
        """Convert attribute value model to response dict."""
        return {
            "pav_id": attr_value.pav_id,
            "prd_id": attr_value.prd_id,
            "pat_id": attr_value.pat_id,
            "value": attr_value.value,
            "display_value": attr_value.display_value,
            "pav_d_creation": attr_value.pav_d_creation,
            "pav_d_update": attr_value.pav_d_update,
            "attribute_code": attr_value.attribute.pat_code if attr_value.attribute else None,
            "attribute_name": attr_value.attribute.pat_name if attr_value.attribute else None,
            "attribute_data_type": attr_value.attribute.pat_data_type if attr_value.attribute else None,
            "attribute_unit": attr_value.attribute.pat_unit if attr_value.attribute else None,
        }


# =============================================================================
# Factory Function and Async Wrappers
# =============================================================================


def get_product_attribute_service(db: Session) -> ProductAttributeService:
    """Factory function for ProductAttributeService."""
    return ProductAttributeService(db)


async def get_attributes_async(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    **filters
) -> Tuple[List[ProductAttribute], int]:
    """Async wrapper for get_attributes."""
    service = ProductAttributeService(db)
    return await asyncio.to_thread(
        service.get_attributes,
        page=page,
        page_size=page_size,
        **filters
    )


async def create_attribute_async(
    db: Session,
    data: ProductAttributeCreate
) -> ProductAttribute:
    """Async wrapper for create_attribute."""
    service = ProductAttributeService(db)
    return await asyncio.to_thread(service.create_attribute, data)


async def get_product_attributes_async(
    db: Session,
    product_id: int
) -> List[ProductAttributeValue]:
    """Async wrapper for get_product_attributes."""
    service = ProductAttributeService(db)
    return await asyncio.to_thread(service.get_product_attributes, product_id)


async def set_product_attribute_async(
    db: Session,
    product_id: int,
    attribute_id: int,
    value: Any
) -> ProductAttributeValue:
    """Async wrapper for set_product_attribute."""
    service = ProductAttributeService(db)
    return await asyncio.to_thread(
        service.set_product_attribute,
        product_id,
        attribute_id,
        value
    )

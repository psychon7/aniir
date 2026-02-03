"""
Repository for Product data access operations.
Uses synchronous Session (pymssql with asyncio.to_thread for async compatibility).
"""
from typing import Optional, List, Tuple
from decimal import Decimal
from datetime import datetime
from sqlalchemy import select, func, and_, or_, update, delete
from sqlalchemy.orm import Session, selectinload

from app.models.product import Product, ProductInstance
from app.schemas.product import (
    ProductCreate, ProductUpdate,
    ProductInstanceCreate, ProductInstanceUpdate,
    ProductSearchParams
)


class ProductRepository:
    """Repository for product related data operations (sync version)."""

    def __init__(self, db: Session):
        self.db = db

    # =====================
    # Product Operations
    # =====================

    def create_product(self, data: ProductCreate) -> Product:
        """Create a new product."""
        product = Product(
            soc_id=data.soc_id,
            pty_id=data.pty_id,
            prd_ref=data.prd_ref,
            prd_name=data.prd_name,
            prd_sub_name=data.prd_sub_name,
            prd_description=data.prd_description,
            prd_code=data.prd_code,
            prd_price=data.prd_price,
            prd_purchase_price=data.prd_purchase_price,
            prd_file_name=data.prd_file_name,
            prd_specifications=data.prd_specifications,
            # Physical dimensions
            prd_outside_diameter=data.prd_outside_diameter,
            prd_length=data.prd_length,
            prd_width=data.prd_width,
            prd_height=data.prd_height,
            prd_hole_size=data.prd_hole_size,
            prd_depth=data.prd_depth,
            prd_weight=data.prd_weight,
            # Unit dimensions
            prd_unit_length=data.prd_unit_length,
            prd_unit_width=data.prd_unit_width,
            prd_unit_height=data.prd_unit_height,
            prd_unit_weight=data.prd_unit_weight,
            # Carton dimensions
            prd_quantity_each_carton=data.prd_quantity_each_carton,
            prd_carton_length=data.prd_carton_length,
            prd_carton_width=data.prd_carton_width,
            prd_carton_height=data.prd_carton_height,
            prd_carton_weight=data.prd_carton_weight,
            # Timestamps
            prd_d_creation=datetime.utcnow()
        )

        self.db.add(product)
        self.db.flush()
        self.db.refresh(product)
        return product

    def get_product(self, product_id: int) -> Optional[Product]:
        """Get a product by ID with instances."""
        result = self.db.execute(
            select(Product)
            .options(selectinload(Product.instances))
            .where(Product.prd_id == product_id)
        )
        return result.scalar_one_or_none()

    def get_product_by_ref(
        self,
        reference: str,
        soc_id: int
    ) -> Optional[Product]:
        """Get a product by reference code within a society."""
        result = self.db.execute(
            select(Product)
            .where(
                and_(
                    Product.prd_ref == reference,
                    Product.soc_id == soc_id
                )
            )
        )
        return result.scalar_one_or_none()

    def get_product_by_code(
        self,
        code: str,
        soc_id: int
    ) -> Optional[Product]:
        """Get a product by code within a society."""
        result = self.db.execute(
            select(Product)
            .where(
                and_(
                    Product.prd_code == code,
                    Product.soc_id == soc_id
                )
            )
        )
        return result.scalar_one_or_none()

    def update_product(
        self,
        product_id: int,
        data: ProductUpdate
    ) -> Optional[Product]:
        """Update a product."""
        product = self.get_product(product_id)
        if not product:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(product, field, value)

        product.prd_d_update = datetime.utcnow()
        self.db.flush()
        self.db.refresh(product)
        return product

    def delete_product(self, product_id: int) -> bool:
        """Delete a product and all related instances."""
        product = self.get_product(product_id)
        if not product:
            return False

        self.db.delete(product)
        self.db.flush()
        return True

    def search_products(
        self,
        params: ProductSearchParams
    ) -> Tuple[List[Product], int]:
        """Search products with filters and pagination."""
        query = select(Product)
        count_query = select(func.count(Product.prd_id))

        conditions = []

        # Text search across multiple fields
        if params.search:
            search_term = f"%{params.search}%"
            conditions.append(
                or_(
                    Product.prd_name.ilike(search_term),
                    Product.prd_ref.ilike(search_term),
                    Product.prd_code.ilike(search_term),
                    Product.prd_description.ilike(search_term)
                )
            )

        if params.pty_id:
            conditions.append(Product.pty_id == params.pty_id)
        if params.soc_id:
            conditions.append(Product.soc_id == params.soc_id)
        if params.min_price is not None:
            conditions.append(Product.prd_price >= params.min_price)
        if params.max_price is not None:
            conditions.append(Product.prd_price <= params.max_price)

        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))

        # Sorting
        sort_field = params.sort_by or "prd_name"
        sort_column = getattr(Product, sort_field, Product.prd_name)
        if params.sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        query = query.offset(params.skip).limit(params.limit)

        # Execute queries
        result = self.db.execute(query)
        products = list(result.scalars().all())

        count_result = self.db.execute(count_query)
        total = count_result.scalar_one()

        return products, total

    def get_products_by_society(
        self,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Product]:
        """Get all products for a society."""
        result = self.db.execute(
            select(Product)
            .where(Product.soc_id == soc_id)
            .order_by(Product.prd_name)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def get_products_by_type(
        self,
        pty_id: int,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[Product]:
        """Get all products of a specific type."""
        result = self.db.execute(
            select(Product)
            .where(
                and_(
                    Product.pty_id == pty_id,
                    Product.soc_id == soc_id
                )
            )
            .order_by(Product.prd_name)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    def count_products(self, soc_id: Optional[int] = None) -> int:
        """Count total products, optionally filtered by society."""
        query = select(func.count(Product.prd_id))
        if soc_id:
            query = query.where(Product.soc_id == soc_id)
        result = self.db.execute(query)
        return result.scalar_one()

    def check_reference_exists(
        self,
        reference: str,
        soc_id: int,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if a product reference already exists."""
        query = select(func.count(Product.prd_id)).where(
            and_(
                Product.prd_ref == reference,
                Product.soc_id == soc_id
            )
        )
        if exclude_id:
            query = query.where(Product.prd_id != exclude_id)
        result = self.db.execute(query)
        return result.scalar_one() > 0

    # =====================
    # Product Instance Operations
    # =====================

    def create_instance(
        self,
        data: ProductInstanceCreate
    ) -> ProductInstance:
        """Create a new product instance."""
        instance = ProductInstance(
            prd_id=data.prd_id,
            pty_id=data.pty_id,
            pit_ref=data.pit_ref,
            pit_description=data.pit_description,
            pit_price=data.pit_price,
            pit_purchase_price=data.pit_purchase_price,
            pit_inventory_threshold=data.pit_inventory_threshold
        )

        self.db.add(instance)
        self.db.flush()
        self.db.refresh(instance)
        return instance

    def get_instance(self, instance_id: int) -> Optional[ProductInstance]:
        """Get a product instance by ID."""
        result = self.db.execute(
            select(ProductInstance)
            .options(selectinload(ProductInstance.product))
            .where(ProductInstance.pit_id == instance_id)
        )
        return result.scalar_one_or_none()

    def get_instance_by_ref(
        self,
        reference: str,
        product_id: int
    ) -> Optional[ProductInstance]:
        """Get a product instance by reference within a product."""
        result = self.db.execute(
            select(ProductInstance)
            .where(
                and_(
                    ProductInstance.pit_ref == reference,
                    ProductInstance.prd_id == product_id
                )
            )
        )
        return result.scalar_one_or_none()

    def update_instance(
        self,
        instance_id: int,
        data: ProductInstanceUpdate
    ) -> Optional[ProductInstance]:
        """Update a product instance."""
        instance = self.get_instance(instance_id)
        if not instance:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(instance, field, value)

        self.db.flush()
        self.db.refresh(instance)
        return instance

    def delete_instance(self, instance_id: int) -> bool:
        """Delete a product instance."""
        instance = self.get_instance(instance_id)
        if not instance:
            return False

        self.db.delete(instance)
        self.db.flush()
        return True

    def get_instances_by_product(
        self,
        product_id: int
    ) -> List[ProductInstance]:
        """Get all instances for a product."""
        result = self.db.execute(
            select(ProductInstance)
            .where(ProductInstance.prd_id == product_id)
            .order_by(ProductInstance.pit_ref)
        )
        return list(result.scalars().all())

    def count_instances(self, product_id: int) -> int:
        """Count instances for a product."""
        result = self.db.execute(
            select(func.count(ProductInstance.pit_id))
            .where(ProductInstance.prd_id == product_id)
        )
        return result.scalar_one()

    def check_instance_ref_exists(
        self,
        reference: str,
        product_id: int,
        exclude_id: Optional[int] = None
    ) -> bool:
        """Check if an instance reference already exists for a product."""
        query = select(func.count(ProductInstance.pit_id)).where(
            and_(
                ProductInstance.pit_ref == reference,
                ProductInstance.prd_id == product_id
            )
        )
        if exclude_id:
            query = query.where(ProductInstance.pit_id != exclude_id)
        result = self.db.execute(query)
        return result.scalar_one() > 0

    # =====================
    # Bulk Operations
    # =====================

    def bulk_create_instances(
        self,
        product_id: int,
        instances_data: List[ProductInstanceCreate]
    ) -> List[ProductInstance]:
        """Create multiple product instances."""
        instances = []
        for data in instances_data:
            data.prd_id = product_id
            instance = self.create_instance(data)
            instances.append(instance)
        return instances

    def delete_instances_by_product(self, product_id: int) -> int:
        """Delete all instances for a product."""
        result = self.db.execute(
            delete(ProductInstance)
            .where(ProductInstance.prd_id == product_id)
        )
        self.db.flush()
        return result.rowcount

    # =====================
    # Lookup Operations
    # =====================

    def get_product_lookup(
        self,
        soc_id: int,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """
        Get products for dropdown/lookup.
        Returns lightweight data for search/selection.
        """
        query = select(
            Product.prd_id,
            Product.prd_ref,
            Product.prd_name,
            Product.prd_code,
            Product.prd_price
        ).where(Product.soc_id == soc_id)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Product.prd_name.ilike(search_term),
                    Product.prd_ref.ilike(search_term),
                    Product.prd_code.ilike(search_term)
                )
            )

        query = query.order_by(Product.prd_name).limit(limit)

        result = self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.prd_id,
                "reference": row.prd_ref,
                "name": row.prd_name,
                "code": row.prd_code,
                "price": row.prd_price,
                "display_name": f"{row.prd_ref} - {row.prd_name}"
            }
            for row in rows
        ]

    def get_instance_lookup(
        self,
        product_id: int,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """
        Get product instances for dropdown/lookup.
        """
        query = select(
            ProductInstance.pit_id,
            ProductInstance.pit_ref,
            ProductInstance.pit_description,
            ProductInstance.pit_price
        ).where(ProductInstance.prd_id == product_id)

        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    ProductInstance.pit_ref.ilike(search_term),
                    ProductInstance.pit_description.ilike(search_term)
                )
            )

        query = query.order_by(ProductInstance.pit_ref).limit(limit)

        result = self.db.execute(query)
        rows = result.all()

        return [
            {
                "id": row.pit_id,
                "reference": row.pit_ref,
                "description": row.pit_description,
                "price": row.pit_price,
                "display_name": f"{row.pit_ref} - {row.pit_description}" if row.pit_description else row.pit_ref
            }
            for row in rows
        ]

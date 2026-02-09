"""
Product Service for managing products and product instances.

Uses synchronous pymssql with asyncio.to_thread() for async compatibility.

This service provides business logic for:
- Product CRUD operations
- Product instance management
- Product search and lookup
"""
import asyncio
from typing import Optional, List, Tuple
from decimal import Decimal
import logging

from sqlalchemy import select, func, text
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models.product import Product, ProductInstance
from app.models.product_type import ProductType
from app.repositories.product_repository import ProductRepository
from app.schemas.product import (
    ProductCreate, ProductUpdate,
    ProductInstanceCreate, ProductInstanceUpdate,
    ProductSearchParams, ProductResponse, ProductWithInstancesResponse,
    ProductListResponse, ProductListPaginatedResponse,
    ProductDetailResponse,
    ProductInstanceResponse, ProductInstanceListResponse,
    ProductInstanceListPaginatedResponse
)

logger = logging.getLogger(__name__)


class ProductServiceError(Exception):
    """Base exception for product service errors."""
    pass


class ProductNotFoundError(ProductServiceError):
    """Raised when a product is not found."""
    pass


class ProductInstanceNotFoundError(ProductServiceError):
    """Raised when a product instance is not found."""
    pass


class ProductDuplicateReferenceError(ProductServiceError):
    """Raised when a product reference already exists."""
    pass


class ProductInstanceDuplicateReferenceError(ProductServiceError):
    """Raised when a product instance reference already exists."""
    pass


class ProductService:
    """
    Service for managing products.

    Products represent items in the catalog with specifications,
    pricing, and physical attributes. Products can have multiple
    instances (variants) for different configurations.
    
    Uses sync Session with asyncio.to_thread() for async compatibility.
    """

    def __init__(self, db: Session):
        self.db = db
        self.repository = ProductRepository(db)

    # =====================
    # Sync Internal Methods
    # =====================

    def _sync_create_product(self, data: ProductCreate) -> ProductWithInstancesResponse:
        """Sync: Create a new product."""
        if self.repository.check_reference_exists(data.prd_ref, data.soc_id):
            raise ProductDuplicateReferenceError(
                f"Product with reference '{data.prd_ref}' already exists"
            )

        product = self.repository.create_product(data)
        return self._product_to_detail_response(product)

    def _sync_get_product(self, product_id: int) -> ProductWithInstancesResponse:
        """Sync: Get a product by ID with all instances."""
        product = self.repository.get_product(product_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")
        return self._product_to_detail_response(product)

    def _sync_get_product_detail(self, product_id: int) -> ProductDetailResponse:
        """Sync: Get a product by ID with resolved lookup names."""
        product = self.repository.get_product(product_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")

        # Build response — instances already loaded via selectinload in get_product()
        response = ProductDetailResponse.model_validate(product)

        # Resolve society name via lightweight text query (avoids loading Society + users)
        try:
            row = self.db.execute(
                text("SELECT soc_society_name FROM TR_SOC_Society WHERE soc_id = :soc_id"),
                {"soc_id": product.soc_id}
            ).first()
            if row:
                response.societyName = row[0]
        except Exception:
            logger.debug("Could not resolve society name for soc_id=%s", product.soc_id)

        # Resolve product type name
        try:
            row = self.db.execute(
                text("SELECT pty_name FROM TM_PTY_Product_Type WHERE pty_id = :pty_id"),
                {"pty_id": product.pty_id}
            ).first()
            if row:
                response.productTypeName = row[0]
                response.categoryName = row[0]
        except Exception:
            logger.debug("Could not resolve product type name for pty_id=%s", product.pty_id)

        # Stock quantity from inventory
        try:
            stock_row = self.db.execute(
                text(
                    "SELECT ISNULL(SUM(ISNULL(inv_quantity, 0)), 0) as total_stock "
                    "FROM TM_INV_Inventory WHERE prd_id = :prd_id"
                ),
                {"prd_id": product.prd_id}
            ).first()
            response.stockQuantity = int(stock_row[0]) if stock_row and stock_row[0] else 0
        except Exception:
            response.stockQuantity = 0

        return response

    def _sync_get_product_by_ref(
        self,
        reference: str,
        soc_id: int
    ) -> ProductWithInstancesResponse:
        """Sync: Get a product by reference."""
        product = self.repository.get_product_by_ref(reference, soc_id)
        if not product:
            raise ProductNotFoundError(
                f"Product with reference '{reference}' not found"
            )
        return self._product_to_detail_response(product)

    def _sync_update_product(
        self,
        product_id: int,
        data: ProductUpdate
    ) -> ProductWithInstancesResponse:
        """Sync: Update a product."""
        product = self.repository.get_product(product_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")

        # Check for duplicate reference if reference is being updated
        if data.prd_ref and data.prd_ref != product.prd_ref:
            if self.repository.check_reference_exists(
                data.prd_ref, product.soc_id, exclude_id=product_id
            ):
                raise ProductDuplicateReferenceError(
                    f"Product with reference '{data.prd_ref}' already exists"
                )

        product = self.repository.update_product(product_id, data)
        return self._product_to_detail_response(product)

    def _sync_delete_product(self, product_id: int) -> bool:
        """Sync: Delete a product and all its instances."""
        deleted = self.repository.delete_product(product_id)
        if not deleted:
            raise ProductNotFoundError(f"Product {product_id} not found")
        return True

    def _sync_search_products(
        self,
        params: ProductSearchParams
    ) -> Tuple[List[dict], int]:
        """Sync: Search products with filters and pagination, enriched with category/stock."""
        products, total = self.repository.search_products(params)
        enriched = self._enrich_product_list(products)
        return enriched, total

    def _enrich_product_list(self, products: List[Product]) -> List[dict]:
        """Enrich products with product type name (category) and stock quantity."""
        if not products:
            return []

        prd_ids = [p.prd_id for p in products]
        pty_ids = list({p.pty_id for p in products})

        # Batch fetch product type names (acts as category in legacy)
        pty_map: dict[int, str] = {}
        if pty_ids:
            rows = self.db.execute(
                select(ProductType.pty_id, ProductType.pty_name)
                .where(ProductType.pty_id.in_(pty_ids))
            ).all()
            pty_map = {r.pty_id: r.pty_name for r in rows}

        # Batch fetch stock quantities from TM_INV_Inventory
        stock_map: dict[int, int] = {}
        if prd_ids:
            try:
                # Use ORM query to avoid text() IN-clause issues with pymssql
                from app.models.inventory import Inventory
                rows = self.db.execute(
                    select(Inventory.prd_id, func.sum(Inventory.inv_quantity).label("total_stock"))
                    .where(Inventory.prd_id.in_(prd_ids))
                    .group_by(Inventory.prd_id)
                ).all()
                stock_map = {r.prd_id: int(r.total_stock or 0) for r in rows}
            except Exception:
                # Table may not have data or model may differ — gracefully default
                pass

        # Build enriched dicts
        enriched = []
        for p in products:
            item = ProductListResponse.model_validate(p)
            item.categoryName = pty_map.get(p.pty_id)
            item.stockQuantity = stock_map.get(p.prd_id)
            enriched.append(item)

        return enriched

    def _sync_get_products_by_society(
        self,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[ProductListResponse]:
        """Sync: Get all products for a society."""
        products = self.repository.get_products_by_society(soc_id, skip, limit)
        return [ProductListResponse.model_validate(p) for p in products]

    def _sync_get_products_by_type(
        self,
        pty_id: int,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[ProductListResponse]:
        """Sync: Get all products of a specific type."""
        products = self.repository.get_products_by_type(pty_id, soc_id, skip, limit)
        return [ProductListResponse.model_validate(p) for p in products]

    def _sync_count_products(self, soc_id: Optional[int] = None) -> int:
        """Sync: Count total products."""
        return self.repository.count_products(soc_id)

    # Instance operations
    def _sync_create_instance(self, data: ProductInstanceCreate) -> ProductInstanceResponse:
        """Sync: Create a new product instance."""
        product = self.repository.get_product(data.prd_id)
        if not product:
            raise ProductNotFoundError(f"Product {data.prd_id} not found")

        if data.pit_ref and self.repository.check_instance_ref_exists(
            data.pit_ref, data.prd_id
        ):
            raise ProductInstanceDuplicateReferenceError(
                f"Instance with reference '{data.pit_ref}' already exists for product"
            )

        instance = self.repository.create_instance(data)
        return ProductInstanceResponse.model_validate(instance)

    def _sync_get_instance(self, instance_id: int) -> ProductInstanceResponse:
        """Sync: Get a product instance by ID."""
        instance = self.repository.get_instance(instance_id)
        if not instance:
            raise ProductInstanceNotFoundError(f"Instance {instance_id} not found")
        return ProductInstanceResponse.model_validate(instance)

    def _sync_update_instance(
        self,
        instance_id: int,
        data: ProductInstanceUpdate
    ) -> ProductInstanceResponse:
        """Sync: Update a product instance."""
        instance = self.repository.get_instance(instance_id)
        if not instance:
            raise ProductInstanceNotFoundError(f"Instance {instance_id} not found")

        if data.pit_ref and data.pit_ref != instance.pit_ref:
            if self.repository.check_instance_ref_exists(
                data.pit_ref, instance.prd_id, exclude_id=instance_id
            ):
                raise ProductInstanceDuplicateReferenceError(
                    f"Instance with reference '{data.pit_ref}' already exists for product"
                )

        instance = self.repository.update_instance(instance_id, data)
        return ProductInstanceResponse.model_validate(instance)

    def _sync_delete_instance(self, instance_id: int) -> bool:
        """Sync: Delete a product instance."""
        deleted = self.repository.delete_instance(instance_id)
        if not deleted:
            raise ProductInstanceNotFoundError(f"Instance {instance_id} not found")
        return True

    def _sync_get_instances_by_product(self, product_id: int) -> List[ProductInstanceResponse]:
        """Sync: Get all instances for a product."""
        product = self.repository.get_product(product_id)
        if not product:
            raise ProductNotFoundError(f"Product {product_id} not found")

        instances = self.repository.get_instances_by_product(product_id)
        return [ProductInstanceResponse.model_validate(i) for i in instances]

    def _sync_get_product_lookup(
        self,
        soc_id: int,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """Sync: Get products for dropdown/lookup."""
        return self.repository.get_product_lookup(soc_id, search, limit)

    def _sync_get_instance_lookup(
        self,
        product_id: int,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """Sync: Get product instances for dropdown/lookup."""
        return self.repository.get_instance_lookup(product_id, search, limit)

    def _product_to_detail_response(self, product: Product) -> ProductWithInstancesResponse:
        """Convert a Product to ProductWithInstancesResponse."""
        instances = self.repository.get_instances_by_product(product.prd_id)

        return ProductWithInstancesResponse(
            prd_id=product.prd_id,
            soc_id=product.soc_id,
            pty_id=product.pty_id,
            prd_ref=product.prd_ref,
            prd_name=product.prd_name,
            prd_sub_name=product.prd_sub_name,
            prd_description=product.prd_description,
            prd_code=product.prd_code,
            prd_price=product.prd_price,
            prd_purchase_price=product.prd_purchase_price,
            prd_file_name=product.prd_file_name,
            prd_d_creation=product.prd_d_creation,
            prd_d_update=product.prd_d_update,
            # Physical dimensions
            prd_outside_diameter=product.prd_outside_diameter,
            prd_interior_length=product.prd_interior_length,
            prd_interior_width=product.prd_interior_width,
            prd_opening_diameter=product.prd_opening_diameter,
            prd_thickness=product.prd_thickness,
            prd_length=product.prd_length,
            prd_width=product.prd_width,
            prd_height=product.prd_height,
            prd_hole_size=product.prd_hole_size,
            prd_depth=product.prd_depth,
            prd_weight=product.prd_weight,
            # Unit dimensions
            prd_unit_length=product.prd_unit_length,
            prd_unit_width=product.prd_unit_width,
            prd_unit_height=product.prd_unit_height,
            prd_unit_weight=product.prd_unit_weight,
            # Carton dimensions
            prd_quantity_each_carton=product.prd_quantity_each_carton,
            prd_carton_length=product.prd_carton_length,
            prd_carton_width=product.prd_carton_width,
            prd_carton_height=product.prd_carton_height,
            prd_carton_weight=product.prd_carton_weight,
            # Instances
            instances=[
                ProductInstanceResponse.model_validate(i) for i in instances
            ]
        )

    # =====================
    # Async Public Methods (using asyncio.to_thread)
    # =====================

    async def create_product(self, data: ProductCreate) -> ProductWithInstancesResponse:
        """Create a new product."""
        return await asyncio.to_thread(self._sync_create_product, data)

    async def get_product(self, product_id: int) -> ProductWithInstancesResponse:
        """Get a product by ID with all instances."""
        return await asyncio.to_thread(self._sync_get_product, product_id)

    async def get_product_detail(self, product_id: int) -> ProductDetailResponse:
        """Get a product by ID with resolved lookup names."""
        return await asyncio.to_thread(self._sync_get_product_detail, product_id)

    async def get_product_by_ref(
        self,
        reference: str,
        soc_id: int
    ) -> ProductWithInstancesResponse:
        """Get a product by reference."""
        return await asyncio.to_thread(self._sync_get_product_by_ref, reference, soc_id)

    async def update_product(
        self,
        product_id: int,
        data: ProductUpdate
    ) -> ProductWithInstancesResponse:
        """Update a product."""
        return await asyncio.to_thread(self._sync_update_product, product_id, data)

    async def delete_product(self, product_id: int) -> bool:
        """Delete a product and all its instances."""
        return await asyncio.to_thread(self._sync_delete_product, product_id)

    async def search_products(
        self,
        params: ProductSearchParams
    ) -> Tuple[List, int]:
        """Search products with filters and pagination."""
        return await asyncio.to_thread(self._sync_search_products, params)

    async def get_products_by_society(
        self,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[ProductListResponse]:
        """Get all products for a society."""
        return await asyncio.to_thread(self._sync_get_products_by_society, soc_id, skip, limit)

    async def get_products_by_type(
        self,
        pty_id: int,
        soc_id: int,
        skip: int = 0,
        limit: int = 50
    ) -> List[ProductListResponse]:
        """Get all products of a specific type."""
        return await asyncio.to_thread(self._sync_get_products_by_type, pty_id, soc_id, skip, limit)

    async def count_products(self, soc_id: Optional[int] = None) -> int:
        """Count total products."""
        return await asyncio.to_thread(self._sync_count_products, soc_id)

    # Instance operations
    async def create_instance(self, data: ProductInstanceCreate) -> ProductInstanceResponse:
        """Create a new product instance."""
        return await asyncio.to_thread(self._sync_create_instance, data)

    async def get_instance(self, instance_id: int) -> ProductInstanceResponse:
        """Get a product instance by ID."""
        return await asyncio.to_thread(self._sync_get_instance, instance_id)

    async def update_instance(
        self,
        instance_id: int,
        data: ProductInstanceUpdate
    ) -> ProductInstanceResponse:
        """Update a product instance."""
        return await asyncio.to_thread(self._sync_update_instance, instance_id, data)

    async def delete_instance(self, instance_id: int) -> bool:
        """Delete a product instance."""
        return await asyncio.to_thread(self._sync_delete_instance, instance_id)

    async def get_instances_by_product(self, product_id: int) -> List[ProductInstanceResponse]:
        """Get all instances for a product."""
        return await asyncio.to_thread(self._sync_get_instances_by_product, product_id)

    async def get_product_lookup(
        self,
        soc_id: int,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """Get products for dropdown/lookup."""
        return await asyncio.to_thread(self._sync_get_product_lookup, soc_id, search, limit)

    async def get_instance_lookup(
        self,
        product_id: int,
        search: Optional[str] = None,
        limit: int = 50
    ) -> List[dict]:
        """Get product instances for dropdown/lookup."""
        return await asyncio.to_thread(self._sync_get_instance_lookup, product_id, search, limit)


# Dependency injection function
def get_product_service(db: Session = Depends(get_db)) -> ProductService:
    """Get product service instance."""
    return ProductService(db)

"""
Brand Service.

Provides business logic for brand management.
"""
import asyncio
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_, func

from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate, BrandLookupItem


# ==========================================================================
# Exception Classes
# ==========================================================================

class BrandServiceError(Exception):
    """Base exception for brand service errors."""
    pass


class BrandNotFoundError(BrandServiceError):
    """Raised when a brand is not found."""
    pass


class BrandDuplicateCodeError(BrandServiceError):
    """Raised when a brand code already exists."""
    pass


# ==========================================================================
# Brand Service
# ==========================================================================

class BrandService:
    """Service for managing brands."""

    def __init__(self, db: Session):
        self.db = db

    def get_brand(self, brand_id: int) -> Brand:
        """Get a brand by ID."""
        brand = self.db.query(Brand).filter(Brand.bra_id == brand_id).first()
        if not brand:
            raise BrandNotFoundError(f"Brand with ID {brand_id} not found")
        return brand

    def get_brands(
        self,
        soc_id: Optional[int] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: str = "bra_name",
        sort_order: str = "asc"
    ) -> Tuple[List[Brand], int]:
        """Get brands with optional filtering, pagination, and sorting."""
        query = self.db.query(Brand)

        # Apply filters
        if soc_id:
            query = query.filter(Brand.soc_id == soc_id)

        if is_active is not None:
            query = query.filter(Brand.bra_isactive == is_active)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Brand.bra_code.ilike(search_pattern),
                    Brand.bra_name.ilike(search_pattern),
                    Brand.bra_description.ilike(search_pattern)
                )
            )

        # Get total count before pagination
        total = query.count()

        # Apply sorting
        sort_column = getattr(Brand, sort_by, Brand.bra_name)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Apply pagination
        brands = query.offset(skip).limit(limit).all()

        return brands, total

    def get_brands_lookup(self, soc_id: Optional[int] = None) -> List[BrandLookupItem]:
        """Get active brands for lookup/dropdown."""
        query = self.db.query(Brand).filter(Brand.bra_isactive == True)
        if soc_id:
            query = query.filter(Brand.soc_id == soc_id)
        query = query.order_by(Brand.bra_name.asc())

        brands = query.all()
        return [BrandLookupItem.from_brand(b) for b in brands]

    def search_brands(self, query: str, soc_id: Optional[int] = None, limit: int = 20) -> List[Brand]:
        """Search brands by name or code."""
        search_pattern = f"%{query}%"
        q = self.db.query(Brand).filter(
            Brand.bra_isactive == True,
            or_(
                Brand.bra_code.ilike(search_pattern),
                Brand.bra_name.ilike(search_pattern)
            )
        )
        if soc_id:
            q = q.filter(Brand.soc_id == soc_id)
        return q.order_by(Brand.bra_name.asc()).limit(limit).all()

    def create_brand(self, data: BrandCreate, soc_id: int) -> Brand:
        """Create a new brand."""
        # Check for duplicate code
        existing = self.db.query(Brand).filter(
            and_(
                Brand.bra_code == data.bra_code,
                Brand.soc_id == soc_id
            )
        ).first()

        if existing:
            raise BrandDuplicateCodeError(f"Brand with code '{data.bra_code}' already exists")

        brand = Brand(
            soc_id=soc_id,
            bra_code=data.bra_code,
            bra_name=data.bra_name,
            bra_description=data.bra_description,
            bra_isactive=data.bra_isactive if data.bra_isactive is not None else True
        )

        self.db.add(brand)
        self.db.commit()
        self.db.refresh(brand)

        return brand

    def update_brand(self, brand_id: int, data: BrandUpdate) -> Brand:
        """Update an existing brand."""
        brand = self.get_brand(brand_id)

        # Check for duplicate code if changing
        if data.bra_code and data.bra_code != brand.bra_code:
            existing = self.db.query(Brand).filter(
                and_(
                    Brand.bra_code == data.bra_code,
                    Brand.soc_id == brand.soc_id,
                    Brand.bra_id != brand_id
                )
            ).first()
            if existing:
                raise BrandDuplicateCodeError(f"Brand with code '{data.bra_code}' already exists")

        # Update fields
        if data.bra_code is not None:
            brand.bra_code = data.bra_code
        if data.bra_name is not None:
            brand.bra_name = data.bra_name
        if data.bra_description is not None:
            brand.bra_description = data.bra_description
        if data.bra_isactive is not None:
            brand.bra_isactive = data.bra_isactive

        self.db.commit()
        self.db.refresh(brand)

        return brand

    def delete_brand(self, brand_id: int) -> None:
        """Delete a brand (soft delete by setting inactive)."""
        brand = self.get_brand(brand_id)
        brand.bra_isactive = False
        self.db.commit()


# ==========================================================================
# Async Wrapper Functions
# ==========================================================================

async def async_get_brand(service: BrandService, brand_id: int) -> Brand:
    """Async wrapper for get_brand."""
    return await asyncio.to_thread(service.get_brand, brand_id)


async def async_get_brands(
    service: BrandService,
    soc_id: Optional[int] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    sort_by: str = "bra_name",
    sort_order: str = "asc"
) -> Tuple[List[Brand], int]:
    """Async wrapper for get_brands."""
    return await asyncio.to_thread(
        service.get_brands, soc_id, search, is_active, skip, limit, sort_by, sort_order
    )


async def async_get_lookup(service: BrandService, soc_id: Optional[int] = None) -> List[BrandLookupItem]:
    """Async wrapper for get_brands_lookup."""
    return await asyncio.to_thread(service.get_brands_lookup, soc_id)


async def async_search_brands(
    service: BrandService, query: str, soc_id: Optional[int] = None, limit: int = 20
) -> List[Brand]:
    """Async wrapper for search_brands."""
    return await asyncio.to_thread(service.search_brands, query, soc_id, limit)


async def async_create_brand(service: BrandService, data: BrandCreate, soc_id: int) -> Brand:
    """Async wrapper for create_brand."""
    return await asyncio.to_thread(service.create_brand, data, soc_id)


async def async_update_brand(service: BrandService, brand_id: int, data: BrandUpdate) -> Brand:
    """Async wrapper for update_brand."""
    return await asyncio.to_thread(service.update_brand, brand_id, data)


async def async_delete_brand(service: BrandService, brand_id: int) -> None:
    """Async wrapper for delete_brand."""
    return await asyncio.to_thread(service.delete_brand, brand_id)


# ==========================================================================
# Service Factory
# ==========================================================================

def get_brand_service(db: Session) -> BrandService:
    """Factory function to get BrandService instance."""
    return BrandService(db)

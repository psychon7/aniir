"""
Integration schemas package.

Exports all Shopify integration related schemas.
"""

from app.schemas.integrations.shopify_location_map import (
    ShopifyLocationMapBase,
    ShopifyLocationMapCreate,
    ShopifyLocationMapUpdate,
    ShopifyLocationMapInDB,
    ShopifyLocationMapResponse,
    ShopifyLocationMapList,
    ShopifyLocationFromAPI,
    BulkLocationMapCreate,
)

__all__ = [
    # ShopifyLocationMap schemas
    "ShopifyLocationMapBase",
    "ShopifyLocationMapCreate",
    "ShopifyLocationMapUpdate",
    "ShopifyLocationMapInDB",
    "ShopifyLocationMapResponse",
    "ShopifyLocationMapList",
    "ShopifyLocationFromAPI",
    "BulkLocationMapCreate",
]

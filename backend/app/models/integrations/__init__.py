"""
Integration models package - PARTIALLY DISABLED.

WARNING: Most integration models are disabled because their database tables
do not exist in DEV_ERP_ECOLED.

Disabled models (tables don't exist):
- ShopifyStore (TM_INT_ShopifyStore)
- ShopifyLocationMap (TM_INT_ShopifyLocationMap)
- ShopifyIntegration, ShopifyProduct, ShopifyOrder, etc. (TR_SHP_*, TM_SHP_*)
- X3CustomerMap, X3ProductMap, X3ExportLog (TM_INT_X3*)

These classes are now placeholders that raise NotImplementedError if instantiated.
Importing them is safe but they cannot be used with SQLAlchemy queries.

Disabled on: 2026-02-01
Reason: Database alignment - integration tables do not exist in production database
"""

# DISABLED: Shopify integration models - tables do not exist
# These are placeholder classes that raise NotImplementedError
from app.models.integrations.shopify_store import ShopifyStore
from app.models.integrations.shopify_location_map import ShopifyLocationMap

# DISABLED: Sage X3 integration models - tables do not exist
from app.models.integrations.sage_x3 import (
    X3CustomerMap,
    X3ProductMap,
    X3ExportLog,
    X3ExportStatus,
    X3ExportType,
)

# DISABLED: Main Shopify models - tables do not exist
from app.models.integrations.shopify import (
    ShopifyIntegration,
    ShopifyProduct,
    ShopifyOrder,
    ShopifyOrderLine,
    ShopifySyncLog,
    ShopifyWebhook,
    ShopifyOAuthState,
)

__all__ = [
    # Shopify store management (DISABLED)
    "ShopifyStore",
    "ShopifyLocationMap",
    # Shopify sync models (DISABLED)
    "ShopifyIntegration",
    "ShopifyProduct",
    "ShopifyOrder",
    "ShopifyOrderLine",
    "ShopifySyncLog",
    "ShopifyWebhook",
    "ShopifyOAuthState",
    # Sage X3 models (DISABLED)
    "X3CustomerMap",
    "X3ProductMap",
    "X3ExportLog",
    # Enums (still usable)
    "X3ExportStatus",
    "X3ExportType",
]

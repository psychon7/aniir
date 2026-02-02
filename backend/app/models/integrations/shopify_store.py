"""
ShopifyStore Model - DISABLED.

WARNING: Table TM_INT_ShopifyStore does NOT exist in the database (DEV_ERP_ECOLED).

This model has been converted to a disabled placeholder to prevent SQLAlchemy errors.

To re-enable: Create the database table, then restore the SQLAlchemy model definition.
Original model definition can be found in version control history.

Disabled on: 2026-02-01
Reason: Database alignment - table does not exist in production database
"""


class ShopifyStore:
    """
    DISABLED: Table TM_INT_ShopifyStore does not exist in the database.

    This was a model for storing Shopify store connection information and OAuth tokens.
    """
    __disabled__ = True
    __tablename__ = "TM_INT_ShopifyStore"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifyStore model is disabled - table TM_INT_ShopifyStore does not exist. "
            "Create the Shopify integration tables first."
        )

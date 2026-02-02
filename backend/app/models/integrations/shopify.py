"""
Shopify integration models - DISABLED.

WARNING: Tables TR_SHP_* and TM_SHP_* do NOT exist in the database (DEV_ERP_ECOLED).
These models have been converted to disabled placeholders to prevent SQLAlchemy errors.

Disabled tables:
- TR_SHP_Integration
- TM_SHP_Product
- TM_SHP_Order
- TM_SHP_Order_Line
- TM_SHP_Sync_Log
- TR_SHP_Webhook
- TR_SHP_OAuth_State

To re-enable: Create the database tables, then restore the SQLAlchemy model definitions.
Original model definitions can be found in version control history.

Disabled on: 2026-02-01
Reason: Database alignment - tables do not exist in production database
"""


class ShopifyIntegration:
    """
    DISABLED: Table TR_SHP_Integration does not exist in the database.

    This was a model for storing OAuth credentials and connection settings
    for Shopify stores. One integration per shop per society.
    """
    __disabled__ = True
    __tablename__ = "TR_SHP_Integration"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifyIntegration model is disabled - table TR_SHP_Integration does not exist. "
            "Create the Shopify integration tables first."
        )


class ShopifyProduct:
    """
    DISABLED: Table TM_SHP_Product does not exist in the database.

    This was a model for storing synced product data from Shopify.
    """
    __disabled__ = True
    __tablename__ = "TM_SHP_Product"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifyProduct model is disabled - table TM_SHP_Product does not exist."
        )


class ShopifyOrder:
    """
    DISABLED: Table TM_SHP_Order does not exist in the database.

    This was a model for storing synced order data from Shopify.
    """
    __disabled__ = True
    __tablename__ = "TM_SHP_Order"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifyOrder model is disabled - table TM_SHP_Order does not exist."
        )


class ShopifyOrderLine:
    """
    DISABLED: Table TM_SHP_Order_Line does not exist in the database.

    This was a model for storing individual line items from Shopify orders.
    """
    __disabled__ = True
    __tablename__ = "TM_SHP_Order_Line"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifyOrderLine model is disabled - table TM_SHP_Order_Line does not exist."
        )


class ShopifySyncLog:
    """
    DISABLED: Table TM_SHP_Sync_Log does not exist in the database.

    This was a model for tracking synchronization operations for auditing.
    """
    __disabled__ = True
    __tablename__ = "TM_SHP_Sync_Log"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifySyncLog model is disabled - table TM_SHP_Sync_Log does not exist."
        )


class ShopifyWebhook:
    """
    DISABLED: Table TR_SHP_Webhook does not exist in the database.

    This was a model for storing registered webhooks for tracking.
    """
    __disabled__ = True
    __tablename__ = "TR_SHP_Webhook"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifyWebhook model is disabled - table TR_SHP_Webhook does not exist."
        )


class ShopifyOAuthState:
    """
    DISABLED: Table TR_SHP_OAuth_State does not exist in the database.

    This was a model for temporary storage of OAuth state tokens to prevent CSRF attacks.
    """
    __disabled__ = True
    __tablename__ = "TR_SHP_OAuth_State"  # For reference only

    def __init__(self, *args, **kwargs):
        raise NotImplementedError(
            "ShopifyOAuthState model is disabled - table TR_SHP_OAuth_State does not exist."
        )

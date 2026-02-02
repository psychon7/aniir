"""
Shopify integration package.

Provides GraphQL client for interacting with Shopify Admin API with:
- execute_query(): Primary method with integrated retry + rate limiting
- Automatic rate limiting with adaptive token bucket algorithm
- Exponential backoff retry with jitter
- Comprehensive error handling
- Pre-built GraphQL queries and mutations for common operations
"""
from app.integrations.shopify.graphql_client import (
    ShopifyGraphQLClient,
    ShopifyConfig,
    QueryResult,
    ThrottleStatus,
    get_shopify_client_from_settings,
)
from app.integrations.shopify.exceptions import (
    ShopifyError,
    ShopifyAuthenticationError,
    ShopifyRateLimitError,
    ShopifyGraphQLError,
    ShopifyNetworkError,
    ShopifyValidationError,
    ShopifyResourceNotFoundError,
    ShopifyConfigurationError,
    ShopifyWebhookError,
)
from app.integrations.shopify.queries import (
    # Query registry and helpers
    QUERY_REGISTRY,
    MUTATION_REGISTRY,
    get_query,
    get_mutation,
    build_orders_query_string,
    build_products_query_string,
    build_customers_query_string,
    extract_gid,
    build_gid,
    # Shop queries
    QUERY_SHOP,
    QUERY_SHOP_LOCATIONS,
    # Product queries
    QUERY_PRODUCTS,
    QUERY_PRODUCTS_MINIMAL,
    QUERY_PRODUCT_BY_ID,
    QUERY_PRODUCT_BY_HANDLE,
    QUERY_PRODUCT_VARIANTS,
    QUERY_PRODUCTS_BY_IDS,
    QUERY_PRODUCT_COUNT,
    # Order queries
    QUERY_ORDERS,
    QUERY_ORDERS_MINIMAL,
    QUERY_ORDER_BY_ID,
    QUERY_ORDER_BY_NAME,
    QUERY_ORDERS_BY_IDS,
    QUERY_ORDER_COUNT,
    # Customer queries
    QUERY_CUSTOMERS,
    QUERY_CUSTOMERS_MINIMAL,
    QUERY_CUSTOMER_BY_ID,
    QUERY_CUSTOMER_BY_EMAIL,
    QUERY_CUSTOMERS_BY_IDS,
    QUERY_CUSTOMER_COUNT,
    # Inventory queries
    QUERY_INVENTORY_ITEMS,
    QUERY_INVENTORY_ITEM_BY_ID,
    QUERY_INVENTORY_LEVELS_AT_LOCATION,
    # Collection queries
    QUERY_COLLECTIONS,
    QUERY_COLLECTION_BY_ID,
    # Fulfillment queries
    QUERY_FULFILLMENT_ORDERS,
    QUERY_FULFILLMENTS,
    # Webhook queries
    QUERY_WEBHOOKS,
    QUERY_WEBHOOK_BY_ID,
    # Bulk operation queries
    QUERY_BULK_OPERATION_STATUS,
    # Product mutations
    MUTATION_CREATE_PRODUCT,
    MUTATION_UPDATE_PRODUCT,
    MUTATION_DELETE_PRODUCT,
    MUTATION_UPDATE_PRODUCT_VARIANT,
    MUTATION_CREATE_PRODUCT_VARIANTS_BULK,
    MUTATION_UPDATE_PRODUCT_VARIANTS_BULK,
    # Order mutations
    MUTATION_UPDATE_ORDER,
    MUTATION_CANCEL_ORDER,
    MUTATION_CLOSE_ORDER,
    MUTATION_MARK_ORDER_AS_PAID,
    MUTATION_ADD_ORDER_TAGS,
    MUTATION_REMOVE_ORDER_TAGS,
    # Customer mutations
    MUTATION_CREATE_CUSTOMER,
    MUTATION_UPDATE_CUSTOMER,
    MUTATION_DELETE_CUSTOMER,
    MUTATION_ADD_CUSTOMER_TAGS,
    # Inventory mutations
    MUTATION_ADJUST_INVENTORY,
    MUTATION_ADJUST_INVENTORY_QUANTITIES,
    MUTATION_SET_INVENTORY_ON_HAND,
    MUTATION_MOVE_INVENTORY,
    # Fulfillment mutations
    MUTATION_CREATE_FULFILLMENT,
    MUTATION_UPDATE_TRACKING,
    MUTATION_CANCEL_FULFILLMENT,
    # Webhook mutations
    MUTATION_CREATE_WEBHOOK,
    MUTATION_UPDATE_WEBHOOK,
    MUTATION_DELETE_WEBHOOK,
    # Metafield mutations
    MUTATION_SET_METAFIELDS,
    MUTATION_DELETE_METAFIELD,
    # Bulk operation mutations
    MUTATION_BULK_OPERATION_RUN,
    MUTATION_BULK_OPERATION_CANCEL,
)

__all__ = [
    # Client
    "ShopifyGraphQLClient",
    "ShopifyConfig",
    "QueryResult",
    "ThrottleStatus",
    "get_shopify_client_from_settings",
    # Exceptions
    "ShopifyError",
    "ShopifyAuthenticationError",
    "ShopifyRateLimitError",
    "ShopifyGraphQLError",
    "ShopifyNetworkError",
    "ShopifyValidationError",
    "ShopifyResourceNotFoundError",
    "ShopifyConfigurationError",
    "ShopifyWebhookError",
    # Query registry and helpers
    "QUERY_REGISTRY",
    "MUTATION_REGISTRY",
    "get_query",
    "get_mutation",
    "build_orders_query_string",
    "build_products_query_string",
    "build_customers_query_string",
    "extract_gid",
    "build_gid",
    # Shop queries
    "QUERY_SHOP",
    "QUERY_SHOP_LOCATIONS",
    # Product queries
    "QUERY_PRODUCTS",
    "QUERY_PRODUCTS_MINIMAL",
    "QUERY_PRODUCT_BY_ID",
    "QUERY_PRODUCT_BY_HANDLE",
    "QUERY_PRODUCT_VARIANTS",
    "QUERY_PRODUCTS_BY_IDS",
    "QUERY_PRODUCT_COUNT",
    # Order queries
    "QUERY_ORDERS",
    "QUERY_ORDERS_MINIMAL",
    "QUERY_ORDER_BY_ID",
    "QUERY_ORDER_BY_NAME",
    "QUERY_ORDERS_BY_IDS",
    "QUERY_ORDER_COUNT",
    # Customer queries
    "QUERY_CUSTOMERS",
    "QUERY_CUSTOMERS_MINIMAL",
    "QUERY_CUSTOMER_BY_ID",
    "QUERY_CUSTOMER_BY_EMAIL",
    "QUERY_CUSTOMERS_BY_IDS",
    "QUERY_CUSTOMER_COUNT",
    # Inventory queries
    "QUERY_INVENTORY_ITEMS",
    "QUERY_INVENTORY_ITEM_BY_ID",
    "QUERY_INVENTORY_LEVELS_AT_LOCATION",
    # Collection queries
    "QUERY_COLLECTIONS",
    "QUERY_COLLECTION_BY_ID",
    # Fulfillment queries
    "QUERY_FULFILLMENT_ORDERS",
    "QUERY_FULFILLMENTS",
    # Webhook queries
    "QUERY_WEBHOOKS",
    "QUERY_WEBHOOK_BY_ID",
    # Bulk operation queries
    "QUERY_BULK_OPERATION_STATUS",
    # Product mutations
    "MUTATION_CREATE_PRODUCT",
    "MUTATION_UPDATE_PRODUCT",
    "MUTATION_DELETE_PRODUCT",
    "MUTATION_UPDATE_PRODUCT_VARIANT",
    "MUTATION_CREATE_PRODUCT_VARIANTS_BULK",
    "MUTATION_UPDATE_PRODUCT_VARIANTS_BULK",
    # Order mutations
    "MUTATION_UPDATE_ORDER",
    "MUTATION_CANCEL_ORDER",
    "MUTATION_CLOSE_ORDER",
    "MUTATION_MARK_ORDER_AS_PAID",
    "MUTATION_ADD_ORDER_TAGS",
    "MUTATION_REMOVE_ORDER_TAGS",
    # Customer mutations
    "MUTATION_CREATE_CUSTOMER",
    "MUTATION_UPDATE_CUSTOMER",
    "MUTATION_DELETE_CUSTOMER",
    "MUTATION_ADD_CUSTOMER_TAGS",
    # Inventory mutations
    "MUTATION_ADJUST_INVENTORY",
    "MUTATION_ADJUST_INVENTORY_QUANTITIES",
    "MUTATION_SET_INVENTORY_ON_HAND",
    "MUTATION_MOVE_INVENTORY",
    # Fulfillment mutations
    "MUTATION_CREATE_FULFILLMENT",
    "MUTATION_UPDATE_TRACKING",
    "MUTATION_CANCEL_FULFILLMENT",
    # Webhook mutations
    "MUTATION_CREATE_WEBHOOK",
    "MUTATION_UPDATE_WEBHOOK",
    "MUTATION_DELETE_WEBHOOK",
    # Metafield mutations
    "MUTATION_SET_METAFIELDS",
    "MUTATION_DELETE_METAFIELD",
    # Bulk operation mutations
    "MUTATION_BULK_OPERATION_RUN",
    "MUTATION_BULK_OPERATION_CANCEL",
]

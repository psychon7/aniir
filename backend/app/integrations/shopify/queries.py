"""
Shopify GraphQL Admin API Query Definitions.

This module provides reusable GraphQL query and mutation definitions for
interacting with Shopify's Admin API. Queries are organized by resource type
and follow Shopify's 2025-01 API version conventions.

Features:
- Comprehensive queries for products, orders, customers, inventory, fulfillments
- Paginated query variants with cursor support
- Mutations for common operations (create, update, delete)
- Fragment definitions for consistent field selection
- Query builder utilities for dynamic query construction

Usage:
    from app.integrations.shopify.queries import QUERY_PRODUCTS, MUTATION_UPDATE_PRODUCT
    from app.integrations.shopify import ShopifyGraphQLClient

    async with ShopifyGraphQLClient(config) as client:
        result = await client.execute_query(
            QUERY_PRODUCTS,
            variables={"first": 50}
        )

Note:
    All queries are designed to work with Shopify's cost-based rate limiting.
    Complex queries that fetch nested connections have higher costs.
"""

from typing import Dict, Any, Optional, List


# =============================================================================
# FRAGMENT DEFINITIONS
# =============================================================================

FRAGMENT_MONEY = """
    fragment MoneyFields on MoneyV2 {
        amount
        currencyCode
    }
"""

FRAGMENT_IMAGE = """
    fragment ImageFields on Image {
        id
        url
        altText
        width
        height
    }
"""

FRAGMENT_METAFIELD = """
    fragment MetafieldFields on Metafield {
        id
        namespace
        key
        value
        type
        description
        createdAt
        updatedAt
    }
"""

FRAGMENT_ADDRESS = """
    fragment AddressFields on MailingAddress {
        id
        address1
        address2
        city
        company
        country
        countryCodeV2
        firstName
        lastName
        name
        phone
        province
        provinceCode
        zip
        formatted
        formattedArea
        latitude
        longitude
    }
"""

FRAGMENT_PAGE_INFO = """
    fragment PageInfoFields on PageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
    }
"""

FRAGMENT_VARIANT_BASIC = """
    fragment VariantBasicFields on ProductVariant {
        id
        title
        sku
        barcode
        position
        availableForSale
        inventoryQuantity
        price
        compareAtPrice
        weight
        weightUnit
        requiresShipping
        taxable
        taxCode
        createdAt
        updatedAt
    }
"""

FRAGMENT_PRODUCT_BASIC = """
    fragment ProductBasicFields on Product {
        id
        title
        handle
        descriptionHtml
        description
        vendor
        productType
        status
        tags
        createdAt
        updatedAt
        publishedAt
        totalInventory
        tracksInventory
        hasOnlyDefaultVariant
        hasOutOfStockVariants
        priceRangeV2 {
            minVariantPrice {
                ...MoneyFields
            }
            maxVariantPrice {
                ...MoneyFields
            }
        }
    }
""" + FRAGMENT_MONEY

FRAGMENT_LINE_ITEM = """
    fragment LineItemFields on LineItem {
        id
        title
        name
        quantity
        sku
        variantTitle
        vendor
        requiresShipping
        taxable
        discountedTotalSet {
            shopMoney {
                ...MoneyFields
            }
        }
        originalTotalSet {
            shopMoney {
                ...MoneyFields
            }
        }
        variant {
            id
            sku
            barcode
            inventoryQuantity
            product {
                id
            }
        }
        product {
            id
            title
            handle
        }
        customAttributes {
            key
            value
        }
    }
""" + FRAGMENT_MONEY

FRAGMENT_ORDER_BASIC = """
    fragment OrderBasicFields on Order {
        id
        name
        email
        phone
        createdAt
        updatedAt
        processedAt
        closedAt
        cancelledAt
        cancelReason
        displayFulfillmentStatus
        displayFinancialStatus
        confirmed
        test
        tags
        note
        currencyCode
        totalPriceSet {
            shopMoney {
                ...MoneyFields
            }
        }
        subtotalPriceSet {
            shopMoney {
                ...MoneyFields
            }
        }
        totalShippingPriceSet {
            shopMoney {
                ...MoneyFields
            }
        }
        totalTaxSet {
            shopMoney {
                ...MoneyFields
            }
        }
        totalDiscountsSet {
            shopMoney {
                ...MoneyFields
            }
        }
        totalRefundedSet {
            shopMoney {
                ...MoneyFields
            }
        }
        customer {
            id
            email
            firstName
            lastName
        }
    }
""" + FRAGMENT_MONEY

FRAGMENT_CUSTOMER_BASIC = """
    fragment CustomerBasicFields on Customer {
        id
        email
        firstName
        lastName
        displayName
        phone
        state
        locale
        verifiedEmail
        taxExempt
        tags
        note
        createdAt
        updatedAt
        ordersCount
        totalSpentV2 {
            ...MoneyFields
        }
        acceptsMarketing
        acceptsMarketingUpdatedAt
        marketingOptInLevel
    }
""" + FRAGMENT_MONEY

FRAGMENT_FULFILLMENT = """
    fragment FulfillmentFields on Fulfillment {
        id
        name
        status
        displayStatus
        createdAt
        updatedAt
        deliveredAt
        estimatedDeliveryAt
        inTransitAt
        totalQuantity
        trackingInfo {
            company
            number
            url
        }
        fulfillmentLineItems(first: 50) {
            edges {
                node {
                    id
                    quantity
                    lineItem {
                        id
                        sku
                        title
                    }
                }
            }
        }
    }
"""

FRAGMENT_INVENTORY_LEVEL = """
    fragment InventoryLevelFields on InventoryLevel {
        id
        available
        incoming
        updatedAt
        location {
            id
            name
            isActive
        }
        item {
            id
            sku
            tracked
            variant {
                id
                displayName
                product {
                    id
                    title
                }
            }
        }
    }
"""


# =============================================================================
# SHOP QUERIES
# =============================================================================

QUERY_SHOP = """
    query GetShop {
        shop {
            id
            name
            email
            description
            primaryDomain {
                url
                host
                sslEnabled
            }
            currencyCode
            currencyFormats {
                moneyFormat
                moneyWithCurrencyFormat
            }
            timezoneAbbreviation
            ianaTimezone
            weightUnit
            unitSystem
            plan {
                displayName
                partnerDevelopment
                shopifyPlus
            }
            billingAddress {
                address1
                address2
                city
                company
                country
                countryCodeV2
                phone
                province
                provinceCode
                zip
            }
            enabledPresentmentCurrencies
            features {
                multiLocation
                storefront
            }
            createdAt
            updatedAt
        }
    }
"""

QUERY_SHOP_LOCATIONS = """
    query GetShopLocations($first: Int = 50, $after: String) {
        locations(first: $first, after: $after) {
            edges {
                cursor
                node {
                    id
                    name
                    address {
                        ...AddressFields
                    }
                    isActive
                    fulfillsOnlineOrders
                    hasActiveInventory
                    shipsInventory
                    createdAt
                    updatedAt
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_ADDRESS + FRAGMENT_PAGE_INFO


# =============================================================================
# PRODUCT QUERIES
# =============================================================================

QUERY_PRODUCTS = """
    query GetProducts($first: Int = 50, $after: String, $query: String, $sortKey: ProductSortKeys = CREATED_AT, $reverse: Boolean = false) {
        products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
                cursor
                node {
                    ...ProductBasicFields
                    featuredImage {
                        ...ImageFields
                    }
                    options {
                        id
                        name
                        values
                        position
                    }
                    variants(first: 100) {
                        edges {
                            node {
                                ...VariantBasicFields
                                selectedOptions {
                                    name
                                    value
                                }
                                image {
                                    ...ImageFields
                                }
                            }
                        }
                    }
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_PRODUCT_BASIC + FRAGMENT_VARIANT_BASIC + FRAGMENT_IMAGE + FRAGMENT_PAGE_INFO

QUERY_PRODUCTS_MINIMAL = """
    query GetProductsMinimal($first: Int = 250, $after: String, $query: String) {
        products(first: $first, after: $after, query: $query) {
            edges {
                cursor
                node {
                    id
                    title
                    handle
                    status
                    totalInventory
                    updatedAt
                    variants(first: 100) {
                        edges {
                            node {
                                id
                                sku
                                barcode
                                inventoryQuantity
                            }
                        }
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
"""

QUERY_PRODUCT_BY_ID = """
    query GetProductById($id: ID!) {
        product(id: $id) {
            ...ProductBasicFields
            featuredImage {
                ...ImageFields
            }
            images(first: 100) {
                edges {
                    node {
                        ...ImageFields
                    }
                }
            }
            options {
                id
                name
                values
                position
            }
            variants(first: 100) {
                edges {
                    node {
                        ...VariantBasicFields
                        selectedOptions {
                            name
                            value
                        }
                        image {
                            ...ImageFields
                        }
                        inventoryItem {
                            id
                            tracked
                            inventoryLevels(first: 50) {
                                edges {
                                    node {
                                        ...InventoryLevelFields
                                    }
                                }
                            }
                        }
                    }
                }
            }
            metafields(first: 50) {
                edges {
                    node {
                        ...MetafieldFields
                    }
                }
            }
            collections(first: 20) {
                edges {
                    node {
                        id
                        title
                        handle
                    }
                }
            }
        }
    }
""" + FRAGMENT_PRODUCT_BASIC + FRAGMENT_VARIANT_BASIC + FRAGMENT_IMAGE + FRAGMENT_INVENTORY_LEVEL + FRAGMENT_METAFIELD

QUERY_PRODUCT_BY_HANDLE = """
    query GetProductByHandle($handle: String!) {
        productByHandle(handle: $handle) {
            ...ProductBasicFields
            featuredImage {
                ...ImageFields
            }
            variants(first: 100) {
                edges {
                    node {
                        ...VariantBasicFields
                    }
                }
            }
        }
    }
""" + FRAGMENT_PRODUCT_BASIC + FRAGMENT_VARIANT_BASIC + FRAGMENT_IMAGE

QUERY_PRODUCT_VARIANTS = """
    query GetProductVariants($productId: ID!, $first: Int = 100, $after: String) {
        product(id: $productId) {
            id
            title
            variants(first: $first, after: $after) {
                edges {
                    cursor
                    node {
                        ...VariantBasicFields
                        selectedOptions {
                            name
                            value
                        }
                        image {
                            ...ImageFields
                        }
                        inventoryItem {
                            id
                            tracked
                            requiresShipping
                            inventoryLevels(first: 50) {
                                edges {
                                    node {
                                        ...InventoryLevelFields
                                    }
                                }
                            }
                        }
                    }
                }
                pageInfo {
                    ...PageInfoFields
                }
            }
        }
    }
""" + FRAGMENT_VARIANT_BASIC + FRAGMENT_IMAGE + FRAGMENT_INVENTORY_LEVEL + FRAGMENT_PAGE_INFO

QUERY_PRODUCTS_BY_IDS = """
    query GetProductsByIds($ids: [ID!]!) {
        nodes(ids: $ids) {
            ... on Product {
                ...ProductBasicFields
                featuredImage {
                    ...ImageFields
                }
                variants(first: 100) {
                    edges {
                        node {
                            ...VariantBasicFields
                        }
                    }
                }
            }
        }
    }
""" + FRAGMENT_PRODUCT_BASIC + FRAGMENT_VARIANT_BASIC + FRAGMENT_IMAGE

QUERY_PRODUCT_COUNT = """
    query GetProductCount($query: String) {
        productsCount(query: $query) {
            count
        }
    }
"""


# =============================================================================
# ORDER QUERIES
# =============================================================================

QUERY_ORDERS = """
    query GetOrders($first: Int = 50, $after: String, $query: String, $sortKey: OrderSortKeys = CREATED_AT, $reverse: Boolean = true) {
        orders(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
                cursor
                node {
                    ...OrderBasicFields
                    billingAddress {
                        ...AddressFields
                    }
                    shippingAddress {
                        ...AddressFields
                    }
                    lineItems(first: 100) {
                        edges {
                            node {
                                ...LineItemFields
                            }
                        }
                    }
                    fulfillments {
                        ...FulfillmentFields
                    }
                    shippingLines(first: 10) {
                        edges {
                            node {
                                id
                                title
                                code
                                source
                                originalPriceSet {
                                    shopMoney {
                                        ...MoneyFields
                                    }
                                }
                                discountedPriceSet {
                                    shopMoney {
                                        ...MoneyFields
                                    }
                                }
                            }
                        }
                    }
                    transactions(first: 20) {
                        id
                        kind
                        status
                        gateway
                        amountSet {
                            shopMoney {
                                ...MoneyFields
                            }
                        }
                        createdAt
                        processedAt
                    }
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_ORDER_BASIC + FRAGMENT_ADDRESS + FRAGMENT_LINE_ITEM + FRAGMENT_FULFILLMENT + FRAGMENT_PAGE_INFO

QUERY_ORDERS_MINIMAL = """
    query GetOrdersMinimal($first: Int = 250, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
            edges {
                cursor
                node {
                    id
                    name
                    email
                    createdAt
                    updatedAt
                    displayFulfillmentStatus
                    displayFinancialStatus
                    currencyCode
                    totalPriceSet {
                        shopMoney {
                            amount
                            currencyCode
                        }
                    }
                    customer {
                        id
                        email
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
"""

QUERY_ORDER_BY_ID = """
    query GetOrderById($id: ID!) {
        order(id: $id) {
            ...OrderBasicFields
            billingAddress {
                ...AddressFields
            }
            shippingAddress {
                ...AddressFields
            }
            lineItems(first: 100) {
                edges {
                    node {
                        ...LineItemFields
                    }
                }
            }
            fulfillments {
                ...FulfillmentFields
            }
            shippingLines(first: 10) {
                edges {
                    node {
                        id
                        title
                        code
                        source
                        originalPriceSet {
                            shopMoney {
                                ...MoneyFields
                            }
                        }
                    }
                }
            }
            transactions(first: 20) {
                id
                kind
                status
                gateway
                amountSet {
                    shopMoney {
                        ...MoneyFields
                    }
                }
                createdAt
                processedAt
            }
            refunds(first: 10) {
                id
                note
                createdAt
                totalRefundedSet {
                    shopMoney {
                        ...MoneyFields
                    }
                }
                refundLineItems(first: 50) {
                    edges {
                        node {
                            quantity
                            restockType
                            lineItem {
                                id
                                sku
                                title
                            }
                        }
                    }
                }
            }
            metafields(first: 50) {
                edges {
                    node {
                        ...MetafieldFields
                    }
                }
            }
            risks(first: 10) {
                level
                message
                display
            }
        }
    }
""" + FRAGMENT_ORDER_BASIC + FRAGMENT_ADDRESS + FRAGMENT_LINE_ITEM + FRAGMENT_FULFILLMENT + FRAGMENT_METAFIELD

QUERY_ORDER_BY_NAME = """
    query GetOrderByName($name: String!) {
        orders(first: 1, query: $name) {
            edges {
                node {
                    ...OrderBasicFields
                    lineItems(first: 100) {
                        edges {
                            node {
                                ...LineItemFields
                            }
                        }
                    }
                }
            }
        }
    }
""" + FRAGMENT_ORDER_BASIC + FRAGMENT_LINE_ITEM

QUERY_ORDERS_BY_IDS = """
    query GetOrdersByIds($ids: [ID!]!) {
        nodes(ids: $ids) {
            ... on Order {
                ...OrderBasicFields
                lineItems(first: 100) {
                    edges {
                        node {
                            ...LineItemFields
                        }
                    }
                }
            }
        }
    }
""" + FRAGMENT_ORDER_BASIC + FRAGMENT_LINE_ITEM

QUERY_ORDER_COUNT = """
    query GetOrderCount($query: String) {
        ordersCount(query: $query) {
            count
        }
    }
"""

QUERY_ORDERS_SINCE = """
    query GetOrdersSince($since: DateTime!, $first: Int = 50, $after: String) {
        orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: false) {
            edges {
                cursor
                node {
                    ...OrderBasicFields
                    lineItems(first: 100) {
                        edges {
                            node {
                                id
                                title
                                sku
                                quantity
                                variant {
                                    id
                                    sku
                                }
                            }
                        }
                    }
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_ORDER_BASIC + FRAGMENT_PAGE_INFO


# =============================================================================
# CUSTOMER QUERIES
# =============================================================================

QUERY_CUSTOMERS = """
    query GetCustomers($first: Int = 50, $after: String, $query: String, $sortKey: CustomerSortKeys = CREATED_AT, $reverse: Boolean = true) {
        customers(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
            edges {
                cursor
                node {
                    ...CustomerBasicFields
                    defaultAddress {
                        ...AddressFields
                    }
                    addresses(first: 10) {
                        ...AddressFields
                    }
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_CUSTOMER_BASIC + FRAGMENT_ADDRESS + FRAGMENT_PAGE_INFO

QUERY_CUSTOMERS_MINIMAL = """
    query GetCustomersMinimal($first: Int = 250, $after: String, $query: String) {
        customers(first: $first, after: $after, query: $query) {
            edges {
                cursor
                node {
                    id
                    email
                    firstName
                    lastName
                    displayName
                    state
                    createdAt
                    updatedAt
                    ordersCount
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
    }
"""

QUERY_CUSTOMER_BY_ID = """
    query GetCustomerById($id: ID!) {
        customer(id: $id) {
            ...CustomerBasicFields
            defaultAddress {
                ...AddressFields
            }
            addresses(first: 50) {
                ...AddressFields
            }
            orders(first: 50, sortKey: CREATED_AT, reverse: true) {
                edges {
                    node {
                        id
                        name
                        createdAt
                        displayFulfillmentStatus
                        displayFinancialStatus
                        totalPriceSet {
                            shopMoney {
                                ...MoneyFields
                            }
                        }
                    }
                }
                pageInfo {
                    ...PageInfoFields
                }
            }
            metafields(first: 50) {
                edges {
                    node {
                        ...MetafieldFields
                    }
                }
            }
        }
    }
""" + FRAGMENT_CUSTOMER_BASIC + FRAGMENT_ADDRESS + FRAGMENT_METAFIELD + FRAGMENT_PAGE_INFO

QUERY_CUSTOMER_BY_EMAIL = """
    query GetCustomerByEmail($email: String!) {
        customers(first: 1, query: $email) {
            edges {
                node {
                    ...CustomerBasicFields
                    defaultAddress {
                        ...AddressFields
                    }
                }
            }
        }
    }
""" + FRAGMENT_CUSTOMER_BASIC + FRAGMENT_ADDRESS

QUERY_CUSTOMERS_BY_IDS = """
    query GetCustomersByIds($ids: [ID!]!) {
        nodes(ids: $ids) {
            ... on Customer {
                ...CustomerBasicFields
            }
        }
    }
""" + FRAGMENT_CUSTOMER_BASIC

QUERY_CUSTOMER_COUNT = """
    query GetCustomerCount($query: String) {
        customersCount(query: $query) {
            count
        }
    }
"""


# =============================================================================
# INVENTORY QUERIES
# =============================================================================

QUERY_INVENTORY_ITEMS = """
    query GetInventoryItems($first: Int = 50, $after: String, $query: String) {
        inventoryItems(first: $first, after: $after, query: $query) {
            edges {
                cursor
                node {
                    id
                    sku
                    tracked
                    requiresShipping
                    createdAt
                    updatedAt
                    variant {
                        id
                        displayName
                        product {
                            id
                            title
                            handle
                        }
                    }
                    inventoryLevels(first: 50) {
                        edges {
                            node {
                                ...InventoryLevelFields
                            }
                        }
                    }
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_INVENTORY_LEVEL + FRAGMENT_PAGE_INFO

QUERY_INVENTORY_ITEM_BY_ID = """
    query GetInventoryItemById($id: ID!) {
        inventoryItem(id: $id) {
            id
            sku
            tracked
            requiresShipping
            countryCodeOfOrigin
            harmonizedSystemCode
            createdAt
            updatedAt
            variant {
                id
                displayName
                barcode
                product {
                    id
                    title
                    handle
                    status
                }
            }
            inventoryLevels(first: 50) {
                edges {
                    node {
                        ...InventoryLevelFields
                    }
                }
            }
        }
    }
""" + FRAGMENT_INVENTORY_LEVEL

QUERY_INVENTORY_LEVELS_AT_LOCATION = """
    query GetInventoryLevelsAtLocation($locationId: ID!, $first: Int = 250, $after: String) {
        location(id: $locationId) {
            id
            name
            inventoryLevels(first: $first, after: $after) {
                edges {
                    cursor
                    node {
                        ...InventoryLevelFields
                    }
                }
                pageInfo {
                    ...PageInfoFields
                }
            }
        }
    }
""" + FRAGMENT_INVENTORY_LEVEL + FRAGMENT_PAGE_INFO


# =============================================================================
# COLLECTION QUERIES
# =============================================================================

QUERY_COLLECTIONS = """
    query GetCollections($first: Int = 50, $after: String, $query: String) {
        collections(first: $first, after: $after, query: $query) {
            edges {
                cursor
                node {
                    id
                    title
                    handle
                    description
                    descriptionHtml
                    sortOrder
                    productsCount {
                        count
                    }
                    image {
                        ...ImageFields
                    }
                    createdAt
                    updatedAt
                    publishedAt
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_IMAGE + FRAGMENT_PAGE_INFO

QUERY_COLLECTION_BY_ID = """
    query GetCollectionById($id: ID!, $productsFirst: Int = 50, $productsAfter: String) {
        collection(id: $id) {
            id
            title
            handle
            description
            descriptionHtml
            sortOrder
            productsCount {
                count
            }
            image {
                ...ImageFields
            }
            products(first: $productsFirst, after: $productsAfter) {
                edges {
                    cursor
                    node {
                        id
                        title
                        handle
                        status
                    }
                }
                pageInfo {
                    ...PageInfoFields
                }
            }
            metafields(first: 50) {
                edges {
                    node {
                        ...MetafieldFields
                    }
                }
            }
            createdAt
            updatedAt
        }
    }
""" + FRAGMENT_IMAGE + FRAGMENT_METAFIELD + FRAGMENT_PAGE_INFO


# =============================================================================
# FULFILLMENT QUERIES
# =============================================================================

QUERY_FULFILLMENT_ORDERS = """
    query GetFulfillmentOrders($orderId: ID!) {
        order(id: $orderId) {
            id
            name
            fulfillmentOrders(first: 50) {
                edges {
                    node {
                        id
                        status
                        requestStatus
                        fulfillAt
                        assignedLocation {
                            location {
                                id
                                name
                            }
                        }
                        lineItems(first: 100) {
                            edges {
                                node {
                                    id
                                    totalQuantity
                                    remainingQuantity
                                    lineItem {
                                        id
                                        title
                                        sku
                                    }
                                }
                            }
                        }
                        supportedActions {
                            action
                            externalUrl
                        }
                        merchantRequests(first: 10) {
                            edges {
                                node {
                                    id
                                    kind
                                    message
                                    requestOptions
                                    sentAt
                                }
                            }
                        }
                    }
                }
            }
        }
    }
"""

QUERY_FULFILLMENTS = """
    query GetFulfillments($orderId: ID!) {
        order(id: $orderId) {
            id
            name
            fulfillments {
                ...FulfillmentFields
            }
        }
    }
""" + FRAGMENT_FULFILLMENT


# =============================================================================
# WEBHOOK QUERIES
# =============================================================================

QUERY_WEBHOOKS = """
    query GetWebhooks($first: Int = 50, $after: String) {
        webhookSubscriptions(first: $first, after: $after) {
            edges {
                cursor
                node {
                    id
                    topic
                    endpoint {
                        ... on WebhookHttpEndpoint {
                            callbackUrl
                        }
                        ... on WebhookEventBridgeEndpoint {
                            arn
                        }
                        ... on WebhookPubSubEndpoint {
                            pubSubProject
                            pubSubTopic
                        }
                    }
                    format
                    apiVersion {
                        handle
                    }
                    includeFields
                    metafieldNamespaces
                    privateMetafieldNamespaces
                    createdAt
                    updatedAt
                }
            }
            pageInfo {
                ...PageInfoFields
            }
        }
    }
""" + FRAGMENT_PAGE_INFO

QUERY_WEBHOOK_BY_ID = """
    query GetWebhookById($id: ID!) {
        webhookSubscription(id: $id) {
            id
            topic
            endpoint {
                ... on WebhookHttpEndpoint {
                    callbackUrl
                }
            }
            format
            apiVersion {
                handle
            }
            includeFields
            metafieldNamespaces
            createdAt
            updatedAt
        }
    }
"""


# =============================================================================
# PRODUCT MUTATIONS
# =============================================================================

MUTATION_CREATE_PRODUCT = """
    mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
            product {
                ...ProductBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_PRODUCT_BASIC

MUTATION_UPDATE_PRODUCT = """
    mutation UpdateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
            product {
                ...ProductBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_PRODUCT_BASIC

MUTATION_DELETE_PRODUCT = """
    mutation DeleteProduct($input: ProductDeleteInput!) {
        productDelete(input: $input) {
            deletedProductId
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_UPDATE_PRODUCT_VARIANT = """
    mutation UpdateProductVariant($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
            productVariant {
                ...VariantBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_VARIANT_BASIC

MUTATION_CREATE_PRODUCT_VARIANTS_BULK = """
    mutation CreateProductVariantsBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
            productVariants {
                ...VariantBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_VARIANT_BASIC

MUTATION_UPDATE_PRODUCT_VARIANTS_BULK = """
    mutation UpdateProductVariantsBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants {
                ...VariantBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_VARIANT_BASIC


# =============================================================================
# ORDER MUTATIONS
# =============================================================================

MUTATION_UPDATE_ORDER = """
    mutation UpdateOrder($input: OrderInput!) {
        orderUpdate(input: $input) {
            order {
                ...OrderBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_ORDER_BASIC

MUTATION_CANCEL_ORDER = """
    mutation CancelOrder($orderId: ID!, $notifyCustomer: Boolean = true, $reason: OrderCancelReason!, $refund: Boolean = false, $restock: Boolean = false) {
        orderCancel(orderId: $orderId, notifyCustomer: $notifyCustomer, reason: $reason, refund: $refund, restock: $restock) {
            job {
                id
                done
            }
            orderCancelUserErrors {
                field
                message
                code
            }
        }
    }
"""

MUTATION_CLOSE_ORDER = """
    mutation CloseOrder($input: OrderCloseInput!) {
        orderClose(input: $input) {
            order {
                id
                closedAt
            }
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_MARK_ORDER_AS_PAID = """
    mutation MarkOrderAsPaid($input: OrderMarkAsPaidInput!) {
        orderMarkAsPaid(input: $input) {
            order {
                id
                displayFinancialStatus
            }
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_ADD_ORDER_TAGS = """
    mutation AddOrderTags($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
            node {
                ... on Order {
                    id
                    tags
                }
            }
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_REMOVE_ORDER_TAGS = """
    mutation RemoveOrderTags($id: ID!, $tags: [String!]!) {
        tagsRemove(id: $id, tags: $tags) {
            node {
                ... on Order {
                    id
                    tags
                }
            }
            userErrors {
                field
                message
            }
        }
    }
"""


# =============================================================================
# CUSTOMER MUTATIONS
# =============================================================================

MUTATION_CREATE_CUSTOMER = """
    mutation CreateCustomer($input: CustomerInput!) {
        customerCreate(input: $input) {
            customer {
                ...CustomerBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_CUSTOMER_BASIC

MUTATION_UPDATE_CUSTOMER = """
    mutation UpdateCustomer($input: CustomerInput!) {
        customerUpdate(input: $input) {
            customer {
                ...CustomerBasicFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_CUSTOMER_BASIC

MUTATION_DELETE_CUSTOMER = """
    mutation DeleteCustomer($input: CustomerDeleteInput!) {
        customerDelete(input: $input) {
            deletedCustomerId
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_ADD_CUSTOMER_TAGS = """
    mutation AddCustomerTags($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) {
            node {
                ... on Customer {
                    id
                    tags
                }
            }
            userErrors {
                field
                message
            }
        }
    }
"""


# =============================================================================
# INVENTORY MUTATIONS
# =============================================================================

MUTATION_ADJUST_INVENTORY = """
    mutation AdjustInventory($input: InventoryAdjustQuantityInput!) {
        inventoryAdjustQuantity(input: $input) {
            inventoryLevel {
                ...InventoryLevelFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_INVENTORY_LEVEL

MUTATION_ADJUST_INVENTORY_QUANTITIES = """
    mutation AdjustInventoryQuantities($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
            inventoryAdjustmentGroup {
                createdAt
                reason
                changes {
                    name
                    delta
                    quantityAfterChange
                    item {
                        id
                        sku
                    }
                    location {
                        id
                        name
                    }
                }
            }
            userErrors {
                field
                message
                code
            }
        }
    }
"""

MUTATION_SET_INVENTORY_ON_HAND = """
    mutation SetInventoryOnHand($input: InventorySetOnHandQuantitiesInput!) {
        inventorySetOnHandQuantities(input: $input) {
            inventoryAdjustmentGroup {
                createdAt
                reason
                changes {
                    name
                    delta
                    quantityAfterChange
                }
            }
            userErrors {
                field
                message
                code
            }
        }
    }
"""

MUTATION_MOVE_INVENTORY = """
    mutation MoveInventory($input: InventoryMoveQuantitiesInput!) {
        inventoryMoveQuantities(input: $input) {
            inventoryAdjustmentGroup {
                createdAt
                reason
                changes {
                    name
                    delta
                    quantityAfterChange
                }
            }
            userErrors {
                field
                message
                code
            }
        }
    }
"""


# =============================================================================
# FULFILLMENT MUTATIONS
# =============================================================================

MUTATION_CREATE_FULFILLMENT = """
    mutation CreateFulfillment($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) {
            fulfillment {
                ...FulfillmentFields
            }
            userErrors {
                field
                message
            }
        }
    }
""" + FRAGMENT_FULFILLMENT

MUTATION_UPDATE_TRACKING = """
    mutation UpdateTracking($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean = false) {
        fulfillmentTrackingInfoUpdateV2(fulfillmentId: $fulfillmentId, trackingInfoInput: $trackingInfoInput, notifyCustomer: $notifyCustomer) {
            fulfillment {
                id
                status
                trackingInfo {
                    company
                    number
                    url
                }
            }
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_CANCEL_FULFILLMENT = """
    mutation CancelFulfillment($id: ID!) {
        fulfillmentCancel(id: $id) {
            fulfillment {
                id
                status
            }
            userErrors {
                field
                message
            }
        }
    }
"""


# =============================================================================
# WEBHOOK MUTATIONS
# =============================================================================

MUTATION_CREATE_WEBHOOK = """
    mutation CreateWebhook($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
            webhookSubscription {
                id
                topic
                endpoint {
                    ... on WebhookHttpEndpoint {
                        callbackUrl
                    }
                }
                format
                apiVersion {
                    handle
                }
            }
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_UPDATE_WEBHOOK = """
    mutation UpdateWebhook($id: ID!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionUpdate(id: $id, webhookSubscription: $webhookSubscription) {
            webhookSubscription {
                id
                topic
                endpoint {
                    ... on WebhookHttpEndpoint {
                        callbackUrl
                    }
                }
            }
            userErrors {
                field
                message
            }
        }
    }
"""

MUTATION_DELETE_WEBHOOK = """
    mutation DeleteWebhook($id: ID!) {
        webhookSubscriptionDelete(id: $id) {
            deletedWebhookSubscriptionId
            userErrors {
                field
                message
            }
        }
    }
"""


# =============================================================================
# METAFIELD MUTATIONS
# =============================================================================

MUTATION_SET_METAFIELDS = """
    mutation SetMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
            metafields {
                ...MetafieldFields
            }
            userErrors {
                field
                message
                code
            }
        }
    }
""" + FRAGMENT_METAFIELD

MUTATION_DELETE_METAFIELD = """
    mutation DeleteMetafield($input: MetafieldDeleteInput!) {
        metafieldDelete(input: $input) {
            deletedId
            userErrors {
                field
                message
            }
        }
    }
"""


# =============================================================================
# BULK OPERATION QUERIES
# =============================================================================

MUTATION_BULK_OPERATION_RUN = """
    mutation BulkOperationRun($query: String!) {
        bulkOperationRunQuery(query: $query) {
            bulkOperation {
                id
                status
                createdAt
            }
            userErrors {
                field
                message
            }
        }
    }
"""

QUERY_BULK_OPERATION_STATUS = """
    query BulkOperationStatus {
        currentBulkOperation {
            id
            status
            errorCode
            createdAt
            completedAt
            objectCount
            fileSize
            url
            partialDataUrl
        }
    }
"""

MUTATION_BULK_OPERATION_CANCEL = """
    mutation BulkOperationCancel($id: ID!) {
        bulkOperationCancel(id: $id) {
            bulkOperation {
                id
                status
            }
            userErrors {
                field
                message
            }
        }
    }
"""


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def build_orders_query_string(
    status: Optional[str] = None,
    financial_status: Optional[str] = None,
    fulfillment_status: Optional[str] = None,
    since: Optional[str] = None,
    until: Optional[str] = None,
    customer_id: Optional[str] = None,
    tag: Optional[str] = None,
) -> str:
    """
    Build a Shopify query string for filtering orders.

    Args:
        status: Order status (open, closed, cancelled, any)
        financial_status: Financial status (authorized, pending, paid, etc.)
        fulfillment_status: Fulfillment status (shipped, partial, unshipped, etc.)
        since: ISO datetime string for created_at minimum
        until: ISO datetime string for created_at maximum
        customer_id: Customer GID to filter by
        tag: Tag to filter by

    Returns:
        Query string for Shopify orders query
    """
    filters: List[str] = []

    if status:
        filters.append(f"status:{status}")
    if financial_status:
        filters.append(f"financial_status:{financial_status}")
    if fulfillment_status:
        filters.append(f"fulfillment_status:{fulfillment_status}")
    if since:
        filters.append(f"created_at:>{since}")
    if until:
        filters.append(f"created_at:<{until}")
    if customer_id:
        filters.append(f"customer_id:{customer_id}")
    if tag:
        filters.append(f"tag:{tag}")

    return " AND ".join(filters) if filters else ""


def build_products_query_string(
    status: Optional[str] = None,
    product_type: Optional[str] = None,
    vendor: Optional[str] = None,
    tag: Optional[str] = None,
    title: Optional[str] = None,
    inventory_tracked: Optional[bool] = None,
) -> str:
    """
    Build a Shopify query string for filtering products.

    Args:
        status: Product status (active, archived, draft)
        product_type: Product type to filter by
        vendor: Vendor name to filter by
        tag: Tag to filter by
        title: Title search string
        inventory_tracked: Whether inventory is tracked

    Returns:
        Query string for Shopify products query
    """
    filters: List[str] = []

    if status:
        filters.append(f"status:{status}")
    if product_type:
        filters.append(f"product_type:{product_type}")
    if vendor:
        filters.append(f"vendor:{vendor}")
    if tag:
        filters.append(f"tag:{tag}")
    if title:
        filters.append(f"title:*{title}*")
    if inventory_tracked is not None:
        filters.append(f"inventory_tracked:{str(inventory_tracked).lower()}")

    return " AND ".join(filters) if filters else ""


def build_customers_query_string(
    state: Optional[str] = None,
    tag: Optional[str] = None,
    accepts_marketing: Optional[bool] = None,
    email: Optional[str] = None,
    country: Optional[str] = None,
) -> str:
    """
    Build a Shopify query string for filtering customers.

    Args:
        state: Customer state (enabled, disabled, declined, invited)
        tag: Tag to filter by
        accepts_marketing: Whether customer accepts marketing
        email: Email search string
        country: Country code to filter by

    Returns:
        Query string for Shopify customers query
    """
    filters: List[str] = []

    if state:
        filters.append(f"state:{state}")
    if tag:
        filters.append(f"tag:{tag}")
    if accepts_marketing is not None:
        filters.append(f"accepts_marketing:{str(accepts_marketing).lower()}")
    if email:
        filters.append(f"email:{email}")
    if country:
        filters.append(f"country:{country}")

    return " AND ".join(filters) if filters else ""


def extract_gid(gid: str) -> str:
    """
    Extract the numeric ID from a Shopify Global ID (GID).

    Args:
        gid: Shopify GID string (e.g., "gid://shopify/Product/123456")

    Returns:
        Numeric ID as string (e.g., "123456")
    """
    if "/" in gid:
        return gid.split("/")[-1]
    return gid


def build_gid(resource_type: str, id_value: str) -> str:
    """
    Build a Shopify Global ID (GID) from resource type and ID.

    Args:
        resource_type: Shopify resource type (e.g., "Product", "Order", "Customer")
        id_value: Numeric ID value

    Returns:
        Shopify GID string (e.g., "gid://shopify/Product/123456")
    """
    # Clean the ID value in case it's already a GID
    clean_id = extract_gid(str(id_value))
    return f"gid://shopify/{resource_type}/{clean_id}"


# =============================================================================
# QUERY REGISTRY
# =============================================================================

# Registry of all queries for easy lookup
QUERY_REGISTRY: Dict[str, str] = {
    # Shop
    "shop": QUERY_SHOP,
    "shop_locations": QUERY_SHOP_LOCATIONS,
    # Products
    "products": QUERY_PRODUCTS,
    "products_minimal": QUERY_PRODUCTS_MINIMAL,
    "product_by_id": QUERY_PRODUCT_BY_ID,
    "product_by_handle": QUERY_PRODUCT_BY_HANDLE,
    "product_variants": QUERY_PRODUCT_VARIANTS,
    "products_by_ids": QUERY_PRODUCTS_BY_IDS,
    "product_count": QUERY_PRODUCT_COUNT,
    # Orders
    "orders": QUERY_ORDERS,
    "orders_minimal": QUERY_ORDERS_MINIMAL,
    "order_by_id": QUERY_ORDER_BY_ID,
    "order_by_name": QUERY_ORDER_BY_NAME,
    "orders_by_ids": QUERY_ORDERS_BY_IDS,
    "order_count": QUERY_ORDER_COUNT,
    "orders_since": QUERY_ORDERS_SINCE,
    # Customers
    "customers": QUERY_CUSTOMERS,
    "customers_minimal": QUERY_CUSTOMERS_MINIMAL,
    "customer_by_id": QUERY_CUSTOMER_BY_ID,
    "customer_by_email": QUERY_CUSTOMER_BY_EMAIL,
    "customers_by_ids": QUERY_CUSTOMERS_BY_IDS,
    "customer_count": QUERY_CUSTOMER_COUNT,
    # Inventory
    "inventory_items": QUERY_INVENTORY_ITEMS,
    "inventory_item_by_id": QUERY_INVENTORY_ITEM_BY_ID,
    "inventory_levels_at_location": QUERY_INVENTORY_LEVELS_AT_LOCATION,
    # Collections
    "collections": QUERY_COLLECTIONS,
    "collection_by_id": QUERY_COLLECTION_BY_ID,
    # Fulfillment
    "fulfillment_orders": QUERY_FULFILLMENT_ORDERS,
    "fulfillments": QUERY_FULFILLMENTS,
    # Webhooks
    "webhooks": QUERY_WEBHOOKS,
    "webhook_by_id": QUERY_WEBHOOK_BY_ID,
    # Bulk Operations
    "bulk_operation_status": QUERY_BULK_OPERATION_STATUS,
}

MUTATION_REGISTRY: Dict[str, str] = {
    # Products
    "create_product": MUTATION_CREATE_PRODUCT,
    "update_product": MUTATION_UPDATE_PRODUCT,
    "delete_product": MUTATION_DELETE_PRODUCT,
    "update_product_variant": MUTATION_UPDATE_PRODUCT_VARIANT,
    "create_product_variants_bulk": MUTATION_CREATE_PRODUCT_VARIANTS_BULK,
    "update_product_variants_bulk": MUTATION_UPDATE_PRODUCT_VARIANTS_BULK,
    # Orders
    "update_order": MUTATION_UPDATE_ORDER,
    "cancel_order": MUTATION_CANCEL_ORDER,
    "close_order": MUTATION_CLOSE_ORDER,
    "mark_order_as_paid": MUTATION_MARK_ORDER_AS_PAID,
    "add_order_tags": MUTATION_ADD_ORDER_TAGS,
    "remove_order_tags": MUTATION_REMOVE_ORDER_TAGS,
    # Customers
    "create_customer": MUTATION_CREATE_CUSTOMER,
    "update_customer": MUTATION_UPDATE_CUSTOMER,
    "delete_customer": MUTATION_DELETE_CUSTOMER,
    "add_customer_tags": MUTATION_ADD_CUSTOMER_TAGS,
    # Inventory
    "adjust_inventory": MUTATION_ADJUST_INVENTORY,
    "adjust_inventory_quantities": MUTATION_ADJUST_INVENTORY_QUANTITIES,
    "set_inventory_on_hand": MUTATION_SET_INVENTORY_ON_HAND,
    "move_inventory": MUTATION_MOVE_INVENTORY,
    # Fulfillment
    "create_fulfillment": MUTATION_CREATE_FULFILLMENT,
    "update_tracking": MUTATION_UPDATE_TRACKING,
    "cancel_fulfillment": MUTATION_CANCEL_FULFILLMENT,
    # Webhooks
    "create_webhook": MUTATION_CREATE_WEBHOOK,
    "update_webhook": MUTATION_UPDATE_WEBHOOK,
    "delete_webhook": MUTATION_DELETE_WEBHOOK,
    # Metafields
    "set_metafields": MUTATION_SET_METAFIELDS,
    "delete_metafield": MUTATION_DELETE_METAFIELD,
    # Bulk Operations
    "bulk_operation_run": MUTATION_BULK_OPERATION_RUN,
    "bulk_operation_cancel": MUTATION_BULK_OPERATION_CANCEL,
}


def get_query(name: str) -> str:
    """
    Get a query by name from the registry.

    Args:
        name: Query name (e.g., "products", "order_by_id")

    Returns:
        GraphQL query string

    Raises:
        KeyError: If query name is not found
    """
    if name not in QUERY_REGISTRY:
        available = ", ".join(sorted(QUERY_REGISTRY.keys()))
        raise KeyError(f"Query '{name}' not found. Available queries: {available}")
    return QUERY_REGISTRY[name]


def get_mutation(name: str) -> str:
    """
    Get a mutation by name from the registry.

    Args:
        name: Mutation name (e.g., "create_product", "update_order")

    Returns:
        GraphQL mutation string

    Raises:
        KeyError: If mutation name is not found
    """
    if name not in MUTATION_REGISTRY:
        available = ", ".join(sorted(MUTATION_REGISTRY.keys()))
        raise KeyError(f"Mutation '{name}' not found. Available mutations: {available}")
    return MUTATION_REGISTRY[name]

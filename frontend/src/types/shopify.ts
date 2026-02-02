/**
 * Shopify store integration entity
 */
export interface ShopifyStore {
  id: number
  name: string
  shopDomain: string
  accessToken?: string // Masked in responses
  apiVersion: string
  isActive: boolean
  status: ShopifyStoreStatus
  statusMessage?: string

  // Shop info from Shopify API
  shopifyShopId?: string
  email?: string
  currencyCode?: string
  primaryDomain?: string
  planDisplayName?: string
  country?: string

  // Sync settings
  syncOrders: boolean
  syncProducts: boolean
  syncCustomers: boolean
  syncInventory: boolean
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'failed' | 'partial'
  lastSyncError?: string

  // Webhook settings
  webhooksEnabled: boolean
  webhookSecret?: string

  // Metadata
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

/**
 * Shopify store status
 */
export type ShopifyStoreStatus = 'active' | 'inactive' | 'error' | 'pending' | 'disconnected'

/**
 * Shopify store sync event log
 */
export interface ShopifySyncEvent {
  id: number
  storeId: number
  eventType: 'orders' | 'products' | 'customers' | 'inventory' | 'full'
  status: 'started' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  recordsProcessed: number
  recordsFailed: number
  errorMessage?: string
}

/**
 * Shopify store statistics
 */
export interface ShopifyStoreStats {
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  pendingOrders: number
  lastOrderSyncAt?: string
  lastProductSyncAt?: string
  lastCustomerSyncAt?: string
  ordersToday: number
  ordersSynced7Days: number
}

/**
 * DTO for creating a new Shopify store connection
 */
export interface ShopifyStoreCreateDto {
  name: string
  shopDomain: string
  accessToken: string
  apiVersion?: string
  syncOrders?: boolean
  syncProducts?: boolean
  syncCustomers?: boolean
  syncInventory?: boolean
  webhooksEnabled?: boolean
}

/**
 * DTO for updating an existing Shopify store
 */
export interface ShopifyStoreUpdateDto {
  id: number
  name?: string
  accessToken?: string
  apiVersion?: string
  isActive?: boolean
  syncOrders?: boolean
  syncProducts?: boolean
  syncCustomers?: boolean
  syncInventory?: boolean
  webhooksEnabled?: boolean
}

/**
 * Search/filter parameters for Shopify store list
 */
export interface ShopifyStoreSearchParams {
  search?: string
  status?: ShopifyStoreStatus
  isActive?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Shopify store list item (summary view)
 */
export interface ShopifyStoreListItem {
  id: number
  name: string
  shopDomain: string
  isActive: boolean
  status: ShopifyStoreStatus
  statusMessage?: string
  lastSyncAt?: string
  lastSyncStatus?: 'success' | 'failed' | 'partial'
  syncOrders: boolean
  syncProducts: boolean
  createdAt: string
}

/**
 * Shopify connection test result
 */
export interface ShopifyConnectionTestResult {
  success: boolean
  shopName?: string
  shopEmail?: string
  currencyCode?: string
  error?: string
  errorCode?: string
}

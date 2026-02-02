/**
 * Mock handlers for Shopify Store API
 */
import { delay } from '../delay'
import type {
  ShopifyStore,
  ShopifyStoreCreateDto,
  ShopifyStoreUpdateDto,
  ShopifyStoreSearchParams,
  ShopifySyncEvent,
  ShopifyStoreStats,
  ShopifyConnectionTestResult,
} from '@/types/shopify'
import type { ApiResponse, PagedResponse } from '@/types/api'

// Mock data
let mockShopifyStores: ShopifyStore[] = [
  {
    id: 1,
    name: 'ECOLED France Store',
    shopDomain: 'ecoled-france.myshopify.com',
    accessToken: '****************************',
    apiVersion: '2025-01',
    isActive: true,
    status: 'active',
    shopifyShopId: 'gid://shopify/Shop/12345678',
    email: 'contact@ecoled-france.com',
    currencyCode: 'EUR',
    primaryDomain: 'shop.ecoled-france.com',
    planDisplayName: 'Shopify Plus',
    country: 'France',
    syncOrders: true,
    syncProducts: true,
    syncCustomers: true,
    syncInventory: true,
    lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastSyncStatus: 'success',
    webhooksEnabled: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin@ecoled.com',
  },
  {
    id: 2,
    name: 'ECOLED Germany Store',
    shopDomain: 'ecoled-de.myshopify.com',
    accessToken: '****************************',
    apiVersion: '2025-01',
    isActive: true,
    status: 'active',
    shopifyShopId: 'gid://shopify/Shop/87654321',
    email: 'contact@ecoled-de.com',
    currencyCode: 'EUR',
    primaryDomain: 'shop.ecoled-de.com',
    planDisplayName: 'Shopify',
    country: 'Germany',
    syncOrders: true,
    syncProducts: true,
    syncCustomers: false,
    syncInventory: true,
    lastSyncAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastSyncStatus: 'success',
    webhooksEnabled: true,
    createdAt: '2024-03-20T14:00:00Z',
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin@ecoled.com',
  },
  {
    id: 3,
    name: 'Test Development Store',
    shopDomain: 'ecoled-dev.myshopify.com',
    accessToken: '****************************',
    apiVersion: '2025-01',
    isActive: false,
    status: 'inactive',
    statusMessage: 'Store disabled for maintenance',
    shopifyShopId: 'gid://shopify/Shop/11111111',
    email: 'dev@ecoled.com',
    currencyCode: 'EUR',
    primaryDomain: 'dev.ecoled.com',
    planDisplayName: 'Development',
    country: 'France',
    syncOrders: false,
    syncProducts: false,
    syncCustomers: false,
    syncInventory: false,
    webhooksEnabled: false,
    createdAt: '2024-06-01T09:00:00Z',
    updatedAt: '2024-06-15T11:30:00Z',
    createdBy: 'developer@ecoled.com',
  },
  {
    id: 4,
    name: 'ECOLED UK Store',
    shopDomain: 'ecoled-uk.myshopify.com',
    accessToken: '****************************',
    apiVersion: '2025-01',
    isActive: true,
    status: 'error',
    statusMessage: 'Authentication failed - Token expired',
    syncOrders: true,
    syncProducts: true,
    syncCustomers: true,
    syncInventory: true,
    lastSyncAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastSyncStatus: 'failed',
    lastSyncError: 'HTTP 401: Access token is invalid or has expired',
    webhooksEnabled: true,
    createdAt: '2024-02-10T08:00:00Z',
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'admin@ecoled.com',
  },
]

let mockSyncEvents: ShopifySyncEvent[] = [
  {
    id: 1,
    storeId: 1,
    eventType: 'orders',
    status: 'completed',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000).toISOString(),
    recordsProcessed: 25,
    recordsFailed: 0,
  },
  {
    id: 2,
    storeId: 1,
    eventType: 'products',
    status: 'completed',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 60000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 180000).toISOString(),
    recordsProcessed: 150,
    recordsFailed: 2,
  },
  {
    id: 3,
    storeId: 1,
    eventType: 'inventory',
    status: 'completed',
    startedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 26 * 60 * 60 * 1000 + 120000).toISOString(),
    recordsProcessed: 500,
    recordsFailed: 0,
  },
  {
    id: 4,
    storeId: 2,
    eventType: 'full',
    status: 'completed',
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 600000).toISOString(),
    recordsProcessed: 320,
    recordsFailed: 5,
  },
  {
    id: 5,
    storeId: 4,
    eventType: 'orders',
    status: 'failed',
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    recordsProcessed: 0,
    recordsFailed: 0,
    errorMessage: 'HTTP 401: Access token is invalid or has expired',
  },
]

let nextStoreId = 5
let nextEventId = 6

/**
 * Get paginated list of Shopify stores
 */
export async function getShopifyStores(
  params: ShopifyStoreSearchParams = {}
): Promise<PagedResponse<ShopifyStore>> {
  await delay()

  let filtered = [...mockShopifyStores]

  // Apply search filter
  if (params.search) {
    const search = params.search.toLowerCase()
    filtered = filtered.filter(
      (store) =>
        store.name.toLowerCase().includes(search) ||
        store.shopDomain.toLowerCase().includes(search)
    )
  }

  // Apply status filter
  if (params.status) {
    filtered = filtered.filter((store) => store.status === params.status)
  }

  // Apply isActive filter
  if (params.isActive !== undefined) {
    filtered = filtered.filter((store) => store.isActive === params.isActive)
  }

  // Sort
  const sortBy = params.sortBy || 'name'
  const sortOrder = params.sortOrder || 'asc'
  filtered.sort((a, b) => {
    const aVal = a[sortBy as keyof ShopifyStore] ?? ''
    const bVal = b[sortBy as keyof ShopifyStore] ?? ''
    const comparison = String(aVal).localeCompare(String(bVal))
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Paginate
  const page = params.page || 1
  const pageSize = params.pageSize || 10
  const startIndex = (page - 1) * pageSize
  const paginatedData = filtered.slice(startIndex, startIndex + pageSize)

  return {
    success: true,
    data: paginatedData,
    page,
    pageSize,
    totalCount: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
    hasNextPage: page * pageSize < filtered.length,
    hasPreviousPage: page > 1,
  }
}

/**
 * Get a single Shopify store by ID
 */
export async function getShopifyStoreById(id: number): Promise<ApiResponse<ShopifyStore>> {
  await delay()

  const store = mockShopifyStores.find((s) => s.id === id)
  if (!store) {
    throw new Error(`Shopify store not found: ${id}`)
  }

  return {
    success: true,
    data: store,
  }
}

/**
 * Create a new Shopify store
 */
export async function createShopifyStore(
  data: ShopifyStoreCreateDto
): Promise<ApiResponse<ShopifyStore>> {
  await delay()

  const newStore: ShopifyStore = {
    id: nextStoreId++,
    name: data.name,
    shopDomain: data.shopDomain,
    accessToken: '****************************',
    apiVersion: data.apiVersion || '2025-01',
    isActive: true,
    status: 'pending',
    statusMessage: 'Connecting to Shopify...',
    syncOrders: data.syncOrders ?? true,
    syncProducts: data.syncProducts ?? true,
    syncCustomers: data.syncCustomers ?? false,
    syncInventory: data.syncInventory ?? false,
    webhooksEnabled: data.webhooksEnabled ?? false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'current-user@ecoled.com',
  }

  mockShopifyStores.push(newStore)

  // Simulate async connection (after 2 seconds, update status)
  setTimeout(() => {
    const store = mockShopifyStores.find((s) => s.id === newStore.id)
    if (store) {
      store.status = 'active'
      store.statusMessage = undefined
      store.shopifyShopId = `gid://shopify/Shop/${Math.floor(Math.random() * 100000000)}`
      store.email = `contact@${data.shopDomain.replace('.myshopify.com', '')}.com`
      store.currencyCode = 'EUR'
      store.planDisplayName = 'Shopify'
      store.updatedAt = new Date().toISOString()
    }
  }, 2000)

  return {
    success: true,
    data: newStore,
    message: 'Shopify store connection initiated',
  }
}

/**
 * Update a Shopify store
 */
export async function updateShopifyStore(
  data: ShopifyStoreUpdateDto
): Promise<ApiResponse<ShopifyStore>> {
  await delay()

  const index = mockShopifyStores.findIndex((s) => s.id === data.id)
  if (index === -1) {
    throw new Error(`Shopify store not found: ${data.id}`)
  }

  const store = mockShopifyStores[index]
  const updatedStore: ShopifyStore = {
    ...store,
    name: data.name ?? store.name,
    apiVersion: data.apiVersion ?? store.apiVersion,
    isActive: data.isActive ?? store.isActive,
    syncOrders: data.syncOrders ?? store.syncOrders,
    syncProducts: data.syncProducts ?? store.syncProducts,
    syncCustomers: data.syncCustomers ?? store.syncCustomers,
    syncInventory: data.syncInventory ?? store.syncInventory,
    webhooksEnabled: data.webhooksEnabled ?? store.webhooksEnabled,
    updatedAt: new Date().toISOString(),
    updatedBy: 'current-user@ecoled.com',
  }

  // If new access token provided, simulate re-authentication
  if (data.accessToken) {
    updatedStore.status = 'pending'
    updatedStore.statusMessage = 'Re-authenticating...'

    setTimeout(() => {
      const s = mockShopifyStores.find((st) => st.id === data.id)
      if (s) {
        s.status = 'active'
        s.statusMessage = undefined
        s.lastSyncError = undefined
        s.updatedAt = new Date().toISOString()
      }
    }, 1500)
  }

  mockShopifyStores[index] = updatedStore
  return {
    success: true,
    data: updatedStore,
    message: 'Shopify store updated successfully',
  }
}

/**
 * Delete a Shopify store
 */
export async function deleteShopifyStore(id: number): Promise<void> {
  await delay()

  const index = mockShopifyStores.findIndex((s) => s.id === id)
  if (index === -1) {
    throw new Error(`Shopify store not found: ${id}`)
  }

  mockShopifyStores.splice(index, 1)
  // Also remove sync events
  mockSyncEvents = mockSyncEvents.filter((e) => e.storeId !== id)
}

/**
 * Test connection to a Shopify store
 */
export async function testShopifyConnection(id: number): Promise<ShopifyConnectionTestResult> {
  await delay(1500)

  const store = mockShopifyStores.find((s) => s.id === id)
  if (!store) {
    return {
      success: false,
      error: 'Store not found',
      errorCode: 'NOT_FOUND',
    }
  }

  // Simulate connection test
  if (store.status === 'error') {
    return {
      success: false,
      error: store.lastSyncError || 'Connection failed',
      errorCode: 'AUTH_ERROR',
    }
  }

  return {
    success: true,
    shopName: store.name,
    shopEmail: store.email,
    currencyCode: store.currencyCode,
  }
}

/**
 * Trigger a sync for a Shopify store
 */
export async function triggerShopifySync(
  id: number,
  syncType: 'orders' | 'products' | 'customers' | 'inventory' | 'full'
): Promise<void> {
  await delay()

  const store = mockShopifyStores.find((s) => s.id === id)
  if (!store) {
    throw new Error(`Shopify store not found: ${id}`)
  }

  // Create sync event
  const newEvent: ShopifySyncEvent = {
    id: nextEventId++,
    storeId: id,
    eventType: syncType,
    status: 'started',
    startedAt: new Date().toISOString(),
    recordsProcessed: 0,
    recordsFailed: 0,
  }
  mockSyncEvents.unshift(newEvent)

  // Simulate sync completion after delay
  setTimeout(() => {
    const event = mockSyncEvents.find((e) => e.id === newEvent.id)
    const s = mockShopifyStores.find((st) => st.id === id)

    if (event) {
      event.status = store.status === 'error' ? 'failed' : 'completed'
      event.completedAt = new Date().toISOString()
      event.recordsProcessed = store.status === 'error' ? 0 : Math.floor(Math.random() * 100) + 10
      event.recordsFailed = store.status === 'error' ? 0 : Math.floor(Math.random() * 3)
      if (store.status === 'error') {
        event.errorMessage = store.lastSyncError
      }
    }

    if (s && store.status !== 'error') {
      s.lastSyncAt = new Date().toISOString()
      s.lastSyncStatus = 'success'
      s.updatedAt = new Date().toISOString()
    }
  }, 3000)
}

/**
 * Get sync events for a Shopify store
 */
export async function getShopifySyncEvents(
  storeId: number,
  limit: number = 10
): Promise<ShopifySyncEvent[]> {
  await delay()

  return mockSyncEvents
    .filter((e) => e.storeId === storeId)
    .slice(0, limit)
}

/**
 * Get statistics for a Shopify store
 */
export async function getShopifyStoreStats(storeId: number): Promise<ShopifyStoreStats> {
  await delay()

  const store = mockShopifyStores.find((s) => s.id === storeId)
  if (!store) {
    throw new Error(`Shopify store not found: ${storeId}`)
  }

  // Generate mock stats
  return {
    totalOrders: Math.floor(Math.random() * 5000) + 500,
    totalProducts: Math.floor(Math.random() * 500) + 50,
    totalCustomers: Math.floor(Math.random() * 2000) + 200,
    pendingOrders: Math.floor(Math.random() * 20),
    lastOrderSyncAt: store.lastSyncAt,
    lastProductSyncAt: store.lastSyncAt ? new Date(new Date(store.lastSyncAt).getTime() - 3600000).toISOString() : undefined,
    lastCustomerSyncAt: store.syncCustomers ? store.lastSyncAt : undefined,
    ordersToday: Math.floor(Math.random() * 30) + 5,
    ordersSynced7Days: Math.floor(Math.random() * 200) + 50,
  }
}

/**
 * Refresh shop info from Shopify API
 */
export async function refreshShopifyShopInfo(id: number): Promise<ApiResponse<ShopifyStore>> {
  await delay(1000)

  const index = mockShopifyStores.findIndex((s) => s.id === id)
  if (index === -1) {
    throw new Error(`Shopify store not found: ${id}`)
  }

  const store = mockShopifyStores[index]
  const updatedStore: ShopifyStore = {
    ...store,
    updatedAt: new Date().toISOString(),
  }

  mockShopifyStores[index] = updatedStore
  return {
    success: true,
    data: updatedStore,
    message: 'Shop info refreshed successfully',
  }
}

/**
 * Reset mock data (for testing)
 */
export function resetMockShopifyStores(): void {
  mockShopifyStores = [
    {
      id: 1,
      name: 'ECOLED France Store',
      shopDomain: 'ecoled-france.myshopify.com',
      accessToken: '****************************',
      apiVersion: '2025-01',
      isActive: true,
      status: 'active',
      shopifyShopId: 'gid://shopify/Shop/12345678',
      email: 'contact@ecoled-france.com',
      currencyCode: 'EUR',
      primaryDomain: 'shop.ecoled-france.com',
      planDisplayName: 'Shopify Plus',
      country: 'France',
      syncOrders: true,
      syncProducts: true,
      syncCustomers: true,
      syncInventory: true,
      lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastSyncStatus: 'success',
      webhooksEnabled: true,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      createdBy: 'admin@ecoled.com',
    },
  ]
  nextStoreId = 2
}

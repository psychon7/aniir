import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers/shopify'
import { isMockEnabled } from '@/mocks/delay'
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

/**
 * Shopify Store API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const shopifyApi = {
  /**
   * Get paginated list of Shopify stores with optional filtering
   */
  async getAll(params: ShopifyStoreSearchParams = {}): Promise<PagedResponse<ShopifyStore>> {
    if (isMockEnabled()) {
      return mockHandlers.getShopifyStores(params)
    }

    const response = await apiClient.get<PagedResponse<ShopifyStore>>('/integrations/shopify/stores', { params })
    return response.data
  },

  /**
   * Get a single Shopify store by ID
   */
  async getById(id: number): Promise<ShopifyStore> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getShopifyStoreById(id)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<ShopifyStore>>(`/integrations/shopify/stores/${id}`)
    return response.data.data
  },

  /**
   * Create a new Shopify store connection
   */
  async create(data: ShopifyStoreCreateDto): Promise<ShopifyStore> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createShopifyStore(data)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<ShopifyStore>>('/integrations/shopify/stores', data)
    return response.data.data
  },

  /**
   * Update an existing Shopify store
   */
  async update(data: ShopifyStoreUpdateDto): Promise<ShopifyStore> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateShopifyStore(data)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<ShopifyStore>>(`/integrations/shopify/stores/${data.id}`, data)
    return response.data.data
  },

  /**
   * Delete a Shopify store connection
   */
  async delete(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteShopifyStore(id)
      return
    }

    await apiClient.delete(`/integrations/shopify/stores/${id}`)
  },

  /**
   * Test connection to a Shopify store
   */
  async testConnection(id: number): Promise<ShopifyConnectionTestResult> {
    if (isMockEnabled()) {
      return mockHandlers.testShopifyConnection(id)
    }

    const response = await apiClient.post<ApiResponse<ShopifyConnectionTestResult>>(
      `/integrations/shopify/stores/${id}/test-connection`
    )
    return response.data.data
  },

  /**
   * Trigger a manual sync for a Shopify store
   */
  async triggerSync(id: number, syncType: 'orders' | 'products' | 'customers' | 'inventory' | 'full'): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.triggerShopifySync(id, syncType)
      return
    }

    await apiClient.post(`/integrations/shopify/stores/${id}/sync`, { syncType })
  },

  /**
   * Get sync events for a Shopify store
   */
  async getSyncEvents(storeId: number, limit: number = 10): Promise<ShopifySyncEvent[]> {
    if (isMockEnabled()) {
      return mockHandlers.getShopifySyncEvents(storeId, limit)
    }

    const response = await apiClient.get<ApiResponse<ShopifySyncEvent[]>>(
      `/integrations/shopify/stores/${storeId}/sync-events`,
      { params: { limit } }
    )
    return response.data.data
  },

  /**
   * Get statistics for a Shopify store
   */
  async getStats(storeId: number): Promise<ShopifyStoreStats> {
    if (isMockEnabled()) {
      return mockHandlers.getShopifyStoreStats(storeId)
    }

    const response = await apiClient.get<ApiResponse<ShopifyStoreStats>>(
      `/integrations/shopify/stores/${storeId}/stats`
    )
    return response.data.data
  },

  /**
   * Refresh shop info from Shopify API
   */
  async refreshShopInfo(id: number): Promise<ShopifyStore> {
    if (isMockEnabled()) {
      const response = await mockHandlers.refreshShopifyShopInfo(id)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<ShopifyStore>>(
      `/integrations/shopify/stores/${id}/refresh-info`
    )
    return response.data.data
  },
}

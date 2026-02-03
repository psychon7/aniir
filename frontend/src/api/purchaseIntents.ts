import apiClient from './client'
import type {
  PurchaseIntent,
  PurchaseIntentLine,
  PurchaseIntentCreateDto,
  PurchaseIntentUpdateDto,
  PurchaseIntentSearchParams,
  PurchaseIntentLineCreateDto,
  PurchaseIntentLineUpdateDto,
} from '@/types/purchaseIntent'
import type { PagedResponse } from '@/types/api'

/**
 * Purchase Intents API methods
 */
export const purchaseIntentsApi = {
  // ============================================
  // PURCHASE INTENT CRUD OPERATIONS
  // ============================================

  /**
   * Get paginated list of purchase intents with optional filtering
   */
  async getAll(params: PurchaseIntentSearchParams = {}): Promise<PagedResponse<PurchaseIntent>> {
    const response = await apiClient.get<PagedResponse<PurchaseIntent>>('/purchase-intents', { params })
    return response.data
  },

  /**
   * Get a single purchase intent by ID (includes lines)
   */
  async getById(id: number): Promise<PurchaseIntent> {
    const response = await apiClient.get<PurchaseIntent>(`/purchase-intents/${id}`)
    return response.data
  },

  /**
   * Get a single purchase intent by code
   */
  async getByCode(code: string): Promise<PurchaseIntent> {
    const response = await apiClient.get<PurchaseIntent>(`/purchase-intents/by-code/${code}`)
    return response.data
  },

  /**
   * Create a new purchase intent with optional lines
   */
  async create(data: PurchaseIntentCreateDto): Promise<PurchaseIntent> {
    const response = await apiClient.post<PurchaseIntent>('/purchase-intents', data)
    return response.data
  },

  /**
   * Update an existing purchase intent
   */
  async update(id: number, data: PurchaseIntentUpdateDto): Promise<PurchaseIntent> {
    const response = await apiClient.put<PurchaseIntent>(`/purchase-intents/${id}`, data)
    return response.data
  },

  /**
   * Delete a purchase intent (soft delete - sets closed flag)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/purchase-intents/${id}`)
  },

  /**
   * Permanently delete a purchase intent
   */
  async permanentDelete(id: number): Promise<void> {
    await apiClient.delete(`/purchase-intents/${id}/permanent`)
  },

  /**
   * Close a purchase intent
   */
  async close(id: number): Promise<PurchaseIntent> {
    const response = await apiClient.patch<PurchaseIntent>(`/purchase-intents/${id}/close`)
    return response.data
  },

  /**
   * Reopen a closed purchase intent
   */
  async reopen(id: number): Promise<PurchaseIntent> {
    const response = await apiClient.patch<PurchaseIntent>(`/purchase-intents/${id}/reopen`)
    return response.data
  },

  // ============================================
  // PURCHASE INTENT LINES CRUD OPERATIONS
  // ============================================

  /**
   * Get all lines for a purchase intent
   */
  async getLines(intentId: number): Promise<PurchaseIntentLine[]> {
    const response = await apiClient.get<PurchaseIntentLine[]>(`/purchase-intents/${intentId}/lines`)
    return response.data
  },

  /**
   * Get a specific purchase intent line
   */
  async getLine(intentId: number, lineId: number): Promise<PurchaseIntentLine> {
    const response = await apiClient.get<PurchaseIntentLine>(
      `/purchase-intents/${intentId}/lines/${lineId}`
    )
    return response.data
  },

  /**
   * Add a new line to a purchase intent
   */
  async addLine(intentId: number, line: PurchaseIntentLineCreateDto): Promise<PurchaseIntentLine> {
    const response = await apiClient.post<PurchaseIntentLine>(
      `/purchase-intents/${intentId}/lines`,
      line
    )
    return response.data
  },

  /**
   * Update a purchase intent line
   */
  async updateLine(
    intentId: number,
    lineId: number,
    line: PurchaseIntentLineUpdateDto
  ): Promise<PurchaseIntentLine> {
    const response = await apiClient.put<PurchaseIntentLine>(
      `/purchase-intents/${intentId}/lines/${lineId}`,
      line
    )
    return response.data
  },

  /**
   * Delete a purchase intent line
   */
  async deleteLine(intentId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/purchase-intents/${intentId}/lines/${lineId}`)
  },
}

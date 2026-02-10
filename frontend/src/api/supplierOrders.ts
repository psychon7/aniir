import apiClient from './client'
import type {
  SupplierOrder,
  SupplierOrderLine,
  SupplierOrderCreateDto,
  SupplierOrderUpdateDto,
  SupplierOrderSearchParams,
  SupplierOrderLineCreateDto,
  SupplierOrderLineUpdateDto,
  ConfirmSupplierOrderRequest,
  CancelSupplierOrderRequest,
  ConfirmSupplierOrderResponse,
  CancelSupplierOrderResponse,
} from '@/types/supplierOrder'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Supplier Orders API methods
 */
export const supplierOrdersApi = {
  // ============================================
  // ORDER CRUD OPERATIONS
  // ============================================

  /**
   * Get paginated list of supplier orders with optional filtering
   */
  async getAll(params: SupplierOrderSearchParams = {}): Promise<PagedResponse<SupplierOrder>> {
    const response = await apiClient.get<PagedResponse<SupplierOrder>>('/supplier-orders', { params })
    return response.data
  },

  /**
   * Get a single supplier order by ID (includes order lines)
   */
  async getById(id: number): Promise<SupplierOrder> {
    const response = await apiClient.get(`/supplier-orders/${id}`)
    return response.data.data || response.data
  },

  /**
   * Create a new supplier order with optional lines
   */
  async create(data: SupplierOrderCreateDto): Promise<SupplierOrder> {
    const response = await apiClient.post<ApiResponse<SupplierOrder>>('/supplier-orders', data)
    return response.data.data
  },

  /**
   * Update an existing supplier order (header only, use line methods for lines)
   */
  async update(id: number, data: SupplierOrderUpdateDto): Promise<SupplierOrder> {
    const response = await apiClient.put<ApiResponse<SupplierOrder>>(`/supplier-orders/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a supplier order (soft delete)
   * Only allowed for orders that are not started
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/supplier-orders/${id}`)
  },

  // ============================================
  // ORDER STATUS OPERATIONS
  // ============================================

  /**
   * Confirm a supplier order (sets isStarted = true)
   */
  async confirm(id: number, request?: ConfirmSupplierOrderRequest): Promise<ConfirmSupplierOrderResponse> {
    const response = await apiClient.post<ConfirmSupplierOrderResponse>(
      `/supplier-orders/${id}/confirm`,
      request || {}
    )
    return response.data
  },

  /**
   * Mark a supplier order as received
   */
  async receive(id: number): Promise<SupplierOrder> {
    const response = await apiClient.post<ApiResponse<SupplierOrder>>(`/supplier-orders/${id}/receive`)
    return response.data.data
  },

  /**
   * Cancel a supplier order
   */
  async cancel(id: number, request: CancelSupplierOrderRequest): Promise<CancelSupplierOrderResponse> {
    const response = await apiClient.post<CancelSupplierOrderResponse>(
      `/supplier-orders/${id}/cancel`,
      request
    )
    return response.data
  },

  // ============================================
  // ORDER LINES CRUD OPERATIONS
  // ============================================

  /**
   * Get all lines for a supplier order
   */
  async getLines(orderId: number): Promise<SupplierOrderLine[]> {
    const response = await apiClient.get<ApiResponse<SupplierOrderLine[]>>(`/supplier-orders/${orderId}/lines`)
    return response.data.data
  },

  /**
   * Get a specific supplier order line
   */
  async getLine(orderId: number, lineId: number): Promise<SupplierOrderLine> {
    const response = await apiClient.get<ApiResponse<SupplierOrderLine>>(
      `/supplier-orders/${orderId}/lines/${lineId}`
    )
    return response.data.data
  },

  /**
   * Add a new line to a supplier order
   */
  async addLine(orderId: number, line: SupplierOrderLineCreateDto): Promise<SupplierOrderLine> {
    const response = await apiClient.post<ApiResponse<SupplierOrderLine>>(
      `/supplier-orders/${orderId}/lines`,
      line
    )
    return response.data.data
  },

  /**
   * Add multiple lines to a supplier order
   */
  async addLines(orderId: number, lines: SupplierOrderLineCreateDto[]): Promise<SupplierOrderLine[]> {
    const response = await apiClient.post<ApiResponse<SupplierOrderLine[]>>(
      `/supplier-orders/${orderId}/lines/batch`,
      { lines }
    )
    return response.data.data
  },

  /**
   * Update a supplier order line
   */
  async updateLine(orderId: number, lineId: number, line: SupplierOrderLineUpdateDto): Promise<SupplierOrderLine> {
    const response = await apiClient.put<ApiResponse<SupplierOrderLine>>(
      `/supplier-orders/${orderId}/lines/${lineId}`,
      line
    )
    return response.data.data
  },

  /**
   * Delete a supplier order line
   */
  async deleteLine(orderId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/supplier-orders/${orderId}/lines/${lineId}`)
  },

  // ============================================
  // EXPORT OPERATIONS
  // ============================================

  /**
   * Export supplier orders to CSV
   */
  async exportCSV(params: SupplierOrderSearchParams = {}): Promise<string> {
    const response = await apiClient.get<string>('/supplier-orders/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },

  /**
   * Export a single supplier order to PDF
   */
  async exportPDF(id: number): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/supplier-orders/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ============================================
  // ORDER TOTALS RECALCULATION
  // ============================================

  /**
   * Recalculate supplier order totals (useful after line modifications)
   */
  async recalculateTotals(orderId: number): Promise<SupplierOrder> {
    const response = await apiClient.post<ApiResponse<SupplierOrder>>(`/supplier-orders/${orderId}/recalculate`)
    return response.data.data
  },

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Duplicate a supplier order (creates a new draft order based on existing one)
   */
  async duplicate(id: number): Promise<SupplierOrder> {
    const response = await apiClient.post<ApiResponse<SupplierOrder>>(`/supplier-orders/${id}/duplicate`)
    return response.data.data
  },

  /**
   * Get supplier orders for a specific supplier
   */
  async getBySupplier(supplierId: number, params: Omit<SupplierOrderSearchParams, 'supplier_id'> = {}): Promise<PagedResponse<SupplierOrder>> {
    return this.getAll({ ...params, supplier_id: supplierId })
  },

  /**
   * Get pending supplier orders (not started, not canceled)
   */
  async getPending(params: Omit<SupplierOrderSearchParams, 'is_started' | 'is_canceled'> = {}): Promise<PagedResponse<SupplierOrder>> {
    return this.getAll({ ...params, is_started: false, is_canceled: false })
  },

  /**
   * Get active supplier orders (started, not canceled)
   */
  async getActive(params: Omit<SupplierOrderSearchParams, 'is_started' | 'is_canceled'> = {}): Promise<PagedResponse<SupplierOrder>> {
    return this.getAll({ ...params, is_started: true, is_canceled: false })
  },

  /**
   * Get canceled supplier orders
   */
  async getCanceled(params: Omit<SupplierOrderSearchParams, 'is_canceled'> = {}): Promise<PagedResponse<SupplierOrder>> {
    return this.getAll({ ...params, is_canceled: true })
  },
}

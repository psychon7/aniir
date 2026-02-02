import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type {
  Order,
  OrderLine,
  OrderCreateDto,
  OrderUpdateDto,
  OrderSearchParams,
  OrderLineCreateDto,
} from '@/types/order'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * DTO for updating an order line
 */
export interface OrderLineUpdateDto extends Partial<OrderLineCreateDto> {
  id: number
}

/**
 * Orders API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const ordersApi = {
  // ============================================
  // ORDER CRUD OPERATIONS
  // ============================================

  /**
   * Get paginated list of orders with optional filtering
   */
  async getAll(params: OrderSearchParams = {}): Promise<PagedResponse<Order>> {
    if (isMockEnabled()) {
      return mockHandlers.getOrders(params)
    }

    const response = await apiClient.get<PagedResponse<Order>>('/orders', { params })
    return response.data
  },

  /**
   * Get a single order by ID (includes order lines)
   */
  async getById(id: number): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getOrderById(id)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`)
    return response.data.data
  },

  /**
   * Create a new order with optional lines
   */
  async create(data: OrderCreateDto): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createOrder(data)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Order>>('/orders', data)
    return response.data.data
  },

  /**
   * Update an existing order (header only, use line methods for lines)
   */
  async update(data: OrderUpdateDto): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateOrder(data)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<Order>>(`/orders/${data.id}`, data)
    return response.data.data
  },

  /**
   * Delete an order (soft delete)
   * Only allowed for orders in Draft status
   */
  async delete(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteOrder(id)
      return
    }

    await apiClient.delete(`/orders/${id}`)
  },

  /**
   * Update order status
   */
  async updateStatus(id: number, statusId: number): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateOrderStatus(id, statusId)
      return response.data
    }

    const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, { statusId })
    return response.data.data
  },

  /**
   * Confirm a draft order (changes status from Draft to Confirmed)
   */
  async confirm(id: number): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.confirmOrder(id)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/confirm`)
    return response.data.data
  },

  /**
   * Cancel an order
   */
  async cancel(id: number, reason?: string): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.cancelOrder(id, reason)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`, { reason })
    return response.data.data
  },

  /**
   * Duplicate an order (creates a new draft order based on existing one)
   */
  async duplicate(id: number): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.duplicateOrder(id)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/duplicate`)
    return response.data.data
  },

  // ============================================
  // ORDER LINES CRUD OPERATIONS
  // ============================================

  /**
   * Get all lines for an order
   */
  async getLines(orderId: number): Promise<OrderLine[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getOrderLines(orderId)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<OrderLine[]>>(`/orders/${orderId}/lines`)
    return response.data.data
  },

  /**
   * Get a specific order line
   */
  async getLine(orderId: number, lineId: number): Promise<OrderLine> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getOrderLine(orderId, lineId)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<OrderLine>>(
      `/orders/${orderId}/lines/${lineId}`
    )
    return response.data.data
  },

  /**
   * Add a new line to an order
   */
  async addLine(orderId: number, line: OrderLineCreateDto): Promise<OrderLine> {
    if (isMockEnabled()) {
      const response = await mockHandlers.addOrderLine(orderId, line)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<OrderLine>>(
      `/orders/${orderId}/lines`,
      line
    )
    return response.data.data
  },

  /**
   * Add multiple lines to an order
   */
  async addLines(orderId: number, lines: OrderLineCreateDto[]): Promise<OrderLine[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.addOrderLines(orderId, lines)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<OrderLine[]>>(
      `/orders/${orderId}/lines/batch`,
      { lines }
    )
    return response.data.data
  },

  /**
   * Update an order line
   */
  async updateLine(orderId: number, line: OrderLineUpdateDto): Promise<OrderLine> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateOrderLine(orderId, line)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<OrderLine>>(
      `/orders/${orderId}/lines/${line.id}`,
      line
    )
    return response.data.data
  },

  /**
   * Delete an order line
   */
  async deleteLine(orderId: number, lineId: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteOrderLine(orderId, lineId)
      return
    }

    await apiClient.delete(`/orders/${orderId}/lines/${lineId}`)
  },

  // ============================================
  // EXPORT OPERATIONS
  // ============================================

  /**
   * Export orders to CSV
   */
  async exportCSV(params: OrderSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportOrdersToCSV(params)
    }

    const response = await apiClient.get<string>('/orders/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },

  /**
   * Export a single order to PDF
   */
  async exportPDF(id: number): Promise<Blob> {
    if (isMockEnabled()) {
      return mockHandlers.exportOrderToPDF(id)
    }

    const response = await apiClient.get<Blob>(`/orders/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  // ============================================
  // ORDER TOTALS RECALCULATION
  // ============================================

  /**
   * Recalculate order totals (useful after line modifications)
   */
  async recalculateTotals(orderId: number): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.recalculateOrderTotals(orderId)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/recalculate`)
    return response.data.data
  },
}

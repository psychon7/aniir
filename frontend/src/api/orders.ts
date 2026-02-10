import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type {
  Order,
  OrderListItem,
  OrderLine,
  OrderCreateDto,
  OrderUpdateDto,
  OrderSearchParams,
  OrderLineCreateDto,
  OrderDiscountRequest,
  OrderConvertToQuoteResponse,
} from '@/types/order'
import type { PagedResponse } from '@/types/api'

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
  async getAll(params: OrderSearchParams = {}): Promise<PagedResponse<OrderListItem>> {
    if (isMockEnabled()) {
      return mockHandlers.getOrders(params)
    }

    const queryParams: Record<string, any> = {}
    if (params.search) queryParams.search = params.search
    if (params.clientId) queryParams.client_id = params.clientId
    if (params.statusId) queryParams.status_id = params.statusId
    if (params.societyId) queryParams.society_id = params.societyId
    if (params.dateFrom) queryParams.date_from = params.dateFrom
    if (params.dateTo) queryParams.date_to = params.dateTo
    if (params.page) queryParams.page = params.page
    if (params.pageSize) queryParams.pageSize = params.pageSize
    if (params.sortBy) queryParams.sort_by = params.sortBy
    if (params.sortOrder) queryParams.sort_order = params.sortOrder

    const response = await apiClient.get<PagedResponse<Order>>('/orders', { params: queryParams })
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

    const response = await apiClient.get<Order>(`/orders/${id}`)
    return response.data
  },

  /**
   * Get orders by project
   */
  async getByProject(projectId: number): Promise<OrderListItem[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getOrders({ projectId })
      return response.data
    }

    const response = await apiClient.get<OrderListItem[]>(`/orders/by-project/${projectId}`)
    return response.data
  },

  /**
   * Get orders by quote
   */
  async getByQuote(quoteId: number): Promise<OrderListItem[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getOrders({})
      return response.data.filter((o) => o.quoteReference)
    }

    const response = await apiClient.get<OrderListItem[]>(`/orders/by-quote/${quoteId}`)
    return response.data
  },

  /**
   * Create a new order with optional lines
   */
  async create(data: OrderCreateDto): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createOrder(data)
      return response.data
    }

    const response = await apiClient.post<Order>('/orders', data)
    return response.data
  },

  /**
   * Update an existing order (header only, use line methods for lines)
   */
  async update(data: OrderUpdateDto): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateOrder(data)
      return response.data
    }

    const response = await apiClient.put<Order>(`/orders/${data.id}`, data)
    return response.data
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

    const response = await apiClient.patch<Order>(`/orders/${id}/status`, { statusId })
    return response.data
  },

  /**
   * Confirm a draft order (changes status from Draft to Confirmed)
   */
  async confirm(id: number): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.confirmOrder(id)
      return response.data
    }

    const response = await apiClient.post<Order>(`/orders/${id}/confirm`)
    return response.data
  },

  /**
   * Cancel an order
   */
  async cancel(id: number, reason?: string): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.cancelOrder(id, reason)
      return response.data
    }

    const response = await apiClient.post<Order>(`/orders/${id}/cancel`, { reason })
    return response.data
  },

  /**
   * Duplicate an order (creates a new draft order based on existing one)
   */
  async duplicate(id: number): Promise<Order> {
    if (isMockEnabled()) {
      const response = await mockHandlers.duplicateOrder(id)
      return response.data
    }

    const response = await apiClient.post<Order>(`/orders/${id}/duplicate`)
    return response.data
  },

  /**
   * Convert order to quote (reverse conversion)
   */
  async convertToQuote(id: number): Promise<OrderConvertToQuoteResponse> {
    const response = await apiClient.post<{
      order_id: number
      quote_id: number
      quote_reference: string
      converted_at: string
      lines_converted: number
    }>(`/orders/${id}/convert-to-quote`)

    return {
      orderId: response.data.order_id,
      quoteId: response.data.quote_id,
      quoteReference: response.data.quote_reference,
      convertedAt: response.data.converted_at,
      linesConverted: response.data.lines_converted,
    }
  },

  /**
   * Update order-level discount
   */
  async updateDiscount(id: number, request: OrderDiscountRequest): Promise<Order> {
    const payload = {
      discount_percentage: request.discountPercentage,
      discount_amount: request.discountAmount,
    }
    const response = await apiClient.post<Order>(`/orders/${id}/discount`, payload)
    return response.data
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

    const response = await apiClient.get<OrderLine[]>(`/orders/${orderId}/lines`)
    return response.data
  },

  /**
   * Get a specific order line
   */
  async getLine(orderId: number, lineId: number): Promise<OrderLine> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getOrderLine(orderId, lineId)
      return response.data
    }

    const response = await apiClient.get<OrderLine>(`/orders/${orderId}/lines/${lineId}`)
    return response.data
  },

  /**
   * Add a new line to an order
   */
  async addLine(orderId: number, line: OrderLineCreateDto): Promise<OrderLine> {
    if (isMockEnabled()) {
      const response = await mockHandlers.addOrderLine(orderId, line)
      return response.data
    }

    const response = await apiClient.post<OrderLine>(`/orders/${orderId}/lines`, line)
    return response.data
  },

  /**
   * Add multiple lines to an order
   */
  async addLines(orderId: number, lines: OrderLineCreateDto[]): Promise<OrderLine[]> {
    if (isMockEnabled()) {
      const response = await mockHandlers.addOrderLines(orderId, lines)
      return response.data
    }

    const response = await apiClient.post<OrderLine[]>(`/orders/${orderId}/lines/batch`, { lines })
    return response.data
  },

  /**
   * Update an order line
   */
  async updateLine(orderId: number, line: OrderLineUpdateDto): Promise<OrderLine> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateOrderLine(orderId, line)
      return response.data
    }

    const response = await apiClient.put<OrderLine>(`/orders/${orderId}/lines/${line.id}`, line)
    return response.data
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
  // SEND OPERATIONS
  // ============================================

  /**
   * Send order via email with PDF attachment
   */
  async send(
    id: number,
    toEmail: string,
    subject?: string,
    body?: string,
    cc?: string
  ): Promise<any> {
    if (isMockEnabled()) {
      return { success: true, message: 'Order sent (mock)' }
    }

    const response = await apiClient.post(`/orders/${id}/send`, {
      to_email: toEmail,
      subject,
      body,
      cc,
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

    const response = await apiClient.post<Order>(`/orders/${orderId}/recalculate`)
    return response.data
  },
}

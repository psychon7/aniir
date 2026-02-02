import apiClient from './client'
import type {
  DeliveryForm,
  DeliveryLine,
  DeliveryFormCreateDto,
  DeliveryFormUpdateDto,
  DeliveryLineCreateDto,
  DeliveryLineUpdateDto,
  DeliverySearchParams,
  DeliveryShipRequest,
  DeliveryDeliverRequest,
} from '@/types/delivery'
import type { PagedResponse } from '@/types/api'

/**
 * Deliveries API methods
 */
export const deliveriesApi = {
  /**
   * Get paginated list of deliveries with optional filtering
   */
  async getAll(params: DeliverySearchParams = {}): Promise<PagedResponse<DeliveryForm>> {
    const queryParams: Record<string, any> = {}
    
    if (params.search) queryParams.search = params.search
    if (params.clientId) queryParams.client_id = params.clientId
    if (params.orderId) queryParams.order_id = params.orderId
    if (params.projectId) queryParams.project_id = params.projectId
    if (params.statusId) queryParams.status_id = params.statusId
    if (params.isShipped !== undefined) queryParams.is_shipped = params.isShipped
    if (params.isDelivered !== undefined) queryParams.is_delivered = params.isDelivered
    if (params.dateFrom) queryParams.date_from = params.dateFrom
    if (params.dateTo) queryParams.date_to = params.dateTo
    if (params.page) queryParams.page = params.page
    if (params.pageSize) queryParams.page_size = params.pageSize
    if (params.sortBy) queryParams.sort_by = params.sortBy
    if (params.sortOrder) queryParams.sort_order = params.sortOrder

    const response = await apiClient.get('/deliveries', { params: queryParams })
    const data = response.data
    const page = data.page || params.page || 1
    const pageSize = data.page_size || params.pageSize || 20
    const totalCount = data.total || 0
    const totalPages = data.total_pages || Math.ceil(totalCount / pageSize)

    return {
      success: true,
      data: data.items || [],
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  },

  /**
   * Get a single delivery by ID
   */
  async getById(id: number): Promise<DeliveryForm> {
    const response = await apiClient.get(`/deliveries/${id}`)
    return response.data
  },

  /**
   * Create a new delivery form
   */
  async create(data: DeliveryFormCreateDto): Promise<DeliveryForm> {
    const response = await apiClient.post('/deliveries', data)
    return response.data
  },

  /**
   * Update an existing delivery form
   */
  async update(id: number, data: DeliveryFormUpdateDto): Promise<DeliveryForm> {
    const response = await apiClient.put(`/deliveries/${id}`, data)
    return response.data
  },

  /**
   * Delete a delivery form
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/deliveries/${id}`)
  },

  /**
   * Ship a delivery
   */
  async ship(id: number, request?: DeliveryShipRequest): Promise<DeliveryForm> {
    const response = await apiClient.post(`/deliveries/${id}/ship`, request || {})
    return response.data
  },

  /**
   * Mark delivery as delivered
   */
  async deliver(id: number, request?: DeliveryDeliverRequest): Promise<DeliveryForm> {
    const response = await apiClient.post(`/deliveries/${id}/deliver`, request || {})
    return response.data
  },

  /**
   * Get deliveries by order
   */
  async getByOrder(orderId: number): Promise<DeliveryForm[]> {
    const response = await apiClient.get(`/deliveries/by-order/${orderId}`)
    return response.data
  },

  // ==================== Delivery Lines ====================

  /**
   * Get all lines for a delivery
   */
  async getLines(deliveryId: number): Promise<DeliveryLine[]> {
    const response = await apiClient.get(`/deliveries/${deliveryId}/lines`)
    return response.data.data || response.data
  },

  /**
   * Add a line to a delivery
   */
  async addLine(deliveryId: number, line: DeliveryLineCreateDto): Promise<DeliveryLine> {
    const response = await apiClient.post(`/deliveries/${deliveryId}/lines`, line)
    return response.data.data || response.data
  },

  /**
   * Update a delivery line
   */
  async updateLine(
    deliveryId: number,
    lineId: number,
    line: DeliveryLineUpdateDto
  ): Promise<DeliveryLine> {
    const response = await apiClient.put(`/deliveries/${deliveryId}/lines/${lineId}`, line)
    return response.data.data || response.data
  },

  /**
   * Delete a delivery line
   */
  async deleteLine(deliveryId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/deliveries/${deliveryId}/lines/${lineId}`)
  },
}

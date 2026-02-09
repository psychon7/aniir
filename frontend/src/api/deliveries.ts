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
    if (params.pageSize) queryParams.pageSize = params.pageSize
    if (params.sortBy) queryParams.sort_by = params.sortBy
    if (params.sortOrder) queryParams.sort_order = params.sortOrder

    const response = await apiClient.get('/deliveries', { params: queryParams })
    return response.data
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

  // ==================== PDF & Send Operations ====================

  /**
   * Generate and download delivery form PDF
   */
  async downloadPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`/deliveries/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Send delivery form via email with PDF attachment
   */
  async send(
    id: number,
    toEmail: string,
    subject?: string,
    body?: string,
    cc?: string
  ): Promise<any> {
    const response = await apiClient.post(`/deliveries/${id}/send`, {
      to_email: toEmail,
      subject,
      body,
      cc,
    })
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
    const response = await apiClient.put(`/deliveries/lines/${lineId}`, line)
    return response.data.data || response.data
  },

  /**
   * Delete a delivery line
   */
  async deleteLine(deliveryId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/deliveries/lines/${lineId}`)
  },
}

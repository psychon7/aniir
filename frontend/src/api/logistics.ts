import apiClient from './client'
import type {
  Shipment,
  ShipmentDetail,
  ShipmentListItem,
  ShipmentCreateDto,
  ShipmentUpdateDto,
  ShipmentSearchParams,
  ShipmentListResponse,
  TrackingResponse,
  BulkStatusUpdateRequest,
  BulkStatusUpdateResponse,
  Carrier,
  CarrierListItem,
} from '@/types/logistics'

/**
 * Logistics API methods
 */
export const logisticsApi = {
  // ============================================
  // SHIPMENT CRUD OPERATIONS
  // ============================================

  /**
   * Get paginated list of shipments with optional filtering
   */
  async getShipments(params: ShipmentSearchParams = {}): Promise<ShipmentListResponse> {
    const response = await apiClient.get<ShipmentListResponse>('/logistics/shipments', { params })
    return response.data
  },

  /**
   * Get a shipment by ID
   */
  async getShipmentById(id: number): Promise<ShipmentDetail> {
    const response = await apiClient.get<ShipmentDetail>(`/logistics/shipments/${id}`)
    return response.data
  },

  /**
   * Get a shipment by reference
   */
  async getShipmentByReference(reference: string): Promise<ShipmentDetail> {
    const response = await apiClient.get<ShipmentDetail>(`/logistics/shipments/by-reference/${reference}`)
    return response.data
  },

  /**
   * Create a new shipment
   */
  async createShipment(data: ShipmentCreateDto): Promise<ShipmentDetail> {
    const response = await apiClient.post<ShipmentDetail>('/logistics/shipments', data)
    return response.data
  },

  /**
   * Update a shipment
   */
  async updateShipment(id: number, data: ShipmentUpdateDto): Promise<ShipmentDetail> {
    const response = await apiClient.put<ShipmentDetail>(`/logistics/shipments/${id}`, data)
    return response.data
  },

  /**
   * Delete a shipment
   */
  async deleteShipment(id: number): Promise<void> {
    await apiClient.delete(`/logistics/shipments/${id}`)
  },

  // ============================================
  // STATUS OPERATIONS
  // ============================================

  /**
   * Update shipment status
   */
  async updateShipmentStatus(id: number, statusId: number, notes?: string): Promise<ShipmentDetail> {
    const response = await apiClient.patch<ShipmentDetail>(`/logistics/shipments/${id}/status`, null, {
      params: { status_id: statusId, notes }
    })
    return response.data
  },

  /**
   * Bulk update shipment statuses
   */
  async bulkUpdateStatus(request: BulkStatusUpdateRequest): Promise<BulkStatusUpdateResponse> {
    const response = await apiClient.post<BulkStatusUpdateResponse>('/logistics/shipments/bulk-status', request)
    return response.data
  },

  /**
   * Mark shipment as delivered
   */
  async markDelivered(id: number, actualDelivery?: string): Promise<ShipmentDetail> {
    const response = await apiClient.post<ShipmentDetail>(`/logistics/shipments/${id}/delivered`, null, {
      params: { actual_delivery: actualDelivery }
    })
    return response.data
  },

  // ============================================
  // TRACKING OPERATIONS
  // ============================================

  /**
   * Get tracking information by tracking number
   */
  async getTracking(trackingNumber: string): Promise<TrackingResponse> {
    const response = await apiClient.get<TrackingResponse>(`/logistics/tracking/${trackingNumber}`)
    return response.data
  },

  /**
   * Get tracking information by shipment ID
   */
  async getTrackingByShipmentId(shipmentId: number): Promise<TrackingResponse> {
    const response = await apiClient.get<TrackingResponse>(`/logistics/shipments/${shipmentId}/tracking`)
    return response.data
  },

  // ============================================
  // CARRIER OPERATIONS
  // ============================================

  /**
   * Get list of carriers
   */
  async getCarriers(activeOnly = true): Promise<CarrierListItem[]> {
    const response = await apiClient.get<CarrierListItem[]>('/logistics/carriers', {
      params: { active_only: activeOnly }
    })
    return response.data
  },

  /**
   * Get carrier by ID
   */
  async getCarrierById(id: number): Promise<Carrier> {
    const response = await apiClient.get<Carrier>(`/logistics/carriers/${id}`)
    return response.data
  },

  // ============================================
  // STATISTICS & REPORTS
  // ============================================

  /**
   * Get shipment statistics
   */
  async getStatistics(params?: { from_date?: string; to_date?: string }): Promise<{
    total_shipments: number
    delivered: number
    in_transit: number
    pending: number
    returned: number
    on_time_percentage: number
    average_delivery_time: number
  }> {
    const response = await apiClient.get('/logistics/statistics', { params })
    return response.data
  },

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get shipments by status
   */
  async getShipmentsByStatus(statusId: number, params: Omit<ShipmentSearchParams, 'status_id'> = {}): Promise<ShipmentListResponse> {
    return this.getShipments({ ...params, status_id: statusId })
  },

  /**
   * Get shipments by carrier
   */
  async getShipmentsByCarrier(carrierId: number, params: Omit<ShipmentSearchParams, 'carrier_id'> = {}): Promise<ShipmentListResponse> {
    return this.getShipments({ ...params, carrier_id: carrierId })
  },

  /**
   * Get pending shipments
   */
  async getPendingShipments(params: Omit<ShipmentSearchParams, 'status_id'> = {}): Promise<ShipmentListResponse> {
    return this.getShipments({ ...params, status_id: 1 }) // Assuming status_id 1 = pending
  },

  /**
   * Get in-transit shipments
   */
  async getInTransitShipments(params: Omit<ShipmentSearchParams, 'status_id'> = {}): Promise<ShipmentListResponse> {
    return this.getShipments({ ...params, status_id: 2 }) // Assuming status_id 2 = in_transit
  },
}

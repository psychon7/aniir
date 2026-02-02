import apiClient from './client'
import type {
  SupplyLot,
  SupplyLotDetail,
  SupplyLotCreateDto,
  SupplyLotUpdateDto,
  SupplyLotSearchParams,
  SupplyLotListResponse,
  SupplyLotItem,
  SupplyLotItemCreateDto,
  SupplyLotItemUpdateDto,
  FreightCost,
  FreightCostCreateDto,
  FreightCostUpdateDto,
  LandedCostBreakdown,
  LandedCostCalculationRequest,
  LandedCostCalculationResponse,
  AllocationLog,
} from '@/types/landed-cost'
import type { ApiResponse } from '@/types/api'

/**
 * Landed Cost API methods for Supply Lots, Freight Costs, and Cost Calculations
 */
export const landedCostApi = {
  // =====================
  // Supply Lots
  // =====================

  /**
   * Get paginated list of supply lots with optional filtering
   */
  async getSupplyLots(params: SupplyLotSearchParams = {}): Promise<SupplyLotListResponse> {
    const response = await apiClient.get<SupplyLotListResponse>('/landed-cost/supply-lots', { params })
    return response.data
  },

  /**
   * Get a single supply lot by ID with items and freight costs
   */
  async getSupplyLotById(lotId: number): Promise<SupplyLotDetail> {
    const response = await apiClient.get<ApiResponse<SupplyLotDetail>>(`/landed-cost/supply-lots/${lotId}`)
    return response.data.data
  },

  /**
   * Create a new supply lot
   */
  async createSupplyLot(data: SupplyLotCreateDto): Promise<SupplyLot> {
    const response = await apiClient.post<ApiResponse<SupplyLot>>('/landed-cost/supply-lots', data)
    return response.data.data
  },

  /**
   * Update an existing supply lot
   */
  async updateSupplyLot(lotId: number, data: SupplyLotUpdateDto): Promise<SupplyLot> {
    const response = await apiClient.put<ApiResponse<SupplyLot>>(`/landed-cost/supply-lots/${lotId}`, data)
    return response.data.data
  },

  /**
   * Delete a supply lot
   */
  async deleteSupplyLot(lotId: number): Promise<void> {
    await apiClient.delete(`/landed-cost/supply-lots/${lotId}`)
  },

  // =====================
  // Supply Lot Items
  // =====================

  /**
   * Add an item to a supply lot
   */
  async addSupplyLotItem(lotId: number, data: SupplyLotItemCreateDto): Promise<SupplyLotItem> {
    const response = await apiClient.post<ApiResponse<SupplyLotItem>>(
      `/landed-cost/supply-lots/${lotId}/items`,
      data
    )
    return response.data.data
  },

  /**
   * Update a supply lot item
   */
  async updateSupplyLotItem(lotId: number, itemId: number, data: SupplyLotItemUpdateDto): Promise<SupplyLotItem> {
    const response = await apiClient.put<ApiResponse<SupplyLotItem>>(
      `/landed-cost/supply-lots/${lotId}/items/${itemId}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete a supply lot item
   */
  async deleteSupplyLotItem(lotId: number, itemId: number): Promise<void> {
    await apiClient.delete(`/landed-cost/supply-lots/${lotId}/items/${itemId}`)
  },

  // =====================
  // Freight Costs
  // =====================

  /**
   * Add a freight cost to a supply lot
   */
  async addFreightCost(lotId: number, data: Omit<FreightCostCreateDto, 'frc_lot_id'>): Promise<FreightCost> {
    const response = await apiClient.post<ApiResponse<FreightCost>>(
      `/landed-cost/supply-lots/${lotId}/freight-costs`,
      { ...data, frc_lot_id: lotId }
    )
    return response.data.data
  },

  /**
   * Update a freight cost
   */
  async updateFreightCost(lotId: number, costId: number, data: FreightCostUpdateDto): Promise<FreightCost> {
    const response = await apiClient.put<ApiResponse<FreightCost>>(
      `/landed-cost/supply-lots/${lotId}/freight-costs/${costId}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete a freight cost
   */
  async deleteFreightCost(lotId: number, costId: number): Promise<void> {
    await apiClient.delete(`/landed-cost/supply-lots/${lotId}/freight-costs/${costId}`)
  },

  // =====================
  // Landed Cost Calculations
  // =====================

  /**
   * Calculate landed costs for a supply lot
   */
  async calculateLandedCost(
    lotId: number,
    request: LandedCostCalculationRequest
  ): Promise<LandedCostCalculationResponse> {
    const response = await apiClient.post<ApiResponse<LandedCostCalculationResponse>>(
      `/landed-cost/supply-lots/${lotId}/calculate`,
      request
    )
    return response.data.data
  },

  /**
   * Get landed cost breakdown for a supply lot
   */
  async getLandedCostBreakdown(lotId: number): Promise<LandedCostBreakdown> {
    const response = await apiClient.get<ApiResponse<LandedCostBreakdown>>(
      `/landed-cost/supply-lots/${lotId}/breakdown`
    )
    return response.data.data
  },

  /**
   * Get allocation history for a supply lot
   */
  async getAllocationHistory(lotId: number): Promise<AllocationLog[]> {
    const response = await apiClient.get<ApiResponse<AllocationLog[]>>(
      `/landed-cost/supply-lots/${lotId}/allocation-history`
    )
    return response.data.data
  },
}

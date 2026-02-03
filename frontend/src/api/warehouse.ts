import apiClient from './client'
import type {
  Warehouse,
  WarehouseDetail,
  WarehouseCreateDto,
  WarehouseUpdateDto,
  WarehouseSearchParams,
  WarehouseListResponse,
  WarehouseDropdownResponse,
  Stock,
  StockListItem,
  StockCreateDto,
  StockUpdateDto,
  StockSearchParams,
  StockListResponse,
  StockAdjustment,
  StockLevelSummary,
  StockMovement,
  StockMovementWithLines,
  StockMovementListItem,
  StockMovementCreateDto,
  StockMovementUpdateDto,
  StockMovementSearchParams,
  StockMovementListResponse,
  StockMovementLine,
  StockMovementLineCreateDto,
  StockMovementLineUpdateDto,
} from '@/types/warehouse'

/**
 * Warehouse API methods
 */
export const warehouseApi = {
  // ============================================
  // WAREHOUSE CRUD OPERATIONS
  // ============================================

  /**
   * Get paginated list of warehouses with optional filtering
   */
  async getWarehouses(params: WarehouseSearchParams = {}): Promise<WarehouseListResponse> {
    const response = await apiClient.get<WarehouseListResponse>('/warehouse/warehouses', { params })
    return response.data
  },

  /**
   * Get warehouses for dropdown selection
   */
  async getWarehouseLookup(search?: string, activeOnly = true, limit = 50): Promise<WarehouseDropdownResponse> {
    const response = await apiClient.get<WarehouseDropdownResponse>('/warehouse/warehouses/lookup', {
      params: { search, active_only: activeOnly, limit }
    })
    return response.data
  },

  /**
   * Get warehouse count
   */
  async getWarehouseCount(activeOnly = false): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/warehouse/warehouses/count', {
      params: { active_only: activeOnly }
    })
    return response.data.count
  },

  /**
   * Get the default warehouse
   */
  async getDefaultWarehouse(): Promise<Warehouse | null> {
    const response = await apiClient.get<Warehouse | null>('/warehouse/warehouses/default')
    return response.data
  },

  /**
   * Get a warehouse by ID
   */
  async getWarehouseById(id: number): Promise<WarehouseDetail> {
    const response = await apiClient.get<WarehouseDetail>(`/warehouse/warehouses/${id}`)
    return response.data
  },

  /**
   * Get a warehouse by code
   */
  async getWarehouseByCode(code: string): Promise<Warehouse> {
    const response = await apiClient.get<Warehouse>(`/warehouse/warehouses/by-code/${code}`)
    return response.data
  },

  /**
   * Create a new warehouse
   */
  async createWarehouse(data: WarehouseCreateDto): Promise<Warehouse> {
    const response = await apiClient.post<Warehouse>('/warehouse/warehouses', data)
    return response.data
  },

  /**
   * Update a warehouse
   */
  async updateWarehouse(id: number, data: WarehouseUpdateDto): Promise<Warehouse> {
    const response = await apiClient.put<Warehouse>(`/warehouse/warehouses/${id}`, data)
    return response.data
  },

  /**
   * Delete a warehouse
   */
  async deleteWarehouse(id: number): Promise<void> {
    await apiClient.delete(`/warehouse/warehouses/${id}`)
  },

  // ============================================
  // STOCK CRUD OPERATIONS
  // ============================================

  /**
   * Get paginated list of stock with optional filtering
   */
  async getStock(params: StockSearchParams = {}): Promise<StockListResponse> {
    const response = await apiClient.get<StockListResponse>('/warehouse/stock', { params })
    return response.data
  },

  /**
   * Get stock summary
   */
  async getStockSummary(socId?: number, whsId?: number): Promise<StockLevelSummary> {
    const response = await apiClient.get<StockLevelSummary>('/warehouse/stock/summary', {
      params: { soc_id: socId, whs_id: whsId }
    })
    return response.data
  },

  /**
   * Get low stock items
   */
  async getLowStockItems(socId?: number, limit = 50): Promise<Stock[]> {
    const response = await apiClient.get<Stock[]>('/warehouse/stock/low-stock', {
      params: { soc_id: socId, limit }
    })
    return response.data
  },

  /**
   * Get a stock record by ID
   */
  async getStockById(id: number): Promise<Stock> {
    const response = await apiClient.get<Stock>(`/warehouse/stock/${id}`)
    return response.data
  },

  /**
   * Create a new stock record
   */
  async createStock(data: StockCreateDto): Promise<Stock> {
    const response = await apiClient.post<Stock>('/warehouse/stock', data)
    return response.data
  },

  /**
   * Update a stock record
   */
  async updateStock(id: number, data: StockUpdateDto): Promise<Stock> {
    const response = await apiClient.put<Stock>(`/warehouse/stock/${id}`, data)
    return response.data
  },

  /**
   * Adjust stock quantity
   */
  async adjustStock(adjustment: StockAdjustment): Promise<Stock> {
    const response = await apiClient.post<Stock>('/warehouse/stock/adjust', adjustment)
    return response.data
  },

  /**
   * Reserve stock quantity
   */
  async reserveStock(stockId: number, quantity: number): Promise<Stock> {
    const response = await apiClient.post<Stock>(`/warehouse/stock/${stockId}/reserve`, null, {
      params: { quantity }
    })
    return response.data
  },

  /**
   * Release reserved stock
   */
  async releaseReservation(stockId: number, quantity: number): Promise<Stock> {
    const response = await apiClient.post<Stock>(`/warehouse/stock/${stockId}/release`, null, {
      params: { quantity }
    })
    return response.data
  },

  /**
   * Delete a stock record
   */
  async deleteStock(id: number): Promise<void> {
    await apiClient.delete(`/warehouse/stock/${id}`)
  },

  // ============================================
  // STOCK MOVEMENT CRUD OPERATIONS
  // ============================================

  /**
   * Get paginated list of stock movements with optional filtering
   */
  async getMovements(params: StockMovementSearchParams = {}): Promise<StockMovementListResponse> {
    const response = await apiClient.get<StockMovementListResponse>('/warehouse/movements', { params })
    return response.data
  },

  /**
   * Get a stock movement by ID (includes lines)
   */
  async getMovementById(id: number): Promise<StockMovementWithLines> {
    const response = await apiClient.get<StockMovementWithLines>(`/warehouse/movements/${id}`)
    return response.data
  },

  /**
   * Get a stock movement by reference
   */
  async getMovementByReference(reference: string): Promise<StockMovementWithLines> {
    const response = await apiClient.get<StockMovementWithLines>(`/warehouse/movements/by-reference/${reference}`)
    return response.data
  },

  /**
   * Create a new stock movement
   */
  async createMovement(data: StockMovementCreateDto): Promise<StockMovementWithLines> {
    const response = await apiClient.post<StockMovementWithLines>('/warehouse/movements', data)
    return response.data
  },

  /**
   * Update a stock movement
   */
  async updateMovement(id: number, data: StockMovementUpdateDto): Promise<StockMovementWithLines> {
    const response = await apiClient.put<StockMovementWithLines>(`/warehouse/movements/${id}`, data)
    return response.data
  },

  /**
   * Complete a stock movement (updates stock levels)
   */
  async completeMovement(id: number, validatedBy?: number): Promise<StockMovementWithLines> {
    const response = await apiClient.post<StockMovementWithLines>(`/warehouse/movements/${id}/complete`, null, {
      params: { validated_by: validatedBy }
    })
    return response.data
  },

  /**
   * Cancel a stock movement
   */
  async cancelMovement(id: number): Promise<StockMovementWithLines> {
    const response = await apiClient.post<StockMovementWithLines>(`/warehouse/movements/${id}/cancel`)
    return response.data
  },

  /**
   * Delete a stock movement
   */
  async deleteMovement(id: number): Promise<void> {
    await apiClient.delete(`/warehouse/movements/${id}`)
  },

  // ============================================
  // MOVEMENT LINE OPERATIONS
  // ============================================

  /**
   * Add a line to a movement
   */
  async addMovementLine(movementId: number, line: StockMovementLineCreateDto): Promise<StockMovementLine> {
    const response = await apiClient.post<StockMovementLine>(`/warehouse/movements/${movementId}/lines`, line)
    return response.data
  },

  /**
   * Update a movement line
   */
  async updateMovementLine(lineId: number, line: StockMovementLineUpdateDto): Promise<StockMovementLine> {
    const response = await apiClient.put<StockMovementLine>(`/warehouse/movements/lines/${lineId}`, line)
    return response.data
  },

  /**
   * Delete a movement line
   */
  async deleteMovementLine(lineId: number): Promise<void> {
    await apiClient.delete(`/warehouse/movements/lines/${lineId}`)
  },

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get stock by warehouse
   */
  async getStockByWarehouse(warehouseId: number, params: Omit<StockSearchParams, 'whs_id'> = {}): Promise<StockListResponse> {
    return this.getStock({ ...params, whs_id: warehouseId })
  },

  /**
   * Get stock by product
   */
  async getStockByProduct(productId: number, params: Omit<StockSearchParams, 'prd_id'> = {}): Promise<StockListResponse> {
    return this.getStock({ ...params, prd_id: productId })
  },

  /**
   * Get movements by warehouse
   */
  async getMovementsByWarehouse(warehouseId: number, params: Omit<StockMovementSearchParams, 'whs_id'> = {}): Promise<StockMovementListResponse> {
    return this.getMovements({ ...params, whs_id: warehouseId })
  },

  /**
   * Get movements by type
   */
  async getMovementsByType(type: StockMovementCreateDto['stm_type'], params: Omit<StockMovementSearchParams, 'stm_type'> = {}): Promise<StockMovementListResponse> {
    return this.getMovements({ ...params, stm_type: type })
  },
}

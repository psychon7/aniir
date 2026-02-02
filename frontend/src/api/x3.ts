/**
 * Sage X3 Integration API
 * API methods for X3 customer/product mappings and export operations
 */
import apiClient from './client'
import type {
  X3CustomerMapping,
  X3CustomerMappingCreateDto,
  X3CustomerMappingUpdateDto,
  X3CustomerMappingSearchParams,
  X3ProductMapping,
  X3ProductMappingCreateDto,
  X3ProductMappingUpdateDto,
  X3ProductMappingSearchParams,
  X3MappingListResponse,
  X3MappingStats,
  X3BulkMappingData,
  X3BulkMappingResponse,
  X3InvoiceExportRequest,
  X3InvoiceExportResponse,
  X3ValidationResponse,
  X3ExportLog,
  X3ExportLogListResponse,
  X3ExportLogSearchParams,
  UnmappedCustomer,
  UnmappedProduct,
} from '@/types/x3'

// ==========================================================================
// Customer Mapping API
// ==========================================================================

export const x3CustomerMappingApi = {
  /**
   * Get paginated list of customer mappings
   */
  async getAll(params: X3CustomerMappingSearchParams = {}): Promise<X3MappingListResponse<X3CustomerMapping>> {
    const response = await apiClient.get<X3MappingListResponse<X3CustomerMapping>>(
      '/integrations/x3/mappings/customers',
      { params }
    )
    return response.data
  },

  /**
   * Get a single customer mapping by ID
   */
  async getById(id: number): Promise<X3CustomerMapping> {
    const response = await apiClient.get<X3CustomerMapping>(`/integrations/x3/mappings/customers/${id}`)
    return response.data
  },

  /**
   * Get customer mapping by ERP client ID
   */
  async getByClientId(clientId: number): Promise<X3CustomerMapping> {
    const response = await apiClient.get<X3CustomerMapping>(
      `/integrations/x3/mappings/customers/by-client/${clientId}`
    )
    return response.data
  },

  /**
   * Create a new customer mapping
   */
  async create(data: X3CustomerMappingCreateDto): Promise<X3CustomerMapping> {
    const response = await apiClient.post<X3CustomerMapping>('/integrations/x3/mappings/customers', data)
    return response.data
  },

  /**
   * Update an existing customer mapping
   */
  async update(id: number, data: X3CustomerMappingUpdateDto): Promise<X3CustomerMapping> {
    const response = await apiClient.patch<X3CustomerMapping>(`/integrations/x3/mappings/customers/${id}`, data)
    return response.data
  },

  /**
   * Delete a customer mapping
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/integrations/x3/mappings/customers/${id}`)
  },

  /**
   * Bulk create customer mappings
   */
  async bulkCreate(mappings: X3BulkMappingData[]): Promise<X3BulkMappingResponse> {
    const response = await apiClient.post<X3BulkMappingResponse>(
      '/integrations/x3/mappings/customers/bulk',
      { mappings }
    )
    return response.data
  },
}

// ==========================================================================
// Product Mapping API
// ==========================================================================

export const x3ProductMappingApi = {
  /**
   * Get paginated list of product mappings
   */
  async getAll(params: X3ProductMappingSearchParams = {}): Promise<X3MappingListResponse<X3ProductMapping>> {
    const response = await apiClient.get<X3MappingListResponse<X3ProductMapping>>(
      '/integrations/x3/mappings/products',
      { params }
    )
    return response.data
  },

  /**
   * Get a single product mapping by ID
   */
  async getById(id: number): Promise<X3ProductMapping> {
    const response = await apiClient.get<X3ProductMapping>(`/integrations/x3/mappings/products/${id}`)
    return response.data
  },

  /**
   * Get product mapping by ERP product ID
   */
  async getByProductId(productId: number): Promise<X3ProductMapping> {
    const response = await apiClient.get<X3ProductMapping>(
      `/integrations/x3/mappings/products/by-product/${productId}`
    )
    return response.data
  },

  /**
   * Create a new product mapping
   */
  async create(data: X3ProductMappingCreateDto): Promise<X3ProductMapping> {
    const response = await apiClient.post<X3ProductMapping>('/integrations/x3/mappings/products', data)
    return response.data
  },

  /**
   * Update an existing product mapping
   */
  async update(id: number, data: X3ProductMappingUpdateDto): Promise<X3ProductMapping> {
    const response = await apiClient.patch<X3ProductMapping>(`/integrations/x3/mappings/products/${id}`, data)
    return response.data
  },

  /**
   * Delete a product mapping
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/integrations/x3/mappings/products/${id}`)
  },

  /**
   * Bulk create product mappings
   */
  async bulkCreate(mappings: X3BulkMappingData[]): Promise<X3BulkMappingResponse> {
    const response = await apiClient.post<X3BulkMappingResponse>(
      '/integrations/x3/mappings/products/bulk',
      { mappings }
    )
    return response.data
  },
}

// ==========================================================================
// Mapping Statistics & Unmapped Items API
// ==========================================================================

export const x3MappingStatsApi = {
  /**
   * Get mapping statistics
   */
  async getStats(): Promise<X3MappingStats> {
    const response = await apiClient.get<{ success: boolean } & X3MappingStats>(
      '/integrations/x3/mappings/stats'
    )
    return {
      customer_mappings: response.data.customer_mappings,
      product_mappings: response.data.product_mappings,
    }
  },

  /**
   * Get list of unmapped customers
   */
  async getUnmappedCustomers(
    params: { page?: number; page_size?: number } = {}
  ): Promise<X3MappingListResponse<UnmappedCustomer>> {
    const response = await apiClient.get<X3MappingListResponse<UnmappedCustomer>>(
      '/integrations/x3/mappings/unmapped/customers',
      { params }
    )
    return response.data
  },

  /**
   * Get list of unmapped products
   */
  async getUnmappedProducts(
    params: { page?: number; page_size?: number } = {}
  ): Promise<X3MappingListResponse<UnmappedProduct>> {
    const response = await apiClient.get<X3MappingListResponse<UnmappedProduct>>(
      '/integrations/x3/mappings/unmapped/products',
      { params }
    )
    return response.data
  },
}

// ==========================================================================
// Export API
// ==========================================================================

export const x3ExportApi = {
  /**
   * Export invoices to X3 format
   */
  async exportInvoices(request: X3InvoiceExportRequest): Promise<X3InvoiceExportResponse> {
    const response = await apiClient.post<X3InvoiceExportResponse>(
      '/integrations/x3/invoices/export',
      request
    )
    return response.data
  },

  /**
   * Validate invoices before export
   */
  async validateInvoices(params: {
    date_from: string
    date_to: string
    society_id?: number
    bu_id?: number
  }): Promise<X3ValidationResponse> {
    const response = await apiClient.post<X3ValidationResponse>(
      '/integrations/x3/invoices/validate',
      null,
      { params }
    )
    return response.data
  },

  /**
   * Download export file
   */
  async downloadExport(exportId: number): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `/integrations/x3/invoices/export/${exportId}/download`,
      { responseType: 'blob' }
    )
    return response.data
  },

  /**
   * Get export logs with pagination
   */
  async getExportLogs(params: X3ExportLogSearchParams = {}): Promise<X3ExportLogListResponse> {
    const response = await apiClient.get<X3ExportLogListResponse>(
      '/integrations/x3/exports',
      { params }
    )
    return response.data
  },

  /**
   * Get a single export log by ID
   */
  async getExportLogById(exportId: number): Promise<X3ExportLog> {
    const response = await apiClient.get<X3ExportLog>(`/integrations/x3/exports/${exportId}`)
    return response.data
  },
}

// ==========================================================================
// Combined API Export
// ==========================================================================

export const x3Api = {
  customers: x3CustomerMappingApi,
  products: x3ProductMappingApi,
  stats: x3MappingStatsApi,
  exports: x3ExportApi,
}

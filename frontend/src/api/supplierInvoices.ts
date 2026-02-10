import apiClient from './client'
import type {
  SupplierInvoice,
  SupplierInvoiceListItem,
  SupplierInvoiceLine,
  SupplierInvoiceCreateDto,
  SupplierInvoiceUpdateDto,
  SupplierInvoiceLineCreateDto,
  SupplierInvoiceLineUpdateDto,
  SupplierInvoiceSearchParams,
  MarkPaidRequest,
  MarkPaidResponse,
  MarkUnpaidRequest,
  MarkUnpaidResponse,
  StartProductionRequest,
  StartProductionResponse,
  CompleteProductionRequest,
  CompleteProductionResponse,
} from '@/types/supplierInvoice'
import type { PagedResponse } from '@/types/api'

/**
 * Supplier Invoices API methods
 */
export const supplierInvoicesApi = {
  /**
   * Get paginated list of supplier invoices with optional filtering
   */
  async getAll(params: SupplierInvoiceSearchParams = {}): Promise<PagedResponse<SupplierInvoiceListItem>> {
    const queryParams: Record<string, unknown> = {}

    if (params.search) queryParams.search = params.search
    if (params.supplierId) queryParams.supplierId = params.supplierId
    if (params.societyId) queryParams.societyId = params.societyId
    if (params.currencyId) queryParams.currencyId = params.currencyId
    if (params.supplierOrderId) queryParams.supplierOrderId = params.supplierOrderId
    if (params.isPaid !== undefined) queryParams.isPaid = params.isPaid
    if (params.productionStarted !== undefined) queryParams.productionStarted = params.productionStarted
    if (params.productionComplete !== undefined) queryParams.productionComplete = params.productionComplete
    if (params.dateFrom) queryParams.dateFrom = params.dateFrom
    if (params.dateTo) queryParams.dateTo = params.dateTo
    if (params.minAmount !== undefined) queryParams.minAmount = params.minAmount
    if (params.maxAmount !== undefined) queryParams.maxAmount = params.maxAmount
    if (params.creatorId) queryParams.creatorId = params.creatorId
    if (params.page) queryParams.page = params.page
    if (params.pageSize) queryParams.pageSize = params.pageSize
    if (params.sortBy) queryParams.sortBy = params.sortBy
    if (params.sortOrder) queryParams.sortOrder = params.sortOrder

    const response = await apiClient.get('/supplier-invoices', { params: queryParams })
    const data = response.data

    // Handle different response formats
    const page = data.page || params.page || 1
    const pageSize = data.pageSize || data.page_size || params.pageSize || 20
    const totalCount = data.totalCount || data.total_count || data.total || 0
    const totalPages = data.totalPages || data.total_pages || Math.ceil(totalCount / pageSize)

    return {
      success: true,
      data: data.data || data.items || [],
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: data.hasNextPage ?? page < totalPages,
      hasPreviousPage: data.hasPreviousPage ?? page > 1,
    }
  },

  /**
   * Get a single supplier invoice by ID
   */
  async getById(id: number): Promise<SupplierInvoice> {
    const response = await apiClient.get(`/supplier-invoices/${id}`)
    return response.data.data || response.data
  },

  /**
   * Create a new supplier invoice
   */
  async create(data: SupplierInvoiceCreateDto): Promise<SupplierInvoice> {
    const response = await apiClient.post('/supplier-invoices', data)
    return response.data.data || response.data
  },

  /**
   * Update an existing supplier invoice
   */
  async update(id: number, data: SupplierInvoiceUpdateDto): Promise<SupplierInvoice> {
    const response = await apiClient.put(`/supplier-invoices/${id}`, data)
    return response.data.data || response.data
  },

  /**
   * Delete a supplier invoice
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/supplier-invoices/${id}`)
  },

  // ==================== Invoice Lines ====================

  /**
   * Get all lines for a supplier invoice
   */
  async getLines(invoiceId: number): Promise<SupplierInvoiceLine[]> {
    const response = await apiClient.get(`/supplier-invoices/${invoiceId}/lines`)
    return response.data.data || response.data
  },

  /**
   * Add a line to a supplier invoice
   */
  async addLine(invoiceId: number, line: SupplierInvoiceLineCreateDto): Promise<SupplierInvoiceLine> {
    const response = await apiClient.post(`/supplier-invoices/${invoiceId}/lines`, line)
    return response.data.data || response.data
  },

  /**
   * Update a supplier invoice line
   */
  async updateLine(
    invoiceId: number,
    lineId: number,
    line: SupplierInvoiceLineUpdateDto
  ): Promise<SupplierInvoiceLine> {
    const response = await apiClient.put(`/supplier-invoices/${invoiceId}/lines/${lineId}`, line)
    return response.data.data || response.data
  },

  /**
   * Delete a supplier invoice line
   */
  async deleteLine(invoiceId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/supplier-invoices/${invoiceId}/lines/${lineId}`)
  },

  // ==================== Payment Operations ====================

  /**
   * Mark a supplier invoice as paid
   */
  async markPaid(invoiceId: number, data: MarkPaidRequest = {}): Promise<MarkPaidResponse> {
    const response = await apiClient.post(`/supplier-invoices/${invoiceId}/mark-paid`, data)
    return response.data.data || response.data
  },

  /**
   * Mark a supplier invoice as unpaid
   */
  async markUnpaid(invoiceId: number, data?: MarkUnpaidRequest): Promise<MarkUnpaidResponse> {
    const response = await apiClient.post(`/supplier-invoices/${invoiceId}/mark-unpaid`, data || {})
    return response.data.data || response.data
  },

  // ==================== Production Operations ====================

  /**
   * Start production for a supplier invoice
   */
  async startProduction(invoiceId: number, data: StartProductionRequest = {}): Promise<StartProductionResponse> {
    const response = await apiClient.post(`/supplier-invoices/${invoiceId}/start-production`, data)
    return response.data.data || response.data
  },

  /**
   * Complete production for a supplier invoice
   */
  async completeProduction(
    invoiceId: number,
    data: CompleteProductionRequest = {}
  ): Promise<CompleteProductionResponse> {
    const response = await apiClient.post(`/supplier-invoices/${invoiceId}/complete-production`, data)
    return response.data.data || response.data
  },
}

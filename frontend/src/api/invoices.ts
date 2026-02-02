import apiClient from './client'
import type {
  Invoice,
  InvoiceListItem,
  InvoiceLine,
  InvoicePayment,
  InvoiceCreateDto,
  InvoiceUpdateDto,
  InvoiceLineCreateDto,
  InvoiceLineUpdateDto,
  InvoicePaymentCreateDto,
  InvoiceSearchParams,
  InvoiceFinancialInfo,
} from '@/types/invoice'
import type { PagedResponse } from '@/types/api'

/**
 * Invoices API methods
 */
export const invoicesApi = {
  /**
   * Get paginated list of invoices with optional filtering
   */
  async getAll(params: InvoiceSearchParams = {}): Promise<PagedResponse<InvoiceListItem>> {
    const queryParams: Record<string, any> = {}
    
    if (params.search) queryParams.search = params.search
    if (params.clientId) queryParams.client_id = params.clientId
    if (params.projectId) queryParams.project_id = params.projectId
    if (params.orderId) queryParams.order_id = params.orderId
    if (params.dateFrom) queryParams.date_from = params.dateFrom
    if (params.dateTo) queryParams.date_to = params.dateTo
    if (params.isInvoice !== undefined) queryParams.is_invoice = params.isInvoice
    if (params.isPaid !== undefined) queryParams.is_paid = params.isPaid
    if (params.isInvoiced !== undefined) queryParams.is_invoiced = params.isInvoiced
    if (params.keyProjectOnly !== undefined) queryParams.key_project_only = params.keyProjectOnly
    if (params.page) queryParams.page = params.page
    if (params.pageSize) queryParams.page_size = params.pageSize

    const response = await apiClient.get('/invoices', { params: queryParams })
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
   * Get a single invoice by ID
   */
  async getById(id: number): Promise<Invoice> {
    const response = await apiClient.get(`/invoices/${id}`)
    return response.data.data || response.data
  },

  /**
   * Create a new invoice
   */
  async create(data: InvoiceCreateDto): Promise<Invoice> {
    const response = await apiClient.post('/invoices', data)
    return response.data.data || response.data
  },

  /**
   * Update an existing invoice
   */
  async update(id: number, data: InvoiceUpdateDto): Promise<Invoice> {
    const response = await apiClient.put(`/invoices/${id}`, data)
    return response.data.data || response.data
  },

  /**
   * Delete an invoice
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/invoices/${id}`)
  },

  /**
   * Send an invoice
   */
  async send(id: number, emailTo?: string, message?: string): Promise<Invoice> {
    const response = await apiClient.post(`/invoices/${id}/send`, { emailTo, message })
    return response.data.data || response.data
  },

  /**
   * Void an invoice
   */
  async void(id: number, reason?: string): Promise<Invoice> {
    const response = await apiClient.post(`/invoices/${id}/void`, { reason })
    return response.data.data || response.data
  },

  /**
   * Get invoice financial info
   */
  async getFinancialInfo(id: number): Promise<InvoiceFinancialInfo> {
    const response = await apiClient.get(`/invoices/${id}/financial-info`)
    return response.data.data || response.data
  },

  /**
   * Create invoice from order
   */
  async createFromOrder(orderId: number, options?: { includeAllLines?: boolean }): Promise<Invoice> {
    const response = await apiClient.post(`/invoices/from-order/${orderId}`, options || {})
    return response.data.data || response.data
  },

  // ==================== Invoice Lines ====================

  /**
   * Get all lines for an invoice
   */
  async getLines(invoiceId: number): Promise<InvoiceLine[]> {
    const response = await apiClient.get(`/invoices/${invoiceId}/lines`)
    return response.data.data || response.data
  },

  /**
   * Add a line to an invoice
   */
  async addLine(invoiceId: number, line: InvoiceLineCreateDto): Promise<InvoiceLine> {
    const response = await apiClient.post(`/invoices/${invoiceId}/lines`, line)
    return response.data.data || response.data
  },

  /**
   * Update an invoice line
   */
  async updateLine(
    invoiceId: number,
    lineId: number,
    line: InvoiceLineUpdateDto
  ): Promise<InvoiceLine> {
    const response = await apiClient.put(`/invoices/${invoiceId}/lines/${lineId}`, line)
    return response.data.data || response.data
  },

  /**
   * Delete an invoice line
   */
  async deleteLine(invoiceId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/invoices/${invoiceId}/lines/${lineId}`)
  },

  // ==================== Invoice Payments ====================

  /**
   * Get all payments for an invoice
   */
  async getPayments(invoiceId: number): Promise<InvoicePayment[]> {
    const response = await apiClient.get(`/invoices/${invoiceId}/payments`)
    return response.data.data || response.data
  },

  /**
   * Record a payment for an invoice
   */
  async recordPayment(invoiceId: number, payment: InvoicePaymentCreateDto): Promise<InvoicePayment> {
    const response = await apiClient.post(`/invoices/${invoiceId}/payments`, payment)
    return response.data.data || response.data
  },

  /**
   * Delete a payment
   */
  async deletePayment(invoiceId: number, paymentId: number): Promise<void> {
    await apiClient.delete(`/invoices/${invoiceId}/payments/${paymentId}`)
  },

  // ==================== PDF Operations ====================

  /**
   * Get invoice PDF preview HTML
   */
  async getPdfPreview(id: number): Promise<string> {
    const response = await apiClient.get(`/invoices/${id}/pdf-preview`, {
      headers: { Accept: 'text/html' },
    })
    return response.data
  },

  /**
   * Generate and download invoice PDF
   */
  async downloadPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },
}

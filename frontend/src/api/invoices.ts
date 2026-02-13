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
  InvoiceDiscountRequest,
} from '@/types/invoice'
import type { PagedResponse } from '@/types/api'

export interface DeliveryInvoiceItem {
  deliveryId: number
  invoiceId: number
  invoiceReference: string
  alreadyExists: boolean
}

export interface DeliveryInvoiceBulkResult {
  success: boolean
  created: DeliveryInvoiceItem[]
  skipped: Array<{
    delivery_id?: number
    reason?: string
  }>
}

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
    if (params.pageSize) queryParams.pageSize = params.pageSize
    if (params.sortBy) queryParams.sort_by = params.sortBy
    if (params.sortOrder) queryParams.sort_order = params.sortOrder

    const response = await apiClient.get('/invoices', { params: queryParams })
    return response.data
  },

  /**
   * Get a single invoice by ID
   */
  async getById(id: number): Promise<Invoice> {
    const response = await apiClient.get(`/invoices/${id}`)
    return response.data
  },

  /**
   * Get invoices by project
   */
  async getByProject(projectId: number): Promise<InvoiceListItem[]> {
    const response = await apiClient.get(`/invoices/by-project/${projectId}`)
    return response.data
  },

  /**
   * Get invoices by quote
   */
  async getByQuote(quoteId: number): Promise<InvoiceListItem[]> {
    const response = await apiClient.get(`/invoices/by-quote/${quoteId}`)
    return response.data
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
   * Update invoice-level discount
   */
  async updateDiscount(id: number, request: InvoiceDiscountRequest): Promise<Invoice> {
    const payload = {
      discount_percentage: request.discountPercentage,
      discount_amount: request.discountAmount,
    }
    const response = await apiClient.post(`/invoices/${id}/discount`, payload)
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
    return response.data.invoice || response.data.data || response.data
  },

  /**
   * Create invoice from delivery
   */
  async createFromDelivery(deliveryId: number): Promise<DeliveryInvoiceItem> {
    const response = await apiClient.post(`/invoices/from-delivery/${deliveryId}`)
    const payload = response.data || {}
    return {
      deliveryId: payload.delivery_id ?? payload.deliveryId,
      invoiceId: payload.invoice_id ?? payload.invoiceId,
      invoiceReference: payload.invoice_reference ?? payload.invoiceReference ?? '',
      alreadyExists: Boolean(payload.already_exists ?? payload.alreadyExists),
    }
  },

  /**
   * Create invoices from deliveries in bulk
   */
  async createFromDeliveries(deliveryIds?: number[]): Promise<DeliveryInvoiceBulkResult> {
    const response = await apiClient.post('/invoices/from-deliveries', {
      delivery_ids: deliveryIds,
      include_all_lines: true,
    })
    const payload = response.data || {}
    return {
      success: Boolean(payload.success ?? true),
      created: (payload.created || []).map((item: any) => ({
        deliveryId: item.delivery_id ?? item.deliveryId,
        invoiceId: item.invoice_id ?? item.invoiceId,
        invoiceReference: item.invoice_reference ?? item.invoiceReference ?? '',
        alreadyExists: Boolean(item.already_exists ?? item.alreadyExists),
      })),
      skipped: payload.skipped || [],
    }
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
    const response = await apiClient.put(`/invoices/lines/${lineId}`, line)
    return response.data.data || response.data
  },

  /**
   * Delete an invoice line
   */
  async deleteLine(invoiceId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/invoices/lines/${lineId}`)
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
    const response = await apiClient.get(`/invoices/${id}/preview`, {
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

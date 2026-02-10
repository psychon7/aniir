import apiClient from './client'
import { isMockEnabled } from '@/mocks/delay'
import * as mockHandlers from '@/mocks/handlers/accounting'
import type { ApiResponse } from '@/types/api'
import type {
  AllocatableInvoice,
  AllocatePaymentRequest,
  AllocatePaymentResponse,
  PaymentWithAllocation,
} from '@/types/allocation'
import type {
  ReceivablesAgingParams,
  ReceivablesAgingResponse,
} from '@/types/receivables'

export type RawReceivablesAgingResponse = {
  summary: {
    as_of_date: string
    total_receivables: number | string
    buckets: Array<{
      label: string
      amount: number | string
    }>
  }
  by_client: Array<{
    client_id: number
    client_reference: string
    client_name: string
    current: number | string
    days_1_30: number | string
    days_31_60: number | string
    days_61_90: number | string
    days_over_90: number | string
    total_outstanding: number | string
    invoice_count?: number
    oldest_invoice_date?: string | null
  }>
  invoices?: Array<{
    invoice_id: number
    invoice_reference: string
    client_name: string
    invoice_date: string
    due_date: string
    total_amount: number | string
    paid_amount: number | string
    remaining_amount: number | string
    days_overdue: number
    aging_bucket: string
    currency_code?: string
    client_id: number
  }> | null
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function mapAgingBucketLabel(label: string): '0-30' | '31-60' | '61-90' | '90+' {
  const normalized = (label || '').toLowerCase()
  if (normalized.includes('31-60')) return '31-60'
  if (normalized.includes('61-90')) return '61-90'
  if (normalized.includes('90+') || normalized.includes('over 90')) return '90+'
  return '0-30'
}

function transformReceivablesAging(
  raw: RawReceivablesAgingResponse,
  params: ReceivablesAgingParams = {}
): ReceivablesAgingResponse {
  const summary: Record<'0-30' | '31-60' | '61-90' | '90+', number> = {
    '0-30': 0,
    '31-60': 0,
    '61-90': 0,
    '90+': 0,
  }

  for (const bucket of raw.summary?.buckets || []) {
    const key = mapAgingBucketLabel(bucket.label)
    summary[key] += toNumber(bucket.amount)
  }

  const invoiceByClient = new Map<number, any[]>()
  for (const invoice of raw.invoices || []) {
    const item = {
      invoiceId: invoice.invoice_id,
      invoiceReference: invoice.invoice_reference,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      totalAmount: toNumber(invoice.total_amount),
      paidAmount: toNumber(invoice.paid_amount),
      balanceDue: toNumber(invoice.remaining_amount),
      daysOverdue: invoice.days_overdue || 0,
      bucket: mapAgingBucketLabel(invoice.aging_bucket),
    }

    const list = invoiceByClient.get(invoice.client_id) || []
    list.push(item)
    invoiceByClient.set(invoice.client_id, list)
  }

  const byClient = (raw.by_client || []).map((client) => ({
    clientId: client.client_id,
    clientReference: client.client_reference || '',
    clientName: client.client_name || '',
    buckets: {
      '0-30': toNumber(client.current) + toNumber(client.days_1_30),
      '31-60': toNumber(client.days_31_60),
      '61-90': toNumber(client.days_61_90),
      '90+': toNumber(client.days_over_90),
    },
    total: toNumber(client.total_outstanding),
    invoices: invoiceByClient.get(client.client_id) || [],
  }))
  const normalizedSearch = params.search?.trim().toLowerCase()
  const filteredByClient = normalizedSearch
    ? byClient.filter((item) => {
        const haystack = `${item.clientReference} ${item.clientName}`.toLowerCase()
        return haystack.includes(normalizedSearch)
      })
    : byClient

  return {
    success: true,
    asOfDate: raw.summary?.as_of_date,
    summary,
    totalReceivables: toNumber(raw.summary?.total_receivables),
    byClient: filteredByClient,
    filters: {
      companyId: params.companyId,
      buId: params.buId,
      clientId: params.clientId,
      minAmount: params.minAmount,
      currencyId: params.currencyId,
      search: params.search,
    },
  }
}

/**
 * Accounting API methods
 * Handles payment allocation and related accounting operations
 */
export const accountingApi = {
  /**
   * Get payment details with allocation information
   */
  async getPaymentForAllocation(paymentId: number): Promise<PaymentWithAllocation> {
    if (isMockEnabled()) {
      return mockHandlers.getPaymentForAllocation(paymentId)
    }

    const response = await apiClient.get<ApiResponse<PaymentWithAllocation>>(
      `/accounting/payments/${paymentId}`
    )
    return response.data.data
  },

  /**
   * Get invoices available for allocation for a specific client
   */
  async getClientUnpaidInvoices(clientId: number): Promise<AllocatableInvoice[]> {
    if (isMockEnabled()) {
      return mockHandlers.getClientUnpaidInvoices(clientId)
    }

    const response = await apiClient.get<{ invoices: AllocatableInvoice[] }>(
      `/accounting/clients/${clientId}/unpaid-invoices`
    )
    return response.data.invoices || []
  },

  /**
   * Allocate payment to one or more invoices
   */
  async allocatePayment(
    paymentId: number,
    request: AllocatePaymentRequest
  ): Promise<AllocatePaymentResponse> {
    if (isMockEnabled()) {
      return mockHandlers.allocatePayment(paymentId, request)
    }

    const response = await apiClient.post<AllocatePaymentResponse>(
      `/accounting/payments/${paymentId}/allocate`,
      request
    )
    return response.data
  },

  /**
   * Auto-allocate payment using FIFO strategy
   */
  async autoAllocatePayment(paymentId: number): Promise<AllocatePaymentResponse> {
    if (isMockEnabled()) {
      return mockHandlers.autoAllocatePayment(paymentId)
    }

    const response = await apiClient.post<AllocatePaymentResponse>(
      `/accounting/payments/${paymentId}/auto-allocate`
    )
    return response.data
  },

  /**
   * Get accounts receivable aging report.
   */
  async getReceivablesAging(params: ReceivablesAgingParams = {}): Promise<ReceivablesAgingResponse> {
    if (isMockEnabled()) {
      return mockHandlers.getReceivablesAging(params)
    }

    const response = await apiClient.get<RawReceivablesAgingResponse>('/accounting/receivables/aging', {
      params: {
        as_of_date: params.asOfDate,
        society_id: params.companyId,
        client_id: params.clientId,
        min_amount: params.minAmount,
        include_invoices: params.includeInvoices,
        currency_id: params.currencyId,
      },
    })
    return transformReceivablesAging(response.data, params)
  },

  /**
   * Get raw receivables aging response (backend contract).
   */
  async getReceivablesAgingRaw(params: ReceivablesAgingParams = {}): Promise<RawReceivablesAgingResponse> {
    const response = await apiClient.get<RawReceivablesAgingResponse>('/accounting/receivables/aging', {
      params: {
        as_of_date: params.asOfDate,
        society_id: params.companyId,
        client_id: params.clientId,
        min_amount: params.minAmount,
        include_invoices: params.includeInvoices,
        currency_id: params.currencyId,
      },
    })
    return response.data
  },

  /**
   * Export receivables aging report to CSV
   */
  async exportReceivablesAging(params: ReceivablesAgingParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportReceivablesAgingToCSV(params)
    }

    const response = await apiClient.get<string>('/accounting/receivables-aging/export', {
      params: {
        as_of_date: params.asOfDate,
        society_id: params.companyId,
        client_id: params.clientId,
        min_amount: params.minAmount,
        currency_id: params.currencyId,
      },
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },
}

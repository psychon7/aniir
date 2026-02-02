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

    const response = await apiClient.get<ApiResponse<AllocatableInvoice[]>>(
      `/accounting/clients/${clientId}/unpaid-invoices`
    )
    return response.data.data
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
   * Get accounts receivable aging report
   */
  async getReceivablesAging(params: ReceivablesAgingParams = {}): Promise<ReceivablesAgingResponse> {
    if (isMockEnabled()) {
      return mockHandlers.getReceivablesAging(params)
    }

    const response = await apiClient.get<ReceivablesAgingResponse>(
      '/accounting/receivables-aging',
      { params }
    )
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
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },
}

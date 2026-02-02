import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type { Payment, PaymentCreateDto, PaymentUpdateDto, PaymentSearchParams } from '@/types/payment'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Payment API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const paymentsApi = {
  /**
   * Get paginated list of payments with optional filtering
   */
  async getAll(params: PaymentSearchParams = {}): Promise<PagedResponse<Payment>> {
    if (isMockEnabled()) {
      return mockHandlers.getPayments(params)
    }

    const response = await apiClient.get<PagedResponse<Payment>>('/payments', { params })
    return response.data
  },

  /**
   * Get a single payment by ID
   */
  async getById(id: number): Promise<Payment> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getPaymentById(id)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`)
    return response.data.data
  },

  /**
   * Create a new payment
   */
  async create(data: PaymentCreateDto): Promise<Payment> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createPayment(data)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Payment>>('/payments', data)
    return response.data.data
  },

  /**
   * Update an existing payment
   */
  async update(data: PaymentUpdateDto): Promise<Payment> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updatePayment(data)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<Payment>>(`/payments/${data.id}`, data)
    return response.data.data
  },

  /**
   * Delete a payment
   */
  async delete(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deletePayment(id)
      return
    }

    await apiClient.delete(`/payments/${id}`)
  },

  /**
   * Export payments to CSV
   */
  async exportCSV(params: PaymentSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportPaymentsToCSV(params)
    }

    const response = await apiClient.get<string>('/payments/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },
}

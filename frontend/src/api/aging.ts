import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type {
  AgingAnalysis,
  AgingSearchParams,
  AgingInvoiceDetail,
  AgingTrendPoint,
  BusinessUnitAgingSummary,
} from '@/types/aging'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Aging API methods
 * Provides accounts receivable aging analysis data
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const agingApi = {
  /**
   * Get overall aging analysis with bucket breakdown and client summaries
   */
  async getAnalysis(params: AgingSearchParams = {}): Promise<AgingAnalysis> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingAnalysis(params)
    }

    const response = await apiClient.get<ApiResponse<AgingAnalysis>>('/accounting/aging', { params })
    return response.data.data
  },

  /**
   * Get detailed list of overdue invoices
   */
  async getInvoiceDetails(params: AgingSearchParams = {}): Promise<PagedResponse<AgingInvoiceDetail>> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingInvoiceDetails(params)
    }

    const response = await apiClient.get<PagedResponse<AgingInvoiceDetail>>('/accounting/aging/invoices', { params })
    return response.data
  },

  /**
   * Get aging trend data for historical analysis
   */
  async getTrendData(months: number = 6): Promise<AgingTrendPoint[]> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingTrendData(months)
    }

    const response = await apiClient.get<ApiResponse<AgingTrendPoint[]>>('/accounting/aging/trend', {
      params: { months },
    })
    return response.data.data
  },

  /**
   * Get aging summary by business unit
   */
  async getByBusinessUnit(): Promise<BusinessUnitAgingSummary[]> {
    if (isMockEnabled()) {
      return mockHandlers.getAgingByBusinessUnit()
    }

    const response = await apiClient.get<ApiResponse<BusinessUnitAgingSummary[]>>('/accounting/aging/by-business-unit')
    return response.data.data
  },

  /**
   * Export aging report to CSV
   */
  async exportCSV(params: AgingSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportAgingToCSV(params)
    }

    const response = await apiClient.get<string>('/accounting/aging/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },
}

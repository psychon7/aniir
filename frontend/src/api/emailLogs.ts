import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type { EmailLog, EmailLogDetail, EmailLogSearchParams, EmailResendDto } from '@/types/emailLog'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Email logs API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const emailLogsApi = {
  /**
   * Get paginated list of email logs with optional filtering
   */
  async getAll(params: EmailLogSearchParams = {}): Promise<PagedResponse<EmailLog>> {
    if (isMockEnabled()) {
      return mockHandlers.getEmailLogs(params)
    }

    const response = await apiClient.get<PagedResponse<EmailLog>>('/email-logs', { params })
    return response.data
  },

  /**
   * Get a single email log by ID with full details
   */
  async getById(id: number): Promise<EmailLogDetail> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getEmailLogById(id)
      return response.data
    }

    const response = await apiClient.get<EmailLogDetail>(`/email-logs/${id}`)
    return response.data
  },

  /**
   * Resend an email
   */
  async resend(dto: EmailResendDto): Promise<EmailLog> {
    if (isMockEnabled()) {
      const response = await mockHandlers.resendEmail(dto)
      return response.data
    }

    const response = await apiClient.post<EmailLog>(`/email-logs/${dto.emailLogId}/resend`, dto)
    return response.data
  },

  /**
   * Get email log statistics
   */
  async getStats(): Promise<{
    total: number
    sent: number
    delivered: number
    failed: number
    bounced: number
    pending: number
    queued: number
  }> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getEmailLogStats()
      return response.data
    }

    const response = await apiClient.get<ApiResponse<{
      total: number
      sent: number
      delivered: number
      failed: number
      bounced: number
      pending: number
      queued: number
    }>>('/email-logs/stats')
    return response.data.data
  },

  /**
   * Export email logs to CSV
   */
  async exportCSV(params: EmailLogSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportEmailLogsToCSV(params)
    }

    const response = await apiClient.get<string>('/email-logs/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },
}

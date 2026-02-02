import apiClient from './client'
import * as mockHandlers from '@/mocks/handlers'
import { isMockEnabled } from '@/mocks/delay'
import type { Statement, StatementCreateDto, StatementUpdateDto, StatementSearchParams } from '@/types/statement'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Statements API methods
 * Automatically switches between mock and real API based on VITE_USE_MOCK_API env variable
 */
export const statementsApi = {
  /**
   * Get paginated list of statements with optional filtering
   */
  async getAll(params: StatementSearchParams = {}): Promise<PagedResponse<Statement>> {
    if (isMockEnabled()) {
      return mockHandlers.getStatements(params)
    }

    const response = await apiClient.get<PagedResponse<Statement>>('/statements', { params })
    return response.data
  },

  /**
   * Get a single statement by ID
   */
  async getById(id: number): Promise<Statement> {
    if (isMockEnabled()) {
      const response = await mockHandlers.getStatementById(id)
      return response.data
    }

    const response = await apiClient.get<ApiResponse<Statement>>(`/statements/${id}`)
    return response.data.data
  },

  /**
   * Create a new statement
   */
  async create(data: StatementCreateDto): Promise<Statement> {
    if (isMockEnabled()) {
      const response = await mockHandlers.createStatement(data)
      return response.data
    }

    const response = await apiClient.post<ApiResponse<Statement>>('/statements', data)
    return response.data.data
  },

  /**
   * Update an existing statement
   */
  async update(data: StatementUpdateDto): Promise<Statement> {
    if (isMockEnabled()) {
      const response = await mockHandlers.updateStatement(data)
      return response.data
    }

    const response = await apiClient.put<ApiResponse<Statement>>(`/statements/${data.id}`, data)
    return response.data.data
  },

  /**
   * Delete a statement
   */
  async delete(id: number): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.deleteStatement(id)
      return
    }

    await apiClient.delete(`/statements/${id}`)
  },

  /**
   * Export statements to CSV
   */
  async exportCSV(params: StatementSearchParams = {}): Promise<string> {
    if (isMockEnabled()) {
      return mockHandlers.exportStatementsToCSV(params)
    }

    const response = await apiClient.get<string>('/statements/export', {
      params,
      headers: { Accept: 'text/csv' },
    })
    return response.data
  },

  /**
   * Send statement to client via email
   */
  async sendToClient(id: number, email: string): Promise<void> {
    if (isMockEnabled()) {
      await mockHandlers.sendStatementToClient(id, email)
      return
    }

    await apiClient.post(`/statements/${id}/send`, { email })
  },

  /**
   * Generate statement PDF
   */
  async generatePDF(id: number): Promise<Blob> {
    if (isMockEnabled()) {
      return mockHandlers.generateStatementPDF(id)
    }

    const response = await apiClient.get(`/statements/${id}/pdf`, {
      responseType: 'blob',
    })
    return response.data
  },
}

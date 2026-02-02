import apiClient from './client'
import type {
  Quote,
  QuoteLine,
  QuoteSummary,
  QuoteCreateDto,
  QuoteUpdateDto,
  QuoteLineCreateDto,
  QuoteLineUpdateDto,
  QuoteSearchParams,
  QuoteStatusChangeRequest,
  QuoteDiscountRequest,
  QuoteCommercialRequest,
  QuoteDuplicateRequest,
} from '@/types/quote'
import type { ApiResponse, PagedResponse } from '@/types/api'

/**
 * Quotes API methods
 */
export const quotesApi = {
  // ==================== Quote CRUD Operations ====================

  /**
   * Get paginated list of quotes with optional filtering
   */
  async getAll(params: QuoteSearchParams = {}): Promise<PagedResponse<Quote>> {
    const response = await apiClient.get<PagedResponse<Quote>>('/quotes', { params })
    return response.data
  },

  /**
   * Get a single quote by ID
   */
  async getById(id: number): Promise<Quote> {
    const response = await apiClient.get<ApiResponse<Quote>>(`/quotes/${id}`)
    return response.data.data
  },

  /**
   * Create a new quote
   */
  async create(data: QuoteCreateDto): Promise<Quote> {
    const response = await apiClient.post<ApiResponse<Quote>>('/quotes', data)
    return response.data.data
  },

  /**
   * Update an existing quote
   */
  async update(id: number, data: QuoteUpdateDto): Promise<Quote> {
    const response = await apiClient.put<ApiResponse<Quote>>(`/quotes/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a quote
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/quotes/${id}`)
  },

  // ==================== Quote Lines Operations ====================

  /**
   * Get all lines for a quote
   */
  async getLines(quoteId: number): Promise<QuoteLine[]> {
    const response = await apiClient.get<ApiResponse<QuoteLine[]>>(`/quotes/${quoteId}/lines`)
    return response.data.data
  },

  /**
   * Add a line to a quote
   */
  async addLine(quoteId: number, data: QuoteLineCreateDto): Promise<QuoteLine> {
    const response = await apiClient.post<ApiResponse<QuoteLine>>(`/quotes/${quoteId}/lines`, data)
    return response.data.data
  },

  /**
   * Update a quote line
   */
  async updateLine(quoteId: number, lineId: number, data: QuoteLineUpdateDto): Promise<QuoteLine> {
    const response = await apiClient.put<ApiResponse<QuoteLine>>(
      `/quotes/${quoteId}/lines/${lineId}`,
      data
    )
    return response.data.data
  },

  /**
   * Delete a quote line
   */
  async deleteLine(quoteId: number, lineId: number): Promise<void> {
    await apiClient.delete(`/quotes/${quoteId}/lines/${lineId}`)
  },

  /**
   * Duplicate a quote line
   */
  async duplicateLine(quoteId: number, lineId: number): Promise<QuoteLine[]> {
    const response = await apiClient.post<ApiResponse<QuoteLine[]>>(
      `/quotes/${quoteId}/lines/${lineId}/duplicate`
    )
    return response.data.data
  },

  // ==================== Quote Actions ====================

  /**
   * Duplicate a quote
   */
  async duplicate(id: number, request?: QuoteDuplicateRequest): Promise<Quote> {
    const response = await apiClient.post<ApiResponse<Quote>>(
      `/quotes/${id}/duplicate`,
      request || {}
    )
    return response.data.data
  },

  /**
   * Convert quote to client order
   */
  async convertToOrder(id: number): Promise<{ orderId: number }> {
    const response = await apiClient.post<ApiResponse<{ orderId: number }>>(
      `/quotes/${id}/convert-to-order`
    )
    return response.data.data
  },

  /**
   * Change status of multiple quotes
   */
  async changeStatus(request: QuoteStatusChangeRequest): Promise<void> {
    await apiClient.post('/quotes/change-status', request)
  },

  /**
   * Update quote discount
   */
  async updateDiscount(id: number, request: QuoteDiscountRequest): Promise<Quote> {
    const response = await apiClient.post<ApiResponse<Quote>>(`/quotes/${id}/discount`, request)
    return response.data.data
  },

  /**
   * Update quote commercials
   */
  async updateCommercials(id: number, request: QuoteCommercialRequest): Promise<Quote> {
    const response = await apiClient.post<ApiResponse<Quote>>(`/quotes/${id}/commercials`, request)
    return response.data.data
  },

  // ==================== Query Operations ====================

  /**
   * Get quotes by project ID
   */
  async getByProject(projectId: number): Promise<Quote[]> {
    const response = await apiClient.get<ApiResponse<Quote[]>>(`/quotes/by-project/${projectId}`)
    return response.data.data
  },

  /**
   * Get quotes in progress (for dashboard widget)
   */
  async getInProgress(): Promise<Quote[]> {
    const response = await apiClient.get<ApiResponse<Quote[]>>('/quotes/in-progress')
    return response.data.data
  },

  /**
   * Get recent quotes in progress (this month and last month)
   */
  async getRecentInProgress(): Promise<Quote[]> {
    const response = await apiClient.get<ApiResponse<Quote[]>>('/quotes/recent-in-progress')
    return response.data.data
  },

  /**
   * Get quote summary/info (totals, margins, etc.)
   */
  async getSummary(id: number): Promise<QuoteSummary> {
    const response = await apiClient.get<ApiResponse<QuoteSummary>>(`/quotes/${id}/summary`)
    return response.data.data
  },
}

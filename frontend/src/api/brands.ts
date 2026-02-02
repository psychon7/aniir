import apiClient from './client'
import type { Brand, BrandCreateDto, BrandUpdateDto, BrandSearchParams } from '@/types/brand'
import type { ApiResponse, KeyValue } from '@/types/api'

/**
 * Brand API methods
 */
export const brandsApi = {
  /**
   * Get all brands for the current society
   */
  async getAll(params: BrandSearchParams = {}): Promise<Brand[]> {
    const response = await apiClient.get<ApiResponse<Brand[]>>('/brands', { params })
    return response.data.data
  },

  /**
   * Get a single brand by ID
   */
  async getById(id: number): Promise<Brand> {
    const response = await apiClient.get<ApiResponse<Brand>>(`/brands/${id}`)
    return response.data.data
  },

  /**
   * Search brands by name or code
   */
  async search(query: string): Promise<Brand[]> {
    const response = await apiClient.get<ApiResponse<Brand[]>>('/brands/search', {
      params: { q: query },
    })
    return response.data.data
  },

  /**
   * Get brands for dropdown/lookup (active brands only)
   */
  async getLookup(): Promise<KeyValue[]> {
    const response = await apiClient.get<ApiResponse<KeyValue[]>>('/brands/lookup')
    return response.data.data
  },

  /**
   * Create a new brand
   */
  async create(data: BrandCreateDto): Promise<Brand> {
    const response = await apiClient.post<ApiResponse<Brand>>('/brands', data)
    return response.data.data
  },

  /**
   * Update an existing brand
   */
  async update(id: number, data: BrandUpdateDto): Promise<Brand> {
    const response = await apiClient.put<ApiResponse<Brand>>(`/brands/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a brand
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/brands/${id}`)
  },
}

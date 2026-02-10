import apiClient from './client'
import type {
  Category,
  CategoryCreateDto,
  CategoryListResponse,
  CategoryUpdateDto,
} from '@/types/category'

export const categoriesApi = {
  async list(params: {
    skip?: number
    limit?: number
    search?: string
    parent_id?: number
    root_only?: boolean
    active_only?: boolean
    society_id?: number
  } = {}): Promise<CategoryListResponse> {
    const response = await apiClient.get<CategoryListResponse>('/categories', { params })
    return response.data
  },

  async create(data: CategoryCreateDto): Promise<Category> {
    const response = await apiClient.post<Category>('/categories', data)
    return response.data
  },

  async update(categoryId: number, data: CategoryUpdateDto): Promise<Category> {
    const response = await apiClient.put<Category>(`/categories/${categoryId}`, data)
    return response.data
  },

  async delete(categoryId: number): Promise<void> {
    await apiClient.delete(`/categories/${categoryId}`)
  },
}


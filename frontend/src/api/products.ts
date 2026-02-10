import apiClient from './client'

export interface ProductListItem {
  id: number
  reference: string
  name: string
  description: string | null
  code: string | null
  unitPrice: number | null
  costPrice: number | null
  productTypeId: number
  societyId: number
  categoryName: string | null
  brandName: string | null
  stockQuantity: number | null
  isActive: boolean
  displayName: string
}

export interface ProductListPaginatedResponse {
  success: boolean
  data: ProductListItem[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface ProductSearchParams {
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function searchProducts(
  params: ProductSearchParams = {}
): Promise<ProductListPaginatedResponse> {
  const response = await apiClient.get<ProductListPaginatedResponse>('/products', { params })
  return response.data
}

export interface ProductLookupItem {
  id: number
  reference: string
  name: string
  code: string | null
  price: number | null
  displayName: string
}

export async function getProductLookup(
  socId: number,
  search?: string,
  limit: number = 50
): Promise<ProductLookupItem[]> {
  const response = await apiClient.get<ProductLookupItem[]>('/products/lookup', {
    params: { soc_id: socId, search, limit }
  })
  return response.data
}

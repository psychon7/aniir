/**
 * API client for Client and Supplier Product Pricing
 */
import apiClient from './client'
import type {
  ClientProductPrice,
  ClientProductPriceCreateDto,
  ClientProductPriceUpdateDto,
  ClientProductPricePagedResponse,
  ClientProductPriceResponse,
  SupplierProductPrice,
  SupplierProductPriceCreateDto,
  SupplierProductPriceUpdateDto,
  SupplierProductPricePagedResponse,
  SupplierProductPriceResponse,
  SupplierProduct,
  SupplierProductPagedResponse,
  BestSupplierPrice,
} from '@/types/pricing'

// =============================================================================
// Client Product Prices API
// =============================================================================

/**
 * Get paginated list of client product prices
 */
export async function getClientPrices(
  clientId: number,
  params?: {
    page?: number
    pageSize?: number
    productId?: number
    activeOnly?: boolean
  }
): Promise<ClientProductPricePagedResponse> {
  const { data } = await apiClient.get(`/clients/${clientId}/prices`, { params })
  return data
}

/**
 * Get a specific client product price
 */
export async function getClientPrice(
  clientId: number,
  priceId: number
): Promise<ClientProductPriceResponse> {
  const { data } = await apiClient.get(`/clients/${clientId}/prices/${priceId}`)
  return data
}

/**
 * Create a new client product price
 */
export async function createClientPrice(
  clientId: number,
  priceData: ClientProductPriceCreateDto
): Promise<ClientProductPriceResponse> {
  const payload = { ...priceData, cpp_cli_id: clientId }
  const { data } = await apiClient.post(`/clients/${clientId}/prices`, payload)
  return data
}

/**
 * Update a client product price
 */
export async function updateClientPrice(
  clientId: number,
  priceId: number,
  priceData: ClientProductPriceUpdateDto
): Promise<ClientProductPriceResponse> {
  const { data } = await apiClient.put(`/clients/${clientId}/prices/${priceId}`, priceData)
  return data
}

/**
 * Delete a client product price (soft delete)
 */
export async function deleteClientPrice(
  clientId: number,
  priceId: number
): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/prices/${priceId}`)
}

// =============================================================================
// Supplier Product Prices API
// =============================================================================

/**
 * Get paginated list of supplier product prices
 */
export async function getSupplierPrices(
  supplierId: number,
  params?: {
    page?: number
    pageSize?: number
    productId?: number
    activeOnly?: boolean
  }
): Promise<SupplierProductPricePagedResponse> {
  const { data } = await apiClient.get(`/suppliers/${supplierId}/prices`, { params })
  return data
}

/**
 * Get paginated list of products supplied by a supplier
 */
export async function getSupplierProducts(
  supplierId: number,
  params?: {
    page?: number
    pageSize?: number
    search?: string
    activeOnly?: boolean
  }
): Promise<SupplierProductPagedResponse> {
  const { data } = await apiClient.get(`/suppliers/${supplierId}/products`, { params })
  return data
}

/**
 * Get a specific supplier product price
 */
export async function getSupplierPrice(
  supplierId: number,
  priceId: number
): Promise<SupplierProductPriceResponse> {
  const { data } = await apiClient.get(`/suppliers/${supplierId}/prices/${priceId}`)
  return data
}

/**
 * Create a new supplier product price
 */
export async function createSupplierPrice(
  supplierId: number,
  priceData: SupplierProductPriceCreateDto
): Promise<SupplierProductPriceResponse> {
  const payload = { ...priceData, spp_sup_id: supplierId }
  const { data } = await apiClient.post(`/suppliers/${supplierId}/prices`, payload)
  return data
}

/**
 * Update a supplier product price
 */
export async function updateSupplierPrice(
  supplierId: number,
  priceId: number,
  priceData: SupplierProductPriceUpdateDto
): Promise<SupplierProductPriceResponse> {
  const { data } = await apiClient.put(`/suppliers/${supplierId}/prices/${priceId}`, priceData)
  return data
}

/**
 * Delete a supplier product price (soft delete)
 */
export async function deleteSupplierPrice(
  supplierId: number,
  priceId: number
): Promise<void> {
  await apiClient.delete(`/suppliers/${supplierId}/prices/${priceId}`)
}

/**
 * Set a supplier as preferred for a product
 */
export async function setPreferredSupplier(
  supplierId: number,
  priceId: number
): Promise<SupplierProductPriceResponse> {
  const { data } = await apiClient.patch(`/suppliers/${supplierId}/prices/${priceId}/preferred`)
  return data
}

/**
 * Get the best supplier price for a product
 */
export async function getBestSupplierPrice(
  productId: number,
  quantity?: number
): Promise<BestSupplierPrice> {
  const params = quantity ? { quantity } : undefined
  const { data } = await apiClient.get(`/suppliers/best-price/product/${productId}`, { params })
  return data
}

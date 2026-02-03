/**
 * Product Attributes API client.
 */
import api from './client'
import type {
  ProductAttribute,
  ProductAttributeCreateDto,
  ProductAttributeUpdateDto,
  ProductAttributePaginatedResponse,
  ProductAttributeListParams,
  ProductAttributeValue,
  ProductAttributeValueCreateDto,
  ProductAttributeValuesResponse,
  ProductAttributeValuesBatchUpdateDto,
  AttributeDataTypeInfo,
} from '@/types/productAttribute'

// =============================================================================
// Attribute Definition CRUD
// =============================================================================

/**
 * Get paginated list of product attributes
 */
export async function getProductAttributes(
  params: ProductAttributeListParams = {}
): Promise<ProductAttributePaginatedResponse> {
  const response = await api.get<ProductAttributePaginatedResponse>('/product-attributes', {
    params,
  })
  return response.data
}

/**
 * Get a single product attribute by ID
 */
export async function getProductAttribute(attributeId: number): Promise<ProductAttribute> {
  const response = await api.get<ProductAttribute>(`/product-attributes/${attributeId}`)
  return response.data
}

/**
 * Get a product attribute by code
 */
export async function getProductAttributeByCode(code: string): Promise<ProductAttribute> {
  const response = await api.get<ProductAttribute>(`/product-attributes/code/${code}`)
  return response.data
}

/**
 * Create a new product attribute
 */
export async function createProductAttribute(
  data: ProductAttributeCreateDto
): Promise<ProductAttribute> {
  const response = await api.post<ProductAttribute>('/product-attributes', data)
  return response.data
}

/**
 * Update an existing product attribute
 */
export async function updateProductAttribute(
  attributeId: number,
  data: ProductAttributeUpdateDto
): Promise<ProductAttribute> {
  const response = await api.put<ProductAttribute>(`/product-attributes/${attributeId}`, data)
  return response.data
}

/**
 * Delete a product attribute
 */
export async function deleteProductAttribute(
  attributeId: number,
  hardDelete: boolean = false
): Promise<void> {
  await api.delete(`/product-attributes/${attributeId}`, { params: { hardDelete } })
}

// =============================================================================
// Product Attribute Values
// =============================================================================

/**
 * Get all attribute values for a product
 */
export async function getProductAttributeValues(
  productId: number
): Promise<ProductAttributeValuesResponse> {
  const response = await api.get<ProductAttributeValuesResponse>(
    `/product-attributes/products/${productId}/values`
  )
  return response.data
}

/**
 * Set an attribute value for a product
 */
export async function setProductAttributeValue(
  productId: number,
  data: ProductAttributeValueCreateDto
): Promise<ProductAttributeValue> {
  const response = await api.post<ProductAttributeValue>(
    `/product-attributes/products/${productId}/values`,
    data
  )
  return response.data
}

/**
 * Batch update attribute values for a product
 */
export async function batchUpdateProductAttributeValues(
  productId: number,
  data: ProductAttributeValuesBatchUpdateDto
): Promise<ProductAttributeValue[]> {
  const response = await api.put<ProductAttributeValue[]>(
    `/product-attributes/products/${productId}/values/batch`,
    data
  )
  return response.data
}

/**
 * Delete an attribute value from a product
 */
export async function deleteProductAttributeValue(
  productId: number,
  attributeId: number
): Promise<void> {
  await api.delete(`/product-attributes/products/${productId}/values/${attributeId}`)
}

// =============================================================================
// Utility Endpoints
// =============================================================================

/**
 * Get list of available attribute data types
 */
export async function getAttributeDataTypes(): Promise<AttributeDataTypeInfo[]> {
  const response = await api.get<AttributeDataTypeInfo[]>('/product-attributes/data-types')
  return response.data
}

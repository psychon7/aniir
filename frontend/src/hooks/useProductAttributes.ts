/**
 * React Query hooks for Product Attributes.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProductAttributes,
  getProductAttribute,
  getProductAttributeByCode,
  createProductAttribute,
  updateProductAttribute,
  deleteProductAttribute,
  getProductAttributeValues,
  setProductAttributeValue,
  batchUpdateProductAttributeValues,
  deleteProductAttributeValue,
  getAttributeDataTypes,
} from '@/api/productAttributes'
import type {
  ProductAttributeCreateDto,
  ProductAttributeUpdateDto,
  ProductAttributeListParams,
  ProductAttributeValueCreateDto,
  ProductAttributeValuesBatchUpdateDto,
} from '@/types/productAttribute'

// =============================================================================
// Query Keys
// =============================================================================

export const productAttributeKeys = {
  all: ['productAttributes'] as const,
  lists: () => [...productAttributeKeys.all, 'list'] as const,
  list: (params?: ProductAttributeListParams) => [...productAttributeKeys.lists(), params] as const,
  details: () => [...productAttributeKeys.all, 'detail'] as const,
  detail: (id: number) => [...productAttributeKeys.details(), id] as const,
  byCode: (code: string) => [...productAttributeKeys.all, 'code', code] as const,
  dataTypes: () => [...productAttributeKeys.all, 'dataTypes'] as const,
  // Product values
  values: () => [...productAttributeKeys.all, 'values'] as const,
  productValues: (productId: number) => [...productAttributeKeys.values(), productId] as const,
}

// =============================================================================
// Attribute Definition Queries
// =============================================================================

/**
 * Get paginated list of product attributes
 */
export function useProductAttributes(params: ProductAttributeListParams = {}) {
  return useQuery({
    queryKey: productAttributeKeys.list(params),
    queryFn: () => getProductAttributes(params),
  })
}

/**
 * Get a single product attribute by ID
 */
export function useProductAttribute(attributeId: number) {
  return useQuery({
    queryKey: productAttributeKeys.detail(attributeId),
    queryFn: () => getProductAttribute(attributeId),
    enabled: attributeId > 0,
  })
}

/**
 * Get a product attribute by code
 */
export function useProductAttributeByCode(code: string) {
  return useQuery({
    queryKey: productAttributeKeys.byCode(code),
    queryFn: () => getProductAttributeByCode(code),
    enabled: Boolean(code),
  })
}

/**
 * Get list of available attribute data types
 */
export function useAttributeDataTypes() {
  return useQuery({
    queryKey: productAttributeKeys.dataTypes(),
    queryFn: () => getAttributeDataTypes(),
    staleTime: Infinity, // Static data, never goes stale
  })
}

// =============================================================================
// Attribute Definition Mutations
// =============================================================================

/**
 * Create a new product attribute
 */
export function useCreateProductAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProductAttributeCreateDto) => createProductAttribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productAttributeKeys.lists() })
    },
  })
}

/**
 * Update an existing product attribute
 */
export function useUpdateProductAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      attributeId,
      data,
    }: {
      attributeId: number
      data: ProductAttributeUpdateDto
    }) => updateProductAttribute(attributeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productAttributeKeys.detail(variables.attributeId),
      })
      queryClient.invalidateQueries({ queryKey: productAttributeKeys.lists() })
    },
  })
}

/**
 * Delete a product attribute
 */
export function useDeleteProductAttribute() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      attributeId,
      hardDelete,
    }: {
      attributeId: number
      hardDelete?: boolean
    }) => deleteProductAttribute(attributeId, hardDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productAttributeKeys.all })
    },
  })
}

// =============================================================================
// Product Attribute Value Queries
// =============================================================================

/**
 * Get all attribute values for a product
 */
export function useProductAttributeValues(productId: number) {
  return useQuery({
    queryKey: productAttributeKeys.productValues(productId),
    queryFn: () => getProductAttributeValues(productId),
    enabled: productId > 0,
  })
}

// =============================================================================
// Product Attribute Value Mutations
// =============================================================================

/**
 * Set an attribute value for a product
 */
export function useSetProductAttributeValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number
      data: ProductAttributeValueCreateDto
    }) => setProductAttributeValue(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productAttributeKeys.productValues(variables.productId),
      })
    },
  })
}

/**
 * Batch update attribute values for a product
 */
export function useBatchUpdateProductAttributeValues() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number
      data: ProductAttributeValuesBatchUpdateDto
    }) => batchUpdateProductAttributeValues(productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productAttributeKeys.productValues(variables.productId),
      })
    },
  })
}

/**
 * Delete an attribute value from a product
 */
export function useDeleteProductAttributeValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      attributeId,
    }: {
      productId: number
      attributeId: number
    }) => deleteProductAttributeValue(productId, attributeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: productAttributeKeys.productValues(variables.productId),
      })
    },
  })
}

/**
 * X3 Mappings Hooks
 * React Query hooks for X3 customer and product mapping CRUD operations
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { x3CustomerMappingApi, x3ProductMappingApi, x3MappingStatsApi } from '@/api/x3'
import type {
  X3CustomerMappingCreateDto,
  X3CustomerMappingUpdateDto,
  X3CustomerMappingSearchParams,
  X3ProductMappingCreateDto,
  X3ProductMappingUpdateDto,
  X3ProductMappingSearchParams,
  X3BulkMappingData,
} from '@/types/x3'

// ==========================================================================
// Query Keys
// ==========================================================================

export const x3MappingKeys = {
  all: ['x3-mappings'] as const,

  // Customer mappings
  customers: () => [...x3MappingKeys.all, 'customers'] as const,
  customerLists: () => [...x3MappingKeys.customers(), 'list'] as const,
  customerList: (params: X3CustomerMappingSearchParams) => [...x3MappingKeys.customerLists(), params] as const,
  customerDetails: () => [...x3MappingKeys.customers(), 'detail'] as const,
  customerDetail: (id: number) => [...x3MappingKeys.customerDetails(), id] as const,
  customerByClient: (clientId: number) => [...x3MappingKeys.customers(), 'by-client', clientId] as const,

  // Product mappings
  products: () => [...x3MappingKeys.all, 'products'] as const,
  productLists: () => [...x3MappingKeys.products(), 'list'] as const,
  productList: (params: X3ProductMappingSearchParams) => [...x3MappingKeys.productLists(), params] as const,
  productDetails: () => [...x3MappingKeys.products(), 'detail'] as const,
  productDetail: (id: number) => [...x3MappingKeys.productDetails(), id] as const,
  productByProduct: (productId: number) => [...x3MappingKeys.products(), 'by-product', productId] as const,

  // Stats and unmapped
  stats: () => [...x3MappingKeys.all, 'stats'] as const,
  unmappedCustomers: () => [...x3MappingKeys.all, 'unmapped-customers'] as const,
  unmappedProducts: () => [...x3MappingKeys.all, 'unmapped-products'] as const,
}

// ==========================================================================
// Customer Mapping Hooks
// ==========================================================================

/**
 * Hook to fetch paginated list of customer mappings
 */
export function useX3CustomerMappings(params: X3CustomerMappingSearchParams = {}) {
  return useQuery({
    queryKey: x3MappingKeys.customerList(params),
    queryFn: () => x3CustomerMappingApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single customer mapping by ID
 */
export function useX3CustomerMapping(id: number) {
  return useQuery({
    queryKey: x3MappingKeys.customerDetail(id),
    queryFn: () => x3CustomerMappingApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch customer mapping by ERP client ID
 */
export function useX3CustomerMappingByClient(clientId: number) {
  return useQuery({
    queryKey: x3MappingKeys.customerByClient(clientId),
    queryFn: () => x3CustomerMappingApi.getByClientId(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to create a new customer mapping
 */
export function useCreateX3CustomerMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: X3CustomerMappingCreateDto) => x3CustomerMappingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.customerLists() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.stats() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.unmappedCustomers() })
    },
  })
}

/**
 * Hook to update an existing customer mapping
 */
export function useUpdateX3CustomerMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: X3CustomerMappingUpdateDto }) =>
      x3CustomerMappingApi.update(id, data),
    onSuccess: (updatedMapping) => {
      queryClient.setQueryData(x3MappingKeys.customerDetail(updatedMapping.id), updatedMapping)
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.customerLists() })
    },
  })
}

/**
 * Hook to delete a customer mapping
 */
export function useDeleteX3CustomerMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => x3CustomerMappingApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: x3MappingKeys.customerDetail(deletedId) })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.customerLists() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.stats() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.unmappedCustomers() })
    },
  })
}

/**
 * Hook to bulk create customer mappings
 */
export function useBulkCreateX3CustomerMappings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mappings: X3BulkMappingData[]) => x3CustomerMappingApi.bulkCreate(mappings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.customerLists() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.stats() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.unmappedCustomers() })
    },
  })
}

// ==========================================================================
// Product Mapping Hooks
// ==========================================================================

/**
 * Hook to fetch paginated list of product mappings
 */
export function useX3ProductMappings(params: X3ProductMappingSearchParams = {}) {
  return useQuery({
    queryKey: x3MappingKeys.productList(params),
    queryFn: () => x3ProductMappingApi.getAll(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch a single product mapping by ID
 */
export function useX3ProductMapping(id: number) {
  return useQuery({
    queryKey: x3MappingKeys.productDetail(id),
    queryFn: () => x3ProductMappingApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch product mapping by ERP product ID
 */
export function useX3ProductMappingByProduct(productId: number) {
  return useQuery({
    queryKey: x3MappingKeys.productByProduct(productId),
    queryFn: () => x3ProductMappingApi.getByProductId(productId),
    enabled: !!productId,
  })
}

/**
 * Hook to create a new product mapping
 */
export function useCreateX3ProductMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: X3ProductMappingCreateDto) => x3ProductMappingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.productLists() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.stats() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.unmappedProducts() })
    },
  })
}

/**
 * Hook to update an existing product mapping
 */
export function useUpdateX3ProductMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: X3ProductMappingUpdateDto }) =>
      x3ProductMappingApi.update(id, data),
    onSuccess: (updatedMapping) => {
      queryClient.setQueryData(x3MappingKeys.productDetail(updatedMapping.id), updatedMapping)
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.productLists() })
    },
  })
}

/**
 * Hook to delete a product mapping
 */
export function useDeleteX3ProductMapping() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => x3ProductMappingApi.delete(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: x3MappingKeys.productDetail(deletedId) })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.productLists() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.stats() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.unmappedProducts() })
    },
  })
}

/**
 * Hook to bulk create product mappings
 */
export function useBulkCreateX3ProductMappings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (mappings: X3BulkMappingData[]) => x3ProductMappingApi.bulkCreate(mappings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.productLists() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.stats() })
      queryClient.invalidateQueries({ queryKey: x3MappingKeys.unmappedProducts() })
    },
  })
}

// ==========================================================================
// Stats & Unmapped Hooks
// ==========================================================================

/**
 * Hook to fetch mapping statistics
 */
export function useX3MappingStats() {
  return useQuery({
    queryKey: x3MappingKeys.stats(),
    queryFn: () => x3MappingStatsApi.getStats(),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to fetch unmapped customers
 */
export function useUnmappedCustomers(params: { page?: number; page_size?: number } = {}) {
  return useQuery({
    queryKey: [...x3MappingKeys.unmappedCustomers(), params],
    queryFn: () => x3MappingStatsApi.getUnmappedCustomers(params),
    staleTime: 30 * 1000,
  })
}

/**
 * Hook to fetch unmapped products
 */
export function useUnmappedProducts(params: { page?: number; page_size?: number } = {}) {
  return useQuery({
    queryKey: [...x3MappingKeys.unmappedProducts(), params],
    queryFn: () => x3MappingStatsApi.getUnmappedProducts(params),
    staleTime: 30 * 1000,
  })
}

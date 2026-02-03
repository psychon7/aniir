/**
 * React Query hooks for Client and Supplier Product Pricing
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClientPrices,
  getClientPrice,
  createClientPrice,
  updateClientPrice,
  deleteClientPrice,
  getSupplierPrices,
  getSupplierProducts,
  getSupplierPrice,
  createSupplierPrice,
  updateSupplierPrice,
  deleteSupplierPrice,
  setPreferredSupplier,
  getBestSupplierPrice,
} from '@/api/pricing'
import type {
  ClientProductPriceCreateDto,
  ClientProductPriceUpdateDto,
  SupplierProductPriceCreateDto,
  SupplierProductPriceUpdateDto,
} from '@/types/pricing'

// =============================================================================
// Query Keys
// =============================================================================

export const pricingKeys = {
  all: ['pricing'] as const,
  clientPrices: (clientId: number) => [...pricingKeys.all, 'client', clientId, 'prices'] as const,
  clientPricesList: (clientId: number, params?: object) =>
    [...pricingKeys.clientPrices(clientId), 'list', params] as const,
  clientPriceDetail: (clientId: number, priceId: number) =>
    [...pricingKeys.clientPrices(clientId), priceId] as const,
  supplierPrices: (supplierId: number) =>
    [...pricingKeys.all, 'supplier', supplierId, 'prices'] as const,
  supplierPricesList: (supplierId: number, params?: object) =>
    [...pricingKeys.supplierPrices(supplierId), 'list', params] as const,
  supplierPriceDetail: (supplierId: number, priceId: number) =>
    [...pricingKeys.supplierPrices(supplierId), priceId] as const,
  supplierProducts: (supplierId: number) =>
    [...pricingKeys.all, 'supplier', supplierId, 'products'] as const,
  supplierProductsList: (supplierId: number, params?: object) =>
    [...pricingKeys.supplierProducts(supplierId), 'list', params] as const,
  bestPrice: (productId: number, quantity?: number) =>
    [...pricingKeys.all, 'best-price', productId, quantity] as const,
}

// =============================================================================
// Client Product Prices Hooks
// =============================================================================

/**
 * Hook to fetch paginated client product prices
 */
export function useClientPrices(
  clientId: number,
  params?: {
    page?: number
    pageSize?: number
    productId?: number
    activeOnly?: boolean
  },
  enabled = true
) {
  return useQuery({
    queryKey: pricingKeys.clientPricesList(clientId, params),
    queryFn: () => getClientPrices(clientId, params),
    enabled: enabled && clientId > 0,
  })
}

/**
 * Hook to fetch a single client product price
 */
export function useClientPrice(clientId: number, priceId: number, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.clientPriceDetail(clientId, priceId),
    queryFn: () => getClientPrice(clientId, priceId),
    enabled: enabled && clientId > 0 && priceId > 0,
  })
}

/**
 * Hook to create a client product price
 */
export function useCreateClientPrice(clientId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ClientProductPriceCreateDto) => createClientPrice(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.clientPrices(clientId) })
    },
  })
}

/**
 * Hook to update a client product price
 */
export function useUpdateClientPrice(clientId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ priceId, data }: { priceId: number; data: ClientProductPriceUpdateDto }) =>
      updateClientPrice(clientId, priceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.clientPrices(clientId) })
    },
  })
}

/**
 * Hook to delete a client product price
 */
export function useDeleteClientPrice(clientId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (priceId: number) => deleteClientPrice(clientId, priceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.clientPrices(clientId) })
    },
  })
}

// =============================================================================
// Supplier Product Prices Hooks
// =============================================================================

/**
 * Hook to fetch paginated supplier product prices
 */
export function useSupplierPrices(
  supplierId: number,
  params?: {
    page?: number
    pageSize?: number
    productId?: number
    activeOnly?: boolean
  },
  enabled = true
) {
  return useQuery({
    queryKey: pricingKeys.supplierPricesList(supplierId, params),
    queryFn: () => getSupplierPrices(supplierId, params),
    enabled: enabled && supplierId > 0,
  })
}

/**
 * Hook to fetch paginated supplier products
 */
export function useSupplierProducts(
  supplierId: number,
  params?: {
    page?: number
    pageSize?: number
    search?: string
    activeOnly?: boolean
  },
  enabled = true
) {
  return useQuery({
    queryKey: pricingKeys.supplierProductsList(supplierId, params),
    queryFn: () => getSupplierProducts(supplierId, params),
    enabled: enabled && supplierId > 0,
  })
}

/**
 * Hook to fetch a single supplier product price
 */
export function useSupplierPrice(supplierId: number, priceId: number, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.supplierPriceDetail(supplierId, priceId),
    queryFn: () => getSupplierPrice(supplierId, priceId),
    enabled: enabled && supplierId > 0 && priceId > 0,
  })
}

/**
 * Hook to create a supplier product price
 */
export function useCreateSupplierPrice(supplierId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SupplierProductPriceCreateDto) => createSupplierPrice(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierPrices(supplierId) })
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierProducts(supplierId) })
    },
  })
}

/**
 * Hook to update a supplier product price
 */
export function useUpdateSupplierPrice(supplierId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ priceId, data }: { priceId: number; data: SupplierProductPriceUpdateDto }) =>
      updateSupplierPrice(supplierId, priceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierPrices(supplierId) })
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierProducts(supplierId) })
    },
  })
}

/**
 * Hook to delete a supplier product price
 */
export function useDeleteSupplierPrice(supplierId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (priceId: number) => deleteSupplierPrice(supplierId, priceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierPrices(supplierId) })
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierProducts(supplierId) })
    },
  })
}

/**
 * Hook to set a supplier as preferred
 */
export function useSetPreferredSupplier(supplierId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (priceId: number) => setPreferredSupplier(supplierId, priceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierPrices(supplierId) })
      queryClient.invalidateQueries({ queryKey: pricingKeys.supplierProducts(supplierId) })
      queryClient.invalidateQueries({ queryKey: pricingKeys.all })
    },
  })
}

/**
 * Hook to get the best supplier price for a product
 */
export function useBestSupplierPrice(productId: number, quantity?: number, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.bestPrice(productId, quantity),
    queryFn: () => getBestSupplierPrice(productId, quantity),
    enabled: enabled && productId > 0,
  })
}
